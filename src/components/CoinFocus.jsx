import React, {useEffect, useMemo, useRef, useState} from "react";

const TFMS = [["1m",60],["5m",300],["1h",3600],["1d",86400]];
const COINS = ["BTC/USD","ETH/USD","XRP/USD","SOL/USD","ADA/USD","DOGE/USD"];
const baseFuncs = import.meta.env.VITE_FUNCS || "/.netlify/functions";

/* Fallback data so the UI never looks empty if functions hiccup */
function genFallbackCandles(n=240, start=48000){
  const out=[]; let p=start;
  for(let i=0;i<n;i++){
    const drift = (Math.random()-0.5)*0.008 * p;
    const open  = p;
    const high  = open + Math.abs(drift)*1.4;
    const low   = open - Math.abs(drift)*1.4;
    const close = open + drift;
    out.push({t: i, o:+open.toFixed(2), h:+high.toFixed(2), l:+low.toFixed(2), c:+close.toFixed(2)});
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
    const rows = await res.json();
    if(!Array.isArray(rows) || rows.length===0) throw new Error("Empty");
    return rows.map(r => ({ t:+r.t, o:+r.o, h:+r.h, l:+r.l, c:+r.c })).slice(-800);
  }catch(e){
    console.warn("⚠️ candles fallback:", e?.message || e);
    const seed = symbol.startsWith("BTC") ? 60000 : 4000;
    return genFallbackCandles(360, seed);
  }
}

function useCandles(symbol, tfSec){
  const [data,setData]   = useState([]);
  const [price,setPrice] = useState(0);
  const [loading,setLoading] = useState(true);

  const load = async () => {
    const rows = await fetchCandles(symbol, tfSec);
    setData(rows);
    setPrice(rows.at(-1)?.c ?? 0);
    setLoading(false);
  };

  useEffect(()=>{ setLoading(true); load(); }, [symbol, tfSec]);
  useEffect(()=>{ const id=setInterval(load, 15_000); return ()=>clearInterval(id); }, [symbol, tfSec]);

  return {data,price,loading};
}

/* Lightweight canvas candlestick renderer */
function drawCandleChart(canvas, rows){
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,W,H);

  if(!rows?.length){ ctx.fillStyle="#777"; ctx.font="14px system-ui"; ctx.fillText("No candle data", 12, 22); return; }

  const pad=8, top=10, bot=16;
  const vw = W-2*pad, vh = H-top-bot;
  const lows = rows.map(r=>r.l), highs=rows.map(r=>r.h);
  const minL = Math.min(...lows), maxH=Math.max(...highs);
  const x = i => pad + (i/(rows.length-1))*vw;
  const y = v => top + (1-(v-minL)/(maxH-minL))*vh;

  // grid
  ctx.strokeStyle="rgba(255,215,130,.08)";
  ctx.lineWidth=1;
  ctx.beginPath();
  for(let i=0;i<=4;i++){ const gy=top + (i/4)*vh; ctx.moveTo(pad,gy); ctx.lineTo(pad+vw,gy); }
  ctx.stroke();

  // candles
  const bw = Math.max(1, Math.floor(vw/rows.length)-1);
  rows.forEach((r,i)=>{
    const cx = x(i);
    const up = r.c >= r.o;
    ctx.strokeStyle = up ? "rgba(212,175,55,.90)" : "rgba(164,22,26,.90)";
    ctx.fillStyle   = up ? "rgba(212,175,55,.30)" : "rgba(164,22,26,.30)";
    ctx.beginPath(); ctx.moveTo(cx, y(r.h)); ctx.lineTo(cx, y(r.l)); ctx.stroke();
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

  const {data,price,loading} = useCandles(symbol, tf);

  const pointsPerView = 120;                   // visible candle window
  const [offset,setOffset] = useState(0);      // 0 = live edge; higher = look further back
  const prevLenRef = useRef(0);

  // Keep historical window pinned if user is scrubbing (offset>0) while new data arrives
  useEffect(()=>{
    const prev = prevLenRef.current || 0;
    const added = Math.max(0, data.length - prev);
    if(added>0 && offset>0){
      // advance offset by number of new candles so the viewed window stays at same absolute time
      setOffset(o => o + added);
    }
    prevLenRef.current = data.length;
  }, [data, offset]);

  // Clamp offset to available history
  const maxOffset = Math.max(0, (data?.length||0) - pointsPerView);
  useEffect(()=>{ if(offset>maxOffset) setOffset(maxOffset); }, [maxOffset]); // keep in range

  const isLive = offset === 0;

  // Windowed slice based on offset
  const view = useMemo(()=>{
    const start = Math.max(0, (data.length - pointsPerView) - offset);
    return data.slice(start, start + pointsPerView);
  }, [data, offset]);

  // Canvas draw
  const canvasRef = useRef(null);
  useEffect(()=>{
    const c = canvasRef.current; if(!c) return;
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const cssW = c.clientWidth || 360, cssH = c.clientHeight || 260;
    c.width = cssW * dpr; c.height = cssH * dpr;
    c.style.width = cssW+"px"; c.style.height = cssH+"px";
    const ctx = c.getContext("2d"); ctx.setTransform(dpr,0,0,dpr,0,0);
    drawCandleChart(c, view);
  }, [view]);

  // KnightRider (optional rotating pick)
  const [kride, setKride] = useState(false);
  useEffect(()=>{
    if(!kride) return;
    const d = new Date(); const day = Math.floor(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())/86400000);
    setSymbol(COINS[day % COINS.length]);
  }, [kride]);

  return (
    <section className="focus-shell">
      <div className="focus-head">
        <div className="focus-row">
          <div className="seg">Market: <strong>{market}</strong></div>
          <div className="seg">
            <select value={symbol} onChange={e=>{ setSymbol(e.target.value); setOffset(0); }} className="focus-select">
              {COINS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="focus-row">
          <div className="tf">
            {TFMS.map(([l,s])=>(
              <button key={l} onClick={()=>{ setTf(s); setOffset(0); }} className={`tf-btn ${tf===s?"on":""}`}>{l}</button>
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
          <div className={`live-dot ${isLive?"on":"off"}`}>{price ? price.toLocaleString() : 0}</div>
        </div>

        <div className="canvas-wrap">
          <canvas ref={canvasRef}/>
          {!isLive && <button className="go-live" onClick={()=>setOffset(0)}>Go Live</button>}
          {loading && <div className="loading">Loading…</div>}
        </div>

        <div className="scrub-row">
          <span className="scrub-label">Recent</span>
          <input
            aria-label="History scrubber"
            type="range"
            min={0}
            max={maxOffset}
            value={Math.min(offset, maxOffset)}
            onChange={e=>setOffset(Number(e.target.value))}
          />
          <span className="scrub-label">Past</span>
        </div>

        <div className="cta-row">
          <button className="btn buy">Buy</button>
          <button className="btn sell">Sell</button>
          <button className="btn trade">Trade</button>
        </div>
        <div className="hint">{isLive ? "Live — updating every ~15s." : "Viewing history — tap Go Live to jump to now."}</div>
      </div>
    </section>
  );
}
