import { supa } from './lib/supa.js';

const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
const base = ()=>process.env.URL || process.env.DEPLOY_URL || process.env.SITE_URL || '';

async function fetchPrices() {
  const r = await fetch(`${base()}/.netlify/functions/prices?t=${Date.now()}`, {
    headers:{accept:'application/json'}
  });
  if (!r.ok) throw new Error('prices '+r.status);
  return r.json(); // { ok, prices }
}
async function log(tag, payload, note=null){
  try { await supa.from('bot_runs').insert({ tag, ok: !!payload?.ok, payload, note }); }
  catch { /* ignore if table missing */ }
}
async function runOnce(tag){
  const t0 = Date.now();
  try{
    const d = await fetchPrices();
    const signal = { action:'HOLD', reason:'learning', prices: d?.prices||null };
    await log(tag, { ok:true, prices:d?.prices, signal, ms:Date.now()-t0 });
  }catch(e){
    await log(tag, { ok:false, error:String(e), ms:Date.now()-t0 }, 'prices_fetch_failed');
  }
}

export async function handler() {
  // run now and again in 30s
  await runOnce('t0');
  await sleep(30_000);
  await runOnce('t30s');
  return { statusCode: 200, body: 'done' };
}
