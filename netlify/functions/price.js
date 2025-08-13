/**
 * /price?symbol=BTC_USD
 * Returns { symbol, last, t } by reading the latest 1m candle.
 * Falls back with proper 4xx/5xx and CORS headers.
 */
export async function handler(event) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  try {
    const params = new URLSearchParams(event.queryStringParameters || {});
    const symbol = params.get('symbol') || 'BTC_USD';

    // Build absolute URL to our own candles function (1m, last bar)
    const host = event.headers.host || 'forgeofvalhalla.com';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const url = `${proto}://${host}/.netlify/functions/candles?symbol=${encodeURIComponent(symbol)}&tf=1m&limit=1`;

    const res = await fetch(url, { headers: { 'cache-control': 'no-store' } });
    if (!res.ok) {
      return {
        statusCode: 502,
        headers: cors,
        body: JSON.stringify({ error: `candles HTTP ${res.status}` }),
      };
    }

    const arr = await res.json(); // [{t,o,h,l,c,v}]
    const last = Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null;
    if (!last || typeof last.c !== 'number') {
      return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'no candle data' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...cors },
      body: JSON.stringify({ symbol, last: last.c, t: last.t }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: String(e && e.message || e) }),
    };
  }
}
