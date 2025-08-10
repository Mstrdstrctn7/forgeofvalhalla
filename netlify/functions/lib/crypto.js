import crypto from 'node:crypto';

const ENC_KEY_B64 = process.env.CRED_ENC_KEY; // 32 bytes, base64
if (!ENC_KEY_B64) throw new Error('CRED_ENC_KEY missing');
const ENC_KEY = Buffer.from(ENC_KEY_B64, 'base64'); // 32 bytes -> AES-256

export function encryptJson(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64'); // iv(12) + tag(16) + data
}

export function decryptJson(b64) {
  const raw = Buffer.from(b64, 'base64');
  const iv  = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data= raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(dec.toString('utf8'));
}
