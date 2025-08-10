// netlify/functions/get-prices.js
// Resilient live prices with 3 feeds + no-cache headers.
// Primary: CoinGecko (HTTP). Fallbacks: Binance (REST), Bitstamp (REST).
// Merges feeds via median after trimming 1% outliers.
// ALWAYS returns a non-null meta describing each feed’s contribution.

const NOCACHE = {
  "content-type": "application/json",
  "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
  "access-control-allow-origin": "*",
  "vary": "Origin",
};

// Small, fast timeouts (server-side) so a bad feed doesn’t block results.
const HTTP_TIMEOUT_MS = 2500;

// ---------- helpers ----------

function timeoutSignal(ms) {
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), ms);
  return { signal: ac.signal, cancel: () => clearTimeout(id) };
}

function safeNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : NaN;
}

function median(nums) {
  const arr = nums.slice().sort((a, b) => a - b);
  const n = arr.length;
  if (!n) return NaN;
  const mid = Math.floor(n / 2);
  return n % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

function filterOutliers(values, trimFraction = 0.01) {
  const arr = values.filter(Number.isFinite).slice().sort((a, b) => a - b);
  if (arr.length < 3) return arr;
  const drop = Math.floor(arr.length * trimFraction);
  return arr.slice(drop, arr.length - drop);
}

// ---------- individual feeds ----------

async function pullCoinGecko() {
  const { signal, cancel } = timeoutSignal(HTTP_TIMEOUT_MS);
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd";
  try {
    const res = await fetch(url, {
      signal,
      headers: {
        accept: "application/json",
        "user-agent": "ForgeOfValhalla/1.0",
        "cache-control": "no-cache",
      },
    });
    if (!res.ok) throw new Error(`CG ${res.status}`);
    const j = await res.json();
    const BTC = safeNumber(j?.bitcoin?.usd);
    const ETH = safeNumber(j?.ethereum?.usd);
    cancel();
    return { src: "coingecko", BTC, ETH, err: null };
  } catch (e) {
    cancel();
    return { src: "coingecko", BTC: NaN, ETH: NaN, err: String(e?.message || e) };
  }
}

async function pullBinance() {
  const { signal, cancel } = timeoutSignal(HTTP_TIMEOUT_MS);
  try {
    const [rBTC, rETH] = await Promise.all([
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", {
        signal,
        headers: { accept: "application/json", "cache-control": "no-cache" },
      }),
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT", {
        signal,
        headers: { accept: "application/json", "cache-control": "no-cache" },
      }),
    ]);
    if (!rBTC.ok || !rETH.ok) throw new Error(`BN ${rBTC.status}/${rETH.status}`);
    const [jBTC, jETH] = await Promise.all([rBTC.json(), rETH.json()]);
    const BTC = safeNumber(jBTC?.price);
    const ETH = safeNumber(jETH?.price);
    cancel();
    return { src: "binance", BTC, ETH, err: null };
  } catch (e) {
    cancel();
    return { src: "binance", BTC: NaN, ETH: NaN, err: String(e?.message || e) };
  }
}

async function pullBitstamp() {
  const { signal, cancel } = timeoutSignal(HTTP_TIMEOUT_MS);
  try {
    const [rBTC, rETH] = await Promise.all([
      fetch("https://www.bitstamp.net/api/v2/ticker/btcusd", {
        signal,
        headers: { accept: "application/json", "cache-control": "no-cache" },
      }),
      fetch("https://www.bitstamp.net/api/v2/ticker/ethusd", {
        signal,
        headers: { accept: "application/json", "cache-control": "no-cache" },
      }),
    ]);
    if (!rBTC.ok || !rETH.ok)
      throw new Error(`BS ${rBTC.status}/${rETH.status}`);
    const [jBTC, jETH] = await Promise.all([rBTC.json(), rETH.json()]);
    const BTC = safeNumber(jBTC?.last);
    const ETH = safeNumber(jETH?.last);
    cancel();
    return { src: "bitstamp", BTC, ETH, err: null };
  } catch (e) {
    cancel();
    return { src: "bitstamp", BTC: NaN, ETH: NaN, err: String(e?.message || e) };
  }
}

// ---------- handler ----------

export async function handler() {
  const tsStart = Date.now();

  // Run all feeds in parallel; each returns a meta record
  const metas = await Promise.all([pullCoinGecko(), pullBinance(), pullBitstamp()]);

  // Build candidate arrays
  const btcCandidates = metas.map((m) => m.BTC);
  const ethCandidates = metas.map((m) => m.ETH);

  // Trim extreme outliers before taking median
  const btcFiltered = filterOutliers(btcCandidates, 0.01);
  const ethFiltered = filterOutliers(ethCandidates, 0.01);

  const BTCm = median(btcFiltered);
  const ETHm = median(ethFiltered);

  // Payload (two decimals), meta ALWAYS present with per-feed details
  const payload = {
    BTC: Number.isFinite(BTCm) ? Number(BTCm.toFixed(2)) : null,
    ETH: Number.isFinite(ETHm) ? Number(ETHm.toFixed(2)) : null,
    ts: Date.now(),
    meta: {
      feeds: metas.map((m) => ({
        src: m.src,
        BTC: Number.isFinite(m.BTC) ? Number(m.BTC.toFixed(2)) : null,
        ETH: Number.isFinite(m.ETH) ? Number(m.ETH.toFixed(2)) : null,
        err: m.err || null,
      })),
      elapsed_ms: Date.now() - tsStart,
    },
  };

  // If we still couldn’t compute a price, surface upstream_error but keep meta
  if (payload.BTC === null && payload.ETH === null) {
    return {
      statusCode: 502,
      headers: NOCACHE,
      body: JSON.stringify({
        error: "upstream_error",
        ...payload,
      }),
    };
  }

  return { statusCode: 200, headers: NOCACHE, body: JSON.stringify(payload) };
}
