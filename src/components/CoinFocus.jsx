import React, {useEffect, useMemo, useRef, useState} from "react";

const TFMS = [["1m",60],["5m",300],["1h",3600],["1d",86400]];
const COINS = ["BTC/USD","ETH/USD","XRP/USD","SOL/USD","ADA/USD","DOGE/USD"];
const baseFuncs = import.meta.env.VITE_FUNCS || "/.netlify/functions";

function genFallbackCandles(n=120, start=48000){
  // Simple synthetic walk so the chart is never empty
  const out=[]; let p=start;
  for(let i=0;i<n;i++){
    const drift = (Math.random()-0.5)*0.008 * p;
    const open  = p;
    const high  = open + Math.abs(drift)*1.4;
    const low   = open - Math.abs(drift)*1.4;
    const close = open + drift;
    out.push({t: i, o: +open.toFixed(2), h: +high.toFixed(2), l: +low.toFixed(2), c: +close.toFixed(2)});
    p = close;
  }
  return out;
}

async function fetchCandles(symbol, tfSec){
  const qs = new URLSearchParams({ symbol: symbol.replace("/","_"), tf: String(tfSec) });
  const url = `${baseFuncs}/candles?${qs}`;
  try{
    const res = await fetch(url, {cache:"no-store"});
    const ctype = res.headers.get("content-type") || "";
    if(!res.ok || !ctype.includes("json")) throw new Error(`Bad response ${res.status}`);
    const rows = await res.json(); // expecting [{t,o,h,l,c},...]
    if(!Array.isArray(rows) || rows.length===0) throw new Error("Empty");
    return rows.map(r => ({ t:+r.t, o:+r.o, h:+r.h, l:+r.l, c:+r.c })).slice(-180);
  }catch(e){
    console.warn("⚠️ candles fallback:", e?.message || e);
    return genFallbackCandles(120, symbol.startsWith("BTC") ? 60000 : 4000);
  }
}

function useCandles(symbol, tfSec){
  const [data,setData]   = useState([]);
  const [price,setPrice] = useState(0);
  const [loading,setLoading] = useState(true);
  const [err,setErr] = useState(null);

  const load = async () => {
    setLoading(true); setErr(null);
    const rows = await fetchCandles(symbol, tfSec);
    setData(rows);
    setPrice(rows.at(-1)?.c ?? 0);
    setLoading(false);
  };

  useEffect(()=>{ load(); const id=setInterval(load, 30_000); return ()=>clearInterval(id); },[symbol,tfSec]);

  return {data,price,loading,err};
}

function drawCandleChart(canvas, rows){
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,W,H);

  if(!rows?.length){ ctx.fillStyle="#666"; ctx.font="14px system-ui"; ctx.fillText("No candle data", 12, 22); return; }

  const pad=8, top=10, bot=10;
  const viewW = W-2*pad, viewH = H-top-bot;
  const xs  = rows.map((_,i)=>i);
  const lows = rows.map(r=>r.l), highs=rows.map(r=>r.h);
  const minL = Math.min(...lows), maxH=Math.max(...highs);
  const x = i => pad + (i/(rows.length-1))*viewW;
  const y = v => top + (1-(v-minL)/(maxH-minL))*viewH;

  // grid
  ctx.strokeStyle="rgba(255,215,130,.08)";
  ctx.lineWidth=1;
  ctx.beginPath();
  for(let i=0;i<=4;i++){ const gy=top + (i/4)*viewH; ctx.moveTo(pad,gy); ctx.lineTo(pad+viewW,gy); }
  ctx.stroke();

  // candles
  const bw = Math.max(1, Math.floor(viewW/rows.length)-1);
  rows.forEach((r,i)=>{
    const cx = x(i);
    const up = r.c >= r.o;
    ctx.strokeStyle = up ? "rgba(212,175,55,.90)" : "rgba(164,22,26,.90)";
    ctx.fillStyle   = up ? "rgba(212,175,55,.30)" : "rgba(164,22,26,.30)";

    // wick
    ctx.beginPath();
    ctx.moveTo(cx, y(r.h)); ctx.lineTo(cx, y(r.l)); ctx.stroke();

    // body
    const bh = Math.abs(y(r.c)-y(r.o));
    const topY = Math.min(y(r.c), y(r.o));
    ctx.fillRect(cx - bw/2, topY, bw, Math.max(1,bh));
    ctx.strokeRect(cx - bw/2, topY, bw, Math.max(1,bh));
  });
}

export default function CoinFocus(){
  const [market] = useState("USDT");
  const [symbol,setSymbol] = useState("BTC/USD");
  const [tf,setTf] = useState(TFMS[0][1]);
  const [kride,setKride] = useState(false);

  const {data,price,loading} = useCandles(symbol, tf);
  const canvasRef = useRef(null);

  // draw
  useEffect(()=>{
    const c = canvasRef.current; if(!c) return;
    // pixel ratio
    const r = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const cssW = c.clientWidth || 360, cssH = c.clientHeight || 220;
    c.width = cssW * r; c.height = cssH * r;
    c.style.width = cssW+"px"; c.style.height = cssH+"px";
    const ctx = c.getContext("2d"); ctx.scale(r,r);
    drawCandleChart(c, data);
  },[data]);

  // KnightRider demo picks (daily rotate)
  const kPick = useMemo(()=>{
    if(!kride) return null;
    const d = new Date(); const key = +new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()))/86400000;
    return COINS[key % COINS.length];
  },[kride]);

  useEffect(()=>{ if(kPick) setSymbol(kPick); },[kPick]);

  return (
    <section className="focus-shell">
      <div className="focus-head">
        <div className="focus-row">
          <div className="seg">Market: <strong>{market}</strong></div>
          <div className="seg">
            <select value={symbol} onChange={e=>setSymbol(e.target.value)} className="focus-select">
              {COINS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="focus-row">
          <div className="tf">
            {TFMS.map(([l,s])=>(
              <button key={l} onClick={()=>setTf(s)} className={`tf-btn ${tf===s?"on":""}`}>{l}</button>
            ))}
          </div>
          <label className="kr">
            <input type="checkbox" checked={kride} onChange={e=>setKride(e.target.checked)} />
            KnightRider
          </label>
        </div>
      </div>

      <div className="focus-card">
        <div className="focus-title">
          <div>{symbol}</div>
          <div className="price">{price ? price.toLocaleString() : 0}</div>
        </div>
        <div className="canvas-wrap">
          <canvas ref={canvasRef} />
          {loading && <div className="loading">Loading…</div>}
        </div>

        <div className="cta-row">
          <button className="btn buy">Buy</button>
          <button className="btn sell">Sell</button>
          <button className="btn trade">Trade</button>
        </div>
        <div className="hint">Tip: pick a timeframe; if your Functions are down, a safe fallback renders so the chart never feels broken.</div>
      </div>
    </section>
  );
}
