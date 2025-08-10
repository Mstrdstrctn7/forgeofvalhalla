import crypto from 'crypto';

function kdf(keyStr) {
  // derive 32-byte key from CRED_ENC_KEY (any string) using SHA-256
  return crypto.createHash('sha256').update(String(keyStr)).digest();
}

// Decrypt ENCv1:<base64(iv(12)|tag(16)|ct)>
export function decryptJson(encStr) {
  const keyStr = process.env.CRED_ENC_KEY || '';
  if (!keyStr) throw new Error('CRED_ENC_KEY missing');
  if (!encStr || typeof encStr !== 'string') throw new Error('enc empty');

  if (encStr.startsWith('ENCv1:')) {
    const raw = Buffer.from(encStr.slice(6), 'base64');
    const iv  = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ct  = raw.subarray(28);
    const key = kdf(keyStr);
    const dec = crypto.createDecipheriv('aes-256-gcm', key, iv);
    dec.setAuthTag(tag);
    const pt = Buffer.concat([dec.update(ct), dec.final()]);
    return JSON.parse(pt.toString('utf8'));
  }

  // Fallback: give a clear error if old format is still present
  throw new Error('Unsupported state or unable to authenticate data');
}
