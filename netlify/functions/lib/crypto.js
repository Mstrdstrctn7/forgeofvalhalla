import crypto from 'crypto';

/**
 * Decrypts JSON that was encrypted two possible ways:
 * - "ENCv1:<base64(iv[12] | tag[16] | ciphertext)>"  (AES-256-GCM, key = sha256(CRED_ENC_KEY))
 * - OpenSSL "-aes-256-cbc -a -pbkdf2 -k <pass>"      (Base64; "Salted__" + salt[8]; PBKDF2-SHA256 -> 32+16)
 */
export function decryptJson(enc) {
  if (!enc) throw new Error('empty_enc');
  const pass = process.env.CRED_ENC_KEY || '';
  if (!pass) throw new Error('no_CRED_ENC_KEY');

  // --- v1: AES-256-GCM (preferred) ---
  if (enc.startsWith('ENCv1:')) {
    const key = crypto.createHash('sha256').update(String(pass)).digest(); // 32 bytes
    const raw = Buffer.from(enc.slice(6), 'base64');
    if (raw.length < 12 + 16 + 1) throw new Error('encv1_too_short');

    const iv  = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ct  = raw.subarray(28);

    const dec = crypto.createDecipheriv('aes-256-gcm', key, iv);
    dec.setAuthTag(tag);
    const pt = Buffer.concat([dec.update(ct), dec.final()]);
    return JSON.parse(pt.toString('utf8'));
  }

  // --- Legacy OpenSSL AES-256-CBC + PBKDF2 (base64 with "Salted__") ---
  // This matches: `openssl enc -aes-256-cbc -a -pbkdf2 -k "$CRED_ENC_KEY"`
  const raw = Buffer.from(enc, 'base64');
  const header = raw.subarray(0, 8).toString('ascii');
  if (header !== 'Salted__') throw new Error('unknown_enc_format');

  const salt = raw.subarray(8, 16);      // 8 bytes
  const ct   = raw.subarray(16);

  // OpenSSL pbkdf2 defaults: SHA256, 10k iterations, need 32+16 bytes
  const keyiv = crypto.pbkdf2Sync(Buffer.from(pass, 'utf8'), salt, 10000, 48, 'sha256');
  const key = keyiv.subarray(0, 32);
  const iv  = keyiv.subarray(32, 48);

  const dec = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const pt = Buffer.concat([dec.update(ct), dec.final()]);
  return JSON.parse(pt.toString('utf8'));
}
