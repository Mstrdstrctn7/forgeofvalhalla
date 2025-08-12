import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAdaptivePoll } from "../lib/useAdaptivePoll";

// ---------------------------------------------
// Config
// ---------------------------------------------
const FUNCS = import.meta.env.VITE_FUNCS || "/.netlify/functions";
const WS_FUNCS = import.meta.env.VITE_WS_FUNCS || ""; // optional websocket base (wss://...)

// pairs to choose from (you can expand later)
const PAIRS = [
  "BTC/USD","ETH/USD","XRP/USD","BNB/USD","SOL/USD","ADA/USD","DOGE/USD","AVAX/USD","LINK/USD","TON/USD"
];

// TF options (must match your server)
const TFS = [
  { k: "1m",  label: "1m"  },
  { k: "5m",  label: "5m"  },
  { k: "1h",  label: "1h"  },
  { k: "1d",  label: "1d"  },
];

// KnightRider daily pick (deterministic)
function knightPick(list){
  const d = new Date();
  const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++){ h ^= key.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return list[h % list.length];
}

function useLocalStore(key, initial){
  const [val, setVal] = useState(()=>{
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    }catch{ return initial; }
  });
  useEffect(()=>{ try{ localStorage.setItem(key, JSON.stringify(val)); }catch{} },[key,val]);
  return [val, setVal];
}

// ---------------------------------------------
// Simple canvas candle renderer (contained)
// ---------------------------------------------
function drawCandles(canvas, candles, cursorIdx){
  if(!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  // handle DPR crispness
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  ctx.scale(dpr, dpr);

  // bg
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0,0,W,H);

  if (!candles?.length) {
    ctx.fillStyle = "#888";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("No candle data", 10, 16);
    return;
  }

  // windowed view (use all)
  const view = candles;
  const n = view.length;
  const xs = 10, xe = W - 10, ys = 8, ye = H - 50;
  const cw = Math.max(1, (xe - xs) / Math.max(1, n));  // candle width
  const high = Math.max(...view.map(c => c.h));
  const low  = Math.min(...view.map(c => c.l));
  const scaleY = (v) => ye - ( (v - low) / Math.max(1e-9, (high - low)) ) * (ye - ys);

  // grid lines
  ctx.strokeStyle = "rgba(255,215,55,0.06)";
  ctx.lineWidth = 1;
  for(let i=0;i<=4;i++){
    const y = ys + (i*(ye-ys)/4);
    ctx.beginPath(); ctx.moveTo(xs, y); ctx.lineTo(xe, y); ctx.stroke();
  }

  // draw candles
  for(let i=0;i<n;i++){
    const c = view[i];
    const x = xs + i * cw + cw*0.5;

    // wick
    ctx.strokeStyle = "rgba(255,215,55,0.45)";
    ctx.beginPath();
    ctx.moveTo(x, scaleY(c.h));
    ctx.lineTo(x, scaleY(c.l));
    ctx.stroke();

    // body
    const up = c.c >= c.o;
    ctx.fillStyle = up ? "rgba(255,235,80,0.85)" : "rgba(220,60,60,0.85)";
    const y1 = scaleY(c.o);
    const y2 = scaleY(c.c);
    const top = Math.min(y1,y2);
    const h   = Math.max(1, Math.abs(y1 - y2));
    ctx.fillRect(x - cw*0.35, top, cw*0.7, h);
  }

  // latest price label (or cursor if scrubbing)
  const last = typeof cursorIdx === "number" ? view[cursorIdx]?.c : view[n-1]?.c;
  if (last != null){
    ctx.fillStyle = "rgba(255,215,55,0.92)";
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillText(String(last.toLocaleString()), xs, ys + 14);
  }
}

// ---------------------------------------------
// WebSocket (optional) – merges ticks into the current last candle
// ---------------------------------------------
function usePriceStream(enabled, pair, tf, pushTick){
  const wsRef = useRef(null);
  useEffect(()=>{
    if(!enabled || !WS_FUNCS) return;

    let url = `${WS_FUNCS.replace(/\/$/,"")}/prices?symbol=${encodeURIComponent(pair)}&tf=${tf}`;
    try{
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (ev)=>{
        try{
          // expecting {t,o,h,l,c,v}
          const tick = JSON.parse(ev.data);
          pushTick(tick);
        }catch(_e){}
      };
      ws.onerror = ()=>{/* ignore, polling covers it */};
      ws.onclose = ()=>{/* noop */};

      return () => { try{ ws.close(); }catch{} };
    }catch(_e){
      // If the env points somewhere wrong, just ignore; polling keeps working
    }
  },[enabled, pair, tf, pushTick]);
}

