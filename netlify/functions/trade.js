import { supa } from './lib/supa.js';
import { decryptJson } from './lib/crypto.js';
import { createMarketOrder } from './lib/cryptoCom.js';

const PAPER = (process.env.PAPER_TRADING || 'true').toLowerCase() === 'true';
const ALLOWED = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

function j(status, obj) {
  return {
    statusCode: status,
    headers: { 'cache-control': 'no-store', 'content-type': 'application/json' },
    body: JSON.stringify(obj),
  };
}

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') return j(405, { error: 'Method Not Allowed' });

    const email = (event.headers['x-user-email'] || '').toLowerCase();
    if (!email || !ALLOWED.includes(email)) return j(401, { error: 'Unauthorized' });

    let body;
    try { body = JSON.parse(event.body || '{}'); }
    catch { return j(400, { error: 'bad_json' }); }

    const { instrument, side, quantity } = body;
    if (!instrument || !side || !quantity) {
      return j(400, { error: 'instrument, side, quantity required' });
    }

    // fetch encrypted creds
    const { data, error } = await supa
      .from('user_creds')
      .select('enc')
      .eq('email', email)
      .eq('exchange', 'crypto_com')
      .single();

    if (error) return j(500, { error: 'supa', detail: error.message });
    if (!data?.enc) return j(400, { error: 'no_creds' });

    let apiKey, apiSecret;
    try { ({ apiKey, apiSecret } = decryptJson(data.enc)); }
    catch (e) { return j(500, { error: 'decrypt', detail: String(e) }); }

    if (PAPER) {
      const paperOrder = {
        email,
        exchange: 'crypto_com',
        instrument,
        side,
        quantity,
        status: 'filled',
        filled_qty: quantity,
        price: null,
      };
      const { error: pErr } = await supa.from('paper_orders').insert(paperOrder);
      if (pErr) return j(500, { error: 'paper_insert', detail: pErr.message });
      return j(200, { ok: true, mode: 'paper', order: paperOrder });
    }

    // LIVE order
    try {
      const live = await createMarketOrder({ apiKey, apiSecret, instrument, side, quantity });
      await supa.from('live_orders').insert({
        email, exchange: 'crypto_com', instrument, side, quantity, provider_payload: live,
      });
      return j(200, { ok: true, mode: 'live', result: live });
    } catch (e) {
      return j(500, { error: 'provider', detail: e?.response?.data || String(e) });
    }
  } catch (e) {
    return j(500, { error: 'unknown', detail: String(e) });
  }
}
