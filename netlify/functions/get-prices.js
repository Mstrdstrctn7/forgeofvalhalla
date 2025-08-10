// netlify/functions/get-prices.js
// Resilient live prices with fallback + strict no-cache.
// Primary: CoinGecko. Fallback: Binance (USDT≈USD). Short timeouts.

const CG_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd";
const BINANCE_URL =
  'https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT"]';

const TIMEOUT_MS = 3000;

function timeoutSignal(ms) {
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), ms);
  return { signal: ac.signal, cancel: () => clearTimeout(id) };
}

async function fetchCoinGecko() {
  const t = timeoutSignal(TIMEOUT_MS);
  try {
    const res = await fetch(CG_URL, {
      signal: t.signal,
      headers: { accept: "application/json", "cache-control": "no-cache" }
    });
    t.cancel();
    if (!res.ok) throw new Error(`CG ${res.status}`);
    const j = await res.json();
    return {
      BTC: Number(j?.bitcoin?.usd ?? NaN),
      ETH: Number(j?.ethereum?.usd ?? NaN),
      source: "coingecko"
    };
  } catch (e) {
    t.cancel();
    throw e;
  }
}

async function fetchBinance() {
  const t = timeoutSignal(TIMEOUT_MS);
  try {
    const res = await fetch(BINANCE_URL, {
      signal: t.signal,
      headers: { accept: "application/json", "cache-control": "no-cache" }
    });
    t.cancel();
    if (!res.ok) throw new Error(`BIN ${res.status}`);
    const arr = await res.json(); // [{symbol:"BTCUSDT", price:"..."}, ...]
    const map = Object.fromEntries(arr.map(x => [x.symbol, Number(x.price)]));
    return { BTC: map.BTCUSDT, ETH: map.ETHUSDT, source: "binance" };
  } catch (e) {
    t.cancel();
    throw e;
  }
}

export async function handler() {
  let out, errPrimary;
  try {
    out = await fetchCoinGecko();
  } catch (e) {
    errPrimary = String(e);
    try {
      out = await fetchBinance();
    } catch (e2) {
      const payload = {
        error: "all_providers_failed",
        primary: errPrimary,
        fallback: String(e2),
        t: Date.now()
      };
      return { statusCode: 502, headers: nocacheHeaders(), body: JSON.stringify(payload) };
    }
  }

  const payload = {
    BTC: isFinite(out.BTC) ? out.BTC : null,
    ETH: isFinite(out.ETH) ? out.ETH : null,
    source: out.source,
    t: Date.now()
  };

  return { statusCode: 200, headers: nocacheHeaders(), body: JSON.stringify(payload) };
}

function nocacheHeaders() {
  return {
    "content-type": "application/json",
    "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "pragma": "no-cache",
    "expires": "0",
    "access-control-allow-origin": "*",
    "vary": "Origin"
  };
}
