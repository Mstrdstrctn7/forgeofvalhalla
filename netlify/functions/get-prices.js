// netlify/functions/get-prices.js
// Multi-feed live prices with outlier filter + strict no-cache.
// Sources: CoinGecko, Binance (USDT), Bitstamp (USD). Short timeouts.

const NOCACHE = {
  'content-type': 'application/json',
  'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
  'pragma': 'no-cache',
  'vary': 'Origin',
  'access-control-allow-origin': '*',
};

function t(ms) { return new Promise(r => setTimeout(r, ms)); }

async function withTimeout(url, opts = {}, ms = 2500) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: c.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

// ---- Feed fetchers ----
async function fromCoinGecko() {
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd";
  const j = await withTimeout(url, {
    headers: {
      accept: "application/json",
      "user-agent": "ForgeOfValhalla/1.0",
    }
  }, 2500);
  return {
    src: "coingecko",
    BTC: Number(j?.bitcoin?.usd ?? NaN),
    ETH: Number(j?.ethereum?.usd ?? NaN),
  };
}

async function fromBinance() {
  // Two lightweight calls (keeps it simple and reliable)
  const [b, e] = await Promise.all([
    withTimeout("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", {}, 2000),
    withTimeout("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT", {}, 2000),
  ]);
  return {
    src: "binance",
    BTC: Number(b?.price ?? NaN),
    ETH: Number(e?.price ?? NaN),
  };
}

async function fromBitstamp() {
  const [b, e] = await Promise.all([
    withTimeout("https://www.bitstamp.net/api/v2/ticker/btcusd/", {}, 2000),
    withTimeout("https://www.bitstamp.net/api/v2/ticker/ethusd/", {}, 2000),
  ]);
  return {
    src: "bitstamp",
    BTC: Number(b?.last ?? NaN),
    ETH: Number(e?.last ?? NaN),
  };
}

// ---- Merge helpers ----
function median(arr) {
  const a = [...arr].sort((x,y)=>x-y);
  const n = a.length;
  if (!n) return NaN;
  return n % 2 ? a[(n-1)/2] : (a[n/2 - 1] + a[n/2]) / 2;
}

function filterOutliers(values, tolerance = 0.01) { // 1% default
  if (values.length < 2) return values;
  const m = median(values);
  return values.filter(v => Math.abs(v - m) / m <= tolerance);
}

export async function handler() {
  const tsStart = Date.now();

  // Fire all feeds; tolerate individual failures.
  const results = await Promise.allSettled([
    fromCoinGecko(),
    fromBinance(),
    fromBitstamp(),
  ]);

  const metas = [];
  for (const r of results) if (r.status === "fulfilled") metas.push(r.value);

  const btcCandidates = metas.map(m => m.BTC).filter(n => Number.isFinite(n) && n > 0);
  const ethCandidates = metas.map(m => m.ETH).filter(n => Number.isFinite(n) && n > 0);

  const btcFiltered = filterOutliers(btcCandidates, 0.01); // 1% outlier clamp
  const ethFiltered = filterOutliers(ethCandidates, 0.01);

  const BTC = median(btcFiltered);
  const ETH = median(ethFiltered);

  if (!Number.isFinite(BTC) || !Number.isFinite(ETH)) {
    return {
      statusCode: 502,
      headers: NOCACHE,
      body: JSON.stringify({ error: "upstream_error", status: 502 })
    };
  }

  const payload = {
    BTC: Number(BTC.toFixed(2)),
    ETH: Number(ETH.toFixed(2)),
    ts: Date.now(),
    meta: {
      feeds: metas.map(m => ({
        src: m.src,
        BTC: Number.isFinite(m.BTC) ? Number(m.BTC) : null,
        ETH: Number.isFinite(m.ETH) ? Number(m.ETH) : null,
      })),
      elapsed_ms: Date.now() - tsStart
    }
  };

  return { statusCode: 200, headers: NOCACHE, body: JSON.stringify(payload) };
}
