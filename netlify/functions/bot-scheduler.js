import { supa } from './lib/supa.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function baseUrl() {
  // Netlify provides one of these in functions
  return process.env.URL || process.env.DEPLOY_URL || process.env.SITE_URL || '';
}

async function fetchPrices() {
  const url = `${baseUrl()}/.netlify/functions/prices?t=${Date.now()}`;
  const res = await fetch(url, { headers: { 'accept': 'application/json' }});
  if (!res.ok) throw new Error(`prices ${res.status}`);
  return res.json();  // { ok:true, prices:{ BTC:..., ETH:..., ... } }
}

async function logRun(tag, payload, note=null) {
  // If the table doesn't exist, ignore gracefully.
  try {
    await supa.from('bot_runs').insert({
      tag,
      ok: !!payload?.ok,
      payload,
      note
    });
  } catch (_) {}
}

// Very light "strategy" stub (paper): just records prices and emits HOLD.
// You can replace with your real signal generator later.
async function runOnce(tag) {
  const start = Date.now();
  try {
    const data = await fetchPrices();
    const signal = { action: 'HOLD', reason: 'learning', prices: data?.prices || null };
    await logRun(tag, { ok:true, prices: data?.prices, signal }, null);
    return { ok:true, ms: Date.now()-start, signal };
  } catch (e) {
    await logRun(tag, { ok:false, error: String(e) }, 'prices_fetch_failed');
    return { ok:false, ms: Date.now()-start, error: String(e) };
  }
}

// Scheduled entry-point: runs now, then again after 30s.
export async function handler() {
  const first = await runOnce('t0');
  await sleep(30_000);
  const second = await runOnce('t30s');
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    body: JSON.stringify({ ok: first.ok && second.ok, first, second })
  };
}
