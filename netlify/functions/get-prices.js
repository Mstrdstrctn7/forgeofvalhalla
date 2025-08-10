// netlify/functions/get-prices.js
// Multi-feed crypto prices with strict no-cache and elapsed_ms timing.
// Feeds: CoinGecko (primary), Binance (ticker), Bitstamp (ticker).
// Aggregation: remove 1% outliers then take median. Return per-feed meta.

const NOCACHE = {
  "access-control-allow-origin": "*",
  "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
  "pragma": "no-cache",
  "expires": "0",
  "content-type": "application/json",
  "vary": "Origin",
};

const TIMEOUT_MS = 2500;       // per request timeout
const TOTAL_BUDGET_MS = 3500;  // whole function should finish quickly

// --- tiny utils ---
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function withTimeout(promise, ms, controller) {
  const t = setTimeout(() => controller.abort(), ms);
  return promise.finally(() => clearTimeout(t));
}

function median(nums) {
  const a = nums.slice().sort((x, y) => x - y);
  const n = a.length;
  if (!n) return NaN;
  const mid = Math.floor(n / 2);
  return n % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function filterOutliers(values, frac = 0.01) {
  if (values.length < 3) return values.slice();
  const a = values.slice().sort((x, y) => x - y);
  const cut = Math.max(1, Math.floor(a.length * frac));
  return a.slice(cut, a.length - cut);
}

// --- feed fetchers ---
async function fetchCoinGecko(signal) {
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd";
  const res = await fetch(url, {
    signal,
    headers: {
      "accept": "application/json",
      "cache-control": "no-cache",
      "user-agent": "ForgeOfValhalla/1.0"
    }
  });
  if (!res.ok) throw new Error(`CG ${res.status}/${res.statusText}`);
  const j = await res.json();
  const BTC = +j?.bitcoin?.usd;
  const ETH = +j?.ethereum?.usd;
  return { src: "coingecko", BTC: Number.isFinite(BTC) ? BTC : null, ETH: Number.isFinite(ETH) ? ETH : null, err: null };
}

async function fetchBinance(signal) {
  const uBtc = "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT";
  const uEth = "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT";
  const [r1, r2] = await Promise.all([
    fetch(uBtc, { signal }),
    fetch(uEth, { signal }),
  ]);
  if (!r1.ok || !r2.ok) throw new Error(`BN ${r1.status || "?"}/${r2.status || "?"}`);
  const j1 = await r1.json();
  const j2 = await r2.json();
  const BTC = +j1?.price;
  const ETH = +j2?.price;
  return { src: "binance", BTC: Number.isFinite(BTC) ? BTC : null, ETH: Number.isFinite(ETH) ? ETH : null, err: null };
}

async function fetchBitstamp(signal) {
  const uBtc = "https://www.bitstamp.net/api/v2/ticker/btcusd";
  const uEth = "https://www.bitstamp.net/api/v2/ticker/ethusd";
  const [r1, r2] = await Promise.all([fetch(uBtc, { signal }), fetch(uEth, { signal })]);
  if (!r1.ok || !r2.ok) throw new Error(`BS ${r1.status || "?"}/${r2.status || "?"}`);
  const j1 = await r1.json();
  const j2 = await r2.json();
  const BTC = +j1?.last;
  const ETH = +j2?.last;
  return { src: "bitstamp", BTC: Number.isFinite(BTC) ? BTC : null, ETH: Number.isFinite(ETH) ? ETH : null, err: null };
}

async function tryFeed(fn) {
  const controller = new AbortController();
  try {
    return await withTimeout(fn(controller.signal), TIMEOUT_MS, controller);
  } catch (e) {
    return { src: fn.name.replace("fetch", "").toLowerCase(), BTC: null, ETH: null, err: String(e.message || e) };
  }
}

exports.handler = async () => {
  const tsStart = Date.now();

  // Run feeds in parallel, but keep total budget reasonable
  const budget = sleep(TOTAL_BUDGET_MS).then(() => ({ timeoutBudget: true }));
  const allFeeds = Promise.all([
    tryFeed(fetchCoinGecko),
    tryFeed(fetchBinance),
    tryFeed(fetchBitstamp),
  ]);

  const result = await Promise.race([allFeeds, budget]);

  let metas;
  if (Array.isArray(result)) {
    metas = result;
  } else {
    // budget elapsed → return whatever finished so far (best-effort)
    metas = await Promise.race([
      allFeeds.catch(() => []),
      sleep(200).then(() => []),
    ]);
  }

  // Pull valid numeric candidates
  const btcCandidates = metas.map(m => m.BTC).filter(v => Number.isFinite(v));
  const ethCandidates = metas.map(m => m.ETH).filter(v => Number.isFinite(v));

  // 1% outlier clamp then median
  const btcFiltered = filterOutliers(btcCandidates, 0.01);
  const ethFiltered = filterOutliers(ethCandidates, 0.01);

  const BTC = median(btcFiltered);
  const ETH = median(ethFiltered);

  const elapsed_ms = Math.max(0, Date.now() - tsStart);

  // If everything failed, surface an upstream error (but still include meta)
  if (!Number.isFinite(BTC) || !Number.isFinite(ETH)) {
    const payload = {
      error: "upstream_error",
      status: 502,
      ts: Date.now(),
      meta: { feeds: metas, elapsed_ms },
    };
    return { statusCode: 502, headers: NOCACHE, body: JSON.stringify(payload) };
  }

  const payload = {
    BTC: +BTC.toFixed(2),
    ETH: +ETH.toFixed(2),
    ts: Date.now(),
    meta: { feeds: metas, elapsed_ms },
  };

  return { statusCode: 200, headers: NOCACHE, body: JSON.stringify(payload) };
};
