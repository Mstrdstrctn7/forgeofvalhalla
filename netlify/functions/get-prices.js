/**
 * Multi-coin, multi-feed price aggregator (max 3 coins).
 * Feeds: CoinGecko + Bitstamp + Coinbase Exchange + Kraken (TX-safe).
 * Query:  /.netlify/functions/get-prices?symbols=BTC,ETH,SOL
 * Returns: { prices:{BTC:...,ETH:...,...}, ts, meta:{elapsed_ms, perSymbol:{SYM:[{src,BTC/price,err}]}} }
 */
const NOCACHE = {
  "content-type": "application/json",
  "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
  "access-control-allow-origin": "*",
  "vary": "Origin",
};
const UA = "ForgeOfValhalla/1.0";
const TIMEOUT_MS = 2500;
const OUTLIER_FRAC = 0.01;

// Supported coins and provider pair mappings
const SUPPORTED = ["BTC", "ETH", "SOL", "XRP", "ADA", "LTC", "DOGE"];

const CG_ID = { // CoinGecko ids
  BTC:"bitcoin", ETH:"ethereum", SOL:"solana", XRP:"ripple",
  ADA:"cardano", LTC:"litecoin", DOGE:"dogecoin"
};
// Coinbase product tickers (if missing, we skip Coinbase for that symbol)
const CB_PROD = {
  BTC:"BTC-USD", ETH:"ETH-USD", SOL:"SOL-USD", XRP:"XRP-USD",
  ADA:"ADA-USD", LTC:"LTC-USD", DOGE:"DOGE-USD"
};
// Bitstamp pairs (lowercase)
const BS_PAIR = {
  BTC:"btcusd", ETH:"ethusd", SOL:"solusd", XRP:"xrpusd",
  ADA:"adausd", LTC:"ltcusd", DOGE:"dogeusd"
};
// Kraken pairs (varies)
const KR_PAIR = {
  BTC:"XBTUSD", ETH:"ETHUSD", SOL:"SOLUSD", XRP:"XRPUSD",
  ADA:"ADAUSD", LTC:"LTCUSD", DOGE:"DOGEUSD"
};

function timeoutFetch(url, opts = {}, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(t));
}

// --- Feed fetchers (batch where possible) ---
async function fetchCoinGecko(symbols) {
  const ids = symbols.map(s => CG_ID[s]).filter(Boolean);
  if (!ids.length) return [];
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`;
  try {
    const res = await timeoutFetch(url, { headers:{ "user-agent": UA, accept:"application/json" }});
    if (!res.ok) throw new Error(`CG ${res.status}/${res.statusText}`);
    const j = await res.json();
    return symbols.map(sym => ({
      src:"coingecko",
      sym,
      price: Number(j?.[CG_ID[sym]]?.usd) || null,
      err: null
    }));
  } catch (e) {
    return symbols.map(sym => ({ src:"coingecko", sym, price:null, err:String(e.message||e) }));
  }
}

async function fetchBitstamp(symbols) {
  const doable = symbols.filter(s => BS_PAIR[s]);
  const one = async (sym) => {
    const url = `https://www.bitstamp.net/api/v2/ticker/${BS_PAIR[sym]}`;
    try {
      const r = await timeoutFetch(url, { headers:{ "user-agent": UA, accept:"application/json" }});
      if (!r.ok) throw new Error(`BS ${r.status}/${r.statusText}`);
      const j = await r.json();
      return { src:"bitstamp", sym, price: Number(j?.last)||null, err:null };
    } catch (e) { return { src:"bitstamp", sym, price:null, err:String(e.message||e) }; }
  };
  return Promise.all(doable.map(one));
}

async function fetchCoinbase(symbols) {
  const doable = symbols.filter(s => CB_PROD[s]);
  const one = async (sym) => {
    const url = `https://api.exchange.coinbase.com/products/${CB_PROD[sym]}/ticker`;
    try {
      const r = await timeoutFetch(url, { headers:{ "user-agent": UA, accept:"application/json" }});
      if (!r.ok) throw new Error(`CB ${r.status}/${r.statusText}`);
      const j = await r.json();
      return { src:"coinbase", sym, price: Number(j?.price)||null, err:null };
    } catch (e) { return { src:"coinbase", sym, price:null, err:String(e.message||e) }; }
  };
  return Promise.all(doable.map(one));
}

async function fetchKraken(symbols) {
  const doable = symbols.filter(s => KR_PAIR[s]);
  if (!doable.length) return [];
  const pairs = doable.map(s => KR_PAIR[s]).join(",");
  const url = `https://api.kraken.com/0/public/Ticker?pair=${pairs}`;
  try {
    const r = await timeoutFetch(url, { headers:{ "user-agent": UA, accept:"application/json" }});
    if (!r.ok) throw new Error(`KR ${r.status}/${r.statusText}`);
    const j = await r.json();
    const res = j?.result || {};
    return doable.map(sym => {
      const k = Object.keys(res).find(k => k.toUpperCase().startsWith(sym==="BTC"?"XBT":"ETH"===sym?"ETH":sym) && /USD$/i.test(k));
      const price = Number(res?.[k]?.c?.[0]) || null;
      return { src:"kraken", sym, price, err:null };
    });
  } catch (e) {
    return doable.map(sym => ({ src:"kraken", sym, price:null, err:String(e.message||e) }));
  }
}

// --- stats helpers ---
function median(nums){ const n=nums.filter(Number.isFinite).sort((a,b)=>a-b); if(!n.length) return NaN; const m=Math.floor(n.length/2); return n.length%2?n[m]:(n[m-1]+n[m])/2; }
function filterOutliers(arr, frac=OUTLIER_FRAC){ const xs=arr.filter(Number.isFinite).sort((a,b)=>a-b); if(xs.length<=2) return xs; const drop=Math.floor(xs.length*frac); return xs.slice(drop, xs.length-drop); }

export async function handler(event) {
  const t0 = Date.now();
  const raw = String(event?.queryStringParameters?.symbols || "BTC,ETH").toUpperCase();
  let syms = [...new Set(raw.split(",").map(s => s.trim()).filter(Boolean))].slice(0,3);
  syms = syms.filter(s => SUPPORTED.includes(s));
  if (!syms.length) syms = ["BTC","ETH"];

  const [cg, bs, cb, kr] = await Promise.all([
    fetchCoinGecko(syms),
    fetchBitstamp(syms),
    fetchCoinbase(syms),
    fetchKraken(syms),
  ]);

  // organize per symbol
  const perSymbol = {};
  for (const s of syms) perSymbol[s] = [];
  [...cg, ...bs, ...cb, ...kr].forEach(r => { if(perSymbol[r.sym]) perSymbol[r.sym].push(r); });

  // aggregate
  const prices = {};
  for (const s of syms) {
    const vals = perSymbol[s].map(f => f.price);
    const med = median(filterOutliers(vals));
    if (!Number.isFinite(med)) { prices[s] = null; }
    else prices[s] = +med.toFixed(2);
  }

  // if none resolved, 502
  if (!Object.values(prices).some(Number.isFinite)) {
    return { statusCode: 502, headers: NOCACHE, body: JSON.stringify({
      error:"upstream_error", status:502, ts:Date.now(), meta:{elapsed_ms:Date.now()-t0, perSymbol}
    })};
  }

  return {
    statusCode: 200,
    headers: NOCACHE,
    body: JSON.stringify({
      prices, ts: Date.now(),
      meta:{ elapsed_ms: Date.now()-t0, perSymbol }
    })
  };
}
