import { supa } from './lib/supa.js';
import { decryptJson } from './lib/crypto.js';
import { createMarketOrder } from './lib/cryptoCom.js';

const PAPER = (process.env.PAPER_TRADING || 'true').toLowerCase() === 'true';
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

    const { instrument, side, quantity } = JSON.parse(event.body || '{}');
    if (!instrument || !side || !quantity) {
      return { statusCode: 400, body: 'instrument, side, quantity required' };
    }

    // fetch encrypted creds
    const { data, error } = await supa
      .from('user_creds')
      .select('enc')
      .eq('email', email)
      .eq('exchange', 'crypto_com')
      .single();
    if (error) throw error;
    if (!data?.enc) return { statusCode: 400, body: 'No API creds on file' };

    const { apiKey, apiSecret } = decryptJson(data.enc);

    if (PAPER) {
      // record a paper fill
      const paperOrder = {
        email,
        exchange: 'crypto_com',
        instrument,
        side,
        quantity,
        status: 'filled',
        filled_qty: quantity,
        price: null, // you could store the current mid price here
      };
      const { error: pErr } = await supa.from('paper_orders').insert(paperOrder);
      if (pErr) throw pErr;
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, mode: 'paper', order: paperOrder }),
        headers: { 'cache-control': 'no-store' },
      };
    }

    // LIVE order (BE CAREFUL)
    const live = await createMarketOrder({
      apiKey,
      apiSecret,
      instrument,
      side,
      quantity,
    });

    // persist brief history
    await supa.from('live_orders').insert({
      email,
      exchange: 'crypto_com',
      instrument,
      side,
      quantity,
      provider_payload: live,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, mode: 'live', result: live }),
      headers: { 'cache-control': 'no-store' },
    };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
}
