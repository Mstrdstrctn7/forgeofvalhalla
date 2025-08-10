/**
 * get-prices.js
 * Resilient live prices with strict no-cache + per-feed meta breakdown.
 * Primary: CoinGecko. Fallbacks: Binance (USDT), Bitstamp (USD).
 */

const NOCACHE = {
  "access-control-allow-origin": "*",
  "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
  "vary": "Origin",
  // keep simple CORS in dev
};

/** tiny helpers **/
const clampPct = (v, center, pct) => {
  const hi = center * (1 + pct);
  const lo = center * (1 - pct);
  return Math.min(Math.max(v, lo), hi);
};

const median = (arr) => {
  const a = arr.slice().sort((x, y) => x - y);
  const n = a.length;
  return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
};

const filterOutliers = (arr, frac = 0.01) => {
  if (arr.length === 0) return arr;
  const m = median(arr);
  const d = arr.map((v) => Math.abs(v - m)).sort((a, b) => a - b);
  const idx = Math.floor((1 - frac) * (d.length - 1));
  const thr = d[idx] ?? 0;
  return arr.filter((v) => Math.abs(v - m) <= thr);
};

async function withTimeout(fetchPromise, ms = 1500) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetchPromise(ctrl.signal);
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

/** feeds **/
async function fCoinGecko(signal) {
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd";
  const res = await fetch(url, {
    signal,
    headers: {
      accept: "application/json",
      "cache-control": "no-cache",
      "user-agent": "ForgeOfValhalla/1.0",
    },
  });
  if (!res.ok) throw new Error(`coingecko ${res.status}`);
  const j = await res.json();
  const BTC = Number(j?.bitcoin?.usd);
  const ETH = Number(j?.ethereum?.usd);
  return { src: "CoinGecko", BTC: isFinite(BTC) ? BTC : null, ETH: isFinite(ETH) ? ETH : null };
}

async function fBinance(signal) {
  // USDT proxy for USD
  const url = "https://api.binance.com/api/v3/ticker/price?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22%5D";
  const res = await fetch(url, { signal, headers: { accept: "application/json", "cache-control": "no-cache" }});
  if (!res.ok) throw new Error(`binance ${res.status}`);
  const arr = await res.json();
  const map = Object.fromEntries(arr.map((r) => [r.symbol, Number(r.price)]));
  const BTC = Number(map.BTCUSDT);
  const ETH = Number(map.ETHUSDT);
  return { src: "Binance", BTC: isFinite(BTC) ? BTC : null, ETH: isFinite(ETH) ? ETH : null };
}

async function fBitstamp(signal) {
  // USD pairs
  const [bRes, eRes] = await Promise.all([
    fetch("https://www.bitstamp.net/api/v2/ticker/btcusd", { signal }),
    fetch("https://www.bitstamp.net/api/v2/ticker/ethusd", { signal }),
  ]);
  if (!bRes.ok || !eRes.ok) throw new Error(`bitstamp ${bRes.status}/${eRes.status}`);
  const [bj, ej] = await Promise.all([bRes.json(), eRes.json()]);
  const BTC = Number(bj?.last);
  const ETH = Number(ej?.last);
  return { src: "Bitstamp", BTC: isFinite(BTC) ? BTC : null, ETH: isFinite(ETH) ? ETH : null };
}

export async function handler() {
  const tsStart = Date.now();

  // collect feeds with short timeouts, tolerate failures
  const results = await Promise.allSettled([
    withTimeout((signal) => fCoinGecko(signal), 1500),
    withTimeout((signal) => fBinance(signal), 1200),
    withTimeout((signal) => fBitstamp(signal), 1500),
  ]);

  const metas = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((m) => m && (isFinite(m.BTC ?? NaN) || isFinite(m.ETH ?? NaN)));

  // Need at least 1 quote; ideally 2+
  const btcCandidates = metas.map((m) => m.BTC).filter((v) => isFinite(v));
  const ethCandidates = metas.map((m) => m.ETH).filter((v) => isFinite(v));

  if (btcCandidates.length === 0 && ethCandidates.length === 0) {
    return { statusCode: 502, headers: NOCACHE, body: JSON.stringify({ error: "upstream_error", status: 502 }) };
  }

  // Remove top/bottom 1% outliers then median
  const btcFiltered = btcCandidates.length ? filterOutliers(btcCandidates, 0.01) : [];
  const ethFiltered = ethCandidates.length ? filterOutliers(ethCandidates, 0.01) : [];
  let BTC = btcFiltered.length ? median(btcFiltered) : null;
  let ETH = ethFiltered.length ? median(ethFiltered) : null;

  // Gentle 0.2% clamp around the strongest source (CoinGecko if present)
  const clampBaseBTC = metas.find((m) => m.src === "CoinGecko")?.BTC ?? BTC;
  const clampBaseETH = metas.find((m) => m.src === "CoinGecko")?.ETH ?? ETH;
  if (isFinite(BTC) && isFinite(clampBaseBTC)) BTC = clampPct(BTC, clampBaseBTC, 0.002);
  if (isFinite(ETH) && isFinite(clampBaseETH)) ETH = clampPct(ETH, clampBaseETH, 0.002);

  // Final payload — ALWAYS include meta
  const payload = {
    BTC: isFinite(BTC) ? Number(BTC.toFixed(2)) : null,
    ETH: isFinite(ETH) ? Number(ETH.toFixed(2)) : null,
    ts: Date.now(),
    meta: metas.map((m) => ({
      src: m.src,
      BTC: isFinite(m.BTC) ? Number(m.BTC) : null,
      ETH: isFinite(m.ETH) ? Number(m.ETH) : null,
    })),
    elapsed_ms: Date.now() - tsStart,
  };

  return { statusCode: 200, headers: NOCACHE, body: JSON.stringify(payload) };
}
