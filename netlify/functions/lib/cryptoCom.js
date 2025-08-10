import crypto from 'node:crypto';
import fetch from 'node-fetch';

const API_BASE = 'https://api.crypto.com/v2';

function sign(secret, method, params, id) {
  // Crypto.com signature: sign(api_key + method + id + nonce + params)
  const nonce = Date.now();
  const payload = {
    id,
    method,
    api_key: params.api_key,
    params,
    nonce,
    sig: '', // to be filled
  };
  const paramStr = Object.keys(params).sort().map(k => k + params[k]).join('');
  const toSign = method + id + params.api_key + paramStr + nonce;
  payload.sig = crypto.createHmac('sha256', secret).update(toSign).digest('hex');
  return payload;
}

export async function createMarketOrder({ apiKey, apiSecret, instrument, side, quantity }) {
  const id = Date.now();
  const method = 'private/create-order';
  const params = {
    api_key: apiKey,
    instrument_name: instrument, // e.g., "BTC_USDT"
    side,                        // "BUY" | "SELL"
    type: 'MARKET',
    quantity,
  };
  const body = sign(apiSecret, method, params, id);
  const res = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || json?.code !== 0) {
    const msg = json?.message || json?.code || res.statusText;
    throw new Error(`Crypto.com order failed: ${msg}`);
  }
  return json.result; // includes order_id etc.
}
