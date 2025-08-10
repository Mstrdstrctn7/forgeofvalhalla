import { supa } from './lib/supa.js';
import { encryptJson } from './lib/crypto.js';

const ALLOWED = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const email = (event.headers['x-user-email'] || '').toLowerCase();
    if (!email || !ALLOWED.includes(email)) {
      return { statusCode: 401, body: 'Unauthorized' };
    }

    const { exchange, apiKey, apiSecret } = JSON.parse(event.body || '{}');
    if (exchange !== 'crypto_com') {
      return { statusCode: 400, body: 'exchange must be crypto_com' };
    }
    if (!apiKey || !apiSecret) {
      return { statusCode: 400, body: 'apiKey and apiSecret required' };
    }

    const enc = encryptJson({ apiKey, apiSecret });

    const { error } = await supa
      .from('user_creds')
      .upsert({ email, exchange, enc }, { onConflict: 'email,exchange' });

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
      headers: { 'cache-control': 'no-store' },
    };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
}
