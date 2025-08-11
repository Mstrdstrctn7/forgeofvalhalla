import { supa } from './lib/supa.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const BUDGET = Number(process.env.BOT_BUDGET_USD || 5);
const MIN_MOVE = Number(process.env.BOT_MIN_MOVE_PCT || 0.25); // percent
const EXCHANGE = 'crypto_com';      // tag only
const EMAIL = 'bot@forgeofvalhalla';// will show in paper_orders

function baseUrl() {
  return process.env.URL || process.env.DEPLOY_URL || process.env.SITE_URL || '';
}

async function fetchPrices() {
  const url = `${baseUrl()}/.netlify/functions/prices?t=${Date.now()}`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`prices ${res.status}`);
  const j = await res.json(); // { ok, prices:[{symbol, price}], ts }
  if (!j?.ok || !Array.isArray(j.prices)) throw new Error('bad prices payload');
  // normalize into map for quick diff
  const map = {};
  for (const p of j.prices) if (p?.symbol && typeof p.price === 'number') map[p.symbol] = p.price;
  return { list: j.prices, map, ts: j.ts };
}

async function logRun(tag, payload, note=null) {
  try {
    await supa.from('bot_runs').insert({ tag, ok: !!payload?.ok, payload, note });
  } catch (_) {}
}

function calcTrades(prevMap, nowMap) {
  const trades = [];
  for (const [sym, nowPx] of Object.entries(nowMap)) {
    const prevPx = prevMap?.[sym];
    if (!prevPx || prevPx <= 0) continue;
    const pct = ((nowPx - prevPx) / prevPx) * 100;
    if (pct >= MIN_MOVE) {
      // BUY with BUDGET USD converted to coin
      const qty = +(BUDGET / nowPx).toFixed(6);
      trades.push({ instrument: sym, side: 'BUY', price: nowPx, pct, qty });
    } else if (pct <= -MIN_MOVE) {
      // SELL same notional (paper)
      const qty = +(BUDGET / nowPx).toFixed(6);
      trades.push({ instrument: sym, side: 'SELL', price: nowPx, pct, qty });
    }
  }
  return trades;
}

async function placePaperTrades(trades) {
  if (!trades?.length) return { inserted: 0 };
  const rows = trades.map(t => ({
    email: EMAIL,
    exchange: EXCHANGE,
    instrument: t.instrument,
    side: t.side,
    quantity: t.qty,
    status: 'filled',
    filled_qty: t.qty,
    price: t.price
  }));
  const { error } = await supa.from('paper_orders').insert(rows);
  if (error) throw new Error(`paper_insert: ${error.message}`);
  return { inserted: rows.length };
}

export async function handler() {
  // pass 1
  const p1 = await fetchPrices().catch(e => ({ err: String(e) }));
  if (p1.err) {
    await logRun('t0', { ok:false, error:p1.err }, 'prices_t0_failed');
    return { statusCode: 200, headers:{'content-type':'application/json','cache-control':'no-store'}, body: JSON.stringify({ ok:false, error:p1.err }) };
  }
  await logRun('t0', { ok:true, ts: p1.ts, prices: p1.list });

  // wait ~30s
  await sleep(30_000);

  // pass 2
  const p2 = await fetchPrices().catch(e => ({ err: String(e) }));
  if (p2.err) {
    await logRun('t30s', { ok:false, error:p2.err }, 'prices_t30_failed');
    return { statusCode: 200, headers:{'content-type':'application/json','cache-control':'no-store'}, body: JSON.stringify({ ok:false, error:p2.err }) };
  }

  // decide & (paper) trade
  const trades = calcTrades(p1.map, p2.map);
  let paper = { inserted: 0 };
  let tradeError = null;
  try {
    paper = await placePaperTrades(trades);
  } catch (e) {
    tradeError = String(e);
  }

  const payload = {
    ok: !tradeError,
    ts0: p1.ts, ts1: p2.ts,
    min_move_pct: MIN_MOVE,
    budget_usd: BUDGET,
    prices_t1: p2.list,
    trades
  };
  await logRun('t30s', tradeError ? { ok:false, error: tradeError, ...payload } : payload);

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    body: JSON.stringify({ ok: !tradeError, queued: true, paper, trades_count: trades.length })
  };
}
