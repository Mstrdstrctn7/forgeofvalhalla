import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAdaptivePoll } from "../lib/useAdaptivePoll";

/**
 * Simple focus block:
 * - Select pair + timeframe
 * - Live line / candle chart (line by default)
 * - Live last price
 * - Scrubber (pauses polling while dragging)
 */
const PAIRS = ["BTC/USD","ETH/USD","XRP/USD","SOL/USD"];
const TFS   = ["1m","3m","5m","30m","1h","1d"];

export default function CoinFocus(){
  const [pair, setPair] = useState(PAIRS[0]);
  const [tf, setTf]     = useState("1m");
  const [mode, setMode] = useState("line"); // "line" | "candle"
  const [candles, setCandles] = useState([]); // [{t,o,h,l,c,v}]
  const [lastPrice, setLastPrice] = useState(0);
  const [scrubPct, setScrubPct] = useState(1);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // how many candles to request to keep chart smooth
  const limit = useMemo(() => {
    switch(tf){
      case "1m":  return 600;   // ~10h
      case "3m":  return 600;   // ~30h
      case "5m":  return 500;   // ~41h
      case "30m": return 400;   // ~8d
      case "1h":  return 400;   // ~16d
      case "1d":  return 365;   // ~1y
      default:    return 300;
    }
  }, [tf]);

  // Poll live data (fast when healthy, backs off on errors).
  useAdaptivePoll({
    pair: pair.replace("/","_"),
    tf,
    limit,
    setCandles,
    setLastPrice,
    isPaused: isScrubbing, // pause while scrubber engaged
  });

  // Drawing
  const canvasRef = useRef(null);
  const sub = Math.max(5, Math.floor((candles.length || 0) * scrubPct)); // subset size

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    const DPR = Math.min(2, window.devicePixelRatio || 1);

    const w = el.clientWidth;
    const h = el.clientHeight;
    el.width  = Math.floor(w * DPR);
    el.height = Math.floor(h * DPR);
    ctx.scale(DPR, DPR);

    ctx.clearRect(0,0,w,h);

    const data = (candles.length > sub) ? candles.slice(-sub) : candles;
    if (!data?.length) return;

    // y scale
    let lo = +Infinity, hi = -Infinity;
    for (let i=0;i<data.length;i++){
      const v = mode === "line" ? data[i].c : data[i].h;
      const l = mode === "line" ? data[i].c : data[i].l;
      if (v > hi) hi = v;
      if (l < lo) lo = l;
    }
    if (!isFinite(lo) || !isFinite(hi) || lo === hi) { lo -= 1; hi += 1; }
    const px = (v) => h - ((v - lo) / (hi - lo)) * (h - 12) - 6;

    // grid (subtle)
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i=1;i<5;i++){
      const y = (h/5)*i;
      ctx.moveTo(0, y); ctx.lineTo(w, y);
    }
    ctx.stroke();

    const xstep = w / Math.max(1, data.length - 1);

    if (mode === "line"){
      ctx.strokeStyle = "#f2c94c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i=0;i<data.length;i++){
        const x = i * xstep;
        const y = px(data[i].c);
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    } else {
      // minimal candles
      const bw = Math.max(1, xstep * 0.6);
      for (let i=0;i<data.length;i++){
        const x = i * xstep;
        const d = data[i];
        // wick
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.beginPath();
        ctx.moveTo(x, px(d.h)); ctx.lineTo(x, px(d.l)); ctx.stroke();
        // body
        const up = d.c >= d.o;
        ctx.fillStyle = up ? "rgba(24,194,124,0.8)" : "rgba(223,63,63,0.8)";
        const y1 = px(d.o), y2 = px(d.c);
        const top = Math.min(y1,y2), ht = Math.max(2, Math.abs(y1-y2));
        ctx.fillRect(x - bw/2, top, bw, ht);
      }
    }

    // last price tag
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(w-92, 6, 86, 20);
    ctx.fillStyle = "#f2c94c";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.textAlign = "right";
    ctx.fillText((lastPrice||0).toLocaleString(undefined,{maximumFractionDigits:2}), w-8, 20);

  }, [candles, mode, scrubPct, lastPrice]);

  function onScrub(e){
    setIsScrubbing(true);
    const v = Number(e.target.value);
    setScrubPct(v/100);
  }
  function endScrub(){ setIsScrubbing(false); }

  return (
    <section className="focus-shell">
      <div className="focus-card single-border">
        <header className="focus-head">
          <div className="row">
            <select value={pair} onChange={e=>setPair(e.target.value)} className="select">
              {PAIRS.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={tf} onChange={e=>setTf(e.target.value)} className="select">
              {TFS.map(t => <option key={t}>{t}</option>)}
            </select>
            <div className="toggle-group">
              <button onClick={()=>setMode("candle")} className={mode==="candle"?"pill on":"pill"}>Candle</button>
              <button onClick={()=>setMode("line")}   className={mode==="line"  ?"pill on":"pill"}>Line</button>
            </div>
          </div>
        </header>

        <div className="canvas-wrap">
          <canvas ref={canvasRef} style={{width:"100%",height:"320px",display:"block"}} />
        </div>

        <div className="scrub-row">
          <input type="range" min="5" max="100" step="1"
            value={Math.round(scrubPct*100)}
            onChange={onScrub}
            onMouseUp={endScrub} onTouchEnd={endScrub}
            aria-label="History range" />
          <span className="scrub-label">{Math.round(scrubPct*100)}% of history</span>
        </div>

        <div className="stats">
          <div className="last">Last: <strong>{(lastPrice||0).toLocaleString(undefined,{maximumFractionDigits:2})}</strong></div>
        </div>
      </div>
    </section>
  );
}