// ---------------------------------------------
// Component
// ---------------------------------------------
export default function CoinFocus(){
  const [pair, setPair] = useState("BTC/USD");
  const [tf, setTf]     = useState("1m");
  const [candles, setCandles] = useState([]);
  const [last, setLast] = useState(0);
  const [isLive, setIsLive] = useState(true); // paused when scrubbing
  const [cursor, setCursor] = useState(null); // number index or null for live
  const [watch, setWatch] = useLocalStore("fov_watch", ["ETH/USD"]);

  // KnightRider suggestion
  const [krOn, setKrOn] = useState(false);
  const krPick = useMemo(()=> knightPick(PAIRS), []);

  // Add/remove watch
  const isWatched = watch.includes(pair);
  const addWatch = ()=> setWatch((w)=> w.includes(pair) ? w : [...w, pair]);
  const rmWatch  = ()=> setWatch((w)=> w.filter(p => p !== pair));

  // Polling (HTTP) – adaptive 1s→10s + error backoff
  useAdaptivePoll(
    async ({ signal }) => {
      const limit = 300;
      const url = `${FUNCS}/candles?symbol=${encodeURIComponent(pair)}&tf=${tf}&limit=${limit}`;
      const res = await fetch(url, { signal, cache: "no-store" });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();  // [{t,o,h,l,c,v}, ...]
      setCandles(data);
      const lastC = data?.[data.length-1]?.c ?? 0;
      setLast(lastC);
      if (isLive) setCursor(null);
      return { t: data?.[data.length-1]?.t, c: lastC };
    },
    [pair, tf],
    {
      msMin: 1000,      // fastest when prices moving
      msMax: 10000,     // calm period cap
      msErrMax: 60000,  // backing off on failures
      calmStep: 1000,
      isPaused: () => !isLive,
    }
  );

  // Optional WebSocket stream – merges into last candle
  const pushTick = (tick)=>{
    if (!tick) return;
    setCandles((prev)=>{
      if (!prev?.length) return prev;
      const next = prev.slice();
      const i = next.length - 1;
      const c = next[i];
      // same bucket -> merge
      if (tick.t === c.t || Math.abs((tick.t ?? 0) - (c.t ?? 0)) < 1e-6){
        next[i] = {
          t: c.t,
          o: c.o,
          h: Math.max(c.h, tick.h ?? tick.c ?? c.c),
          l: Math.min(c.l, tick.l ?? tick.c ?? c.c),
          c: tick.c ?? c.c,
          v: (c.v ?? 0) + (tick.v ?? 0)
        };
      }else{
        // new candle started
        next.push(tick);
        // keep tail to ~300
        if (next.length > 300) next.shift();
      }
      if (isLive) setCursor(null);
      setLast(next[next.length-1]?.c ?? 0);
      return next;
    });
  };
  usePriceStream(true, pair, tf, pushTick);

  // KnightRider daily suggestion auto-switcher
  useEffect(()=>{
    if (!krOn) return;
    setPair(krPick);
  },[krOn, krPick]);

  // Canvas drawing
  const canvasRef = useRef(null);
  useEffect(()=>{
    const idx = (cursor == null) ? null : Math.max(0, Math.min(candles.length-1, cursor));
    drawCandles(canvasRef.current, candles, idx);
  },[candles, cursor]);

  const onScrub = (e)=>{
    const idx = Number(e.target.value);
    setIsLive(false);
    setCursor(Number.isFinite(idx) ? idx : null);
  };
  const goLive = ()=>{
    setIsLive(true);
    setCursor(null);
  };

  // Helpers
  const cursorLabel = (cursor==null || !candles.length) ? "Live" : "Past";
  const maxIdx = Math.max(0, candles.length - 1);

  return (
    <section className="focus-shell">
      <div className="focus-card card">
        {/* Controls */}
        <div className="focus-head" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, padding:"12px 12px 0"}}>
          <div className="input-chip">Market: USDT</div>
          <div className="input-chip">
            <select
              value={pair}
              onChange={(e)=> setPair(e.target.value)}
              aria-label="Pair"
              style={{background:"transparent", color:"var(--ink)", border:"none", width:"100%"}}
            >
              {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{display:"flex", gap:8, gridColumn:"1 / span 2", marginTop:6}}>
            {TFS.map(t => (
              <button key={t.k}
                onClick={()=> setTf(t.k)}
                className={`chip ${tf===t.k ? "on":""}`}
                aria-pressed={tf===t.k}
              >{t.label}</button>
            ))}
            <label className="chip" style={{marginLeft:8}}>
              <input type="checkbox" checked={krOn} onChange={e=>setKrOn(e.target.checked)} style={{marginRight:8}}/>
              KnightRider
            </label>
          </div>

          <div style={{display:"flex", gap:8, gridColumn:"1 / span 2"}}>
            {!isWatched
              ? <button className="btn subtle" onClick={addWatch}>+ Watch</button>
              : <button className="btn subtle" onClick={rmWatch}>– Unwatch</button>}
          </div>
        </div>

        {/* Chart */}
        <div className="canvas-wrap" style={{margin:"10px 12px 0"}}>
          <canvas ref={canvasRef} />
          <div className="go-live" role="status" aria-live="polite" onClick={goLive}>
            {cursor==null ? "LIVE" : "Go Live"}
          </div>
        </div>

        {/* Actions */}
        <div className="cta-row" style={{display:"flex", gap:12, padding:"12px"}}>
          <button className="btn buy"  onClick={()=>alert(`Buy ${pair} (stub)`)}>Buy</button>
          <button className="btn sell" onClick={()=>alert(`Sell ${pair} (stub)`)}>Sell</button>
          <button className="btn trade" onClick={()=>alert(`Trade ${pair} (stub)`)}>Trade</button>
        </div>

        {/* Scrubber */}
        <div className="scrub-row" style={{display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:12, padding:"0 12px 14px"}}>
          <input type="range"
                 min={0}
                 max={maxIdx}
                 step={1}
                 value={cursor==null ? maxIdx : cursor}
                 onChange={onScrub}
                 aria-label="History"
                 />
          <div className="scrub-label">{cursorLabel}</div>
        </div>

        {/* Watch pills preview */}
        {watch?.length ? (
          <div style={{display:"flex", gap:8, padding:"0 12px 14px", flexWrap:"wrap"}}>
            {watch.map(w => (
              <button key={w} className="pill" onClick={()=> setPair(w)}>{w}</button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
