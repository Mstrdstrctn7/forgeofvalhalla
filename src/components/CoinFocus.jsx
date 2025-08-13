import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAdaptivePoll } from "../lib/useAdaptivePoll";
import knightPick from "../lib/knight";

const FUNCS = import.meta.env.VITE_FUNCS || "/.netlify/functions";
const PAIRS = ["BTC/USD","ETH/USD","XRP/USD","SOL/USD","LINK/USD","ADA/USD","AVAX/USD","DOGE/USD","TON/USD","BNB/USD"];
const TFS   = ["1m","5m","1h","1d"];

function canvasHiDPI(canvas){
  const r = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width  = Math.max(1, Math.floor(width  * r));
  canvas.height = Math.max(1, Math.floor(height * r));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(r,0,0,r,0,0);
  return ctx;
}

function drawCandle(ctx, x, w, o, h, l, c, y){
  const green = c >= o;
  // wick
  ctx.strokeStyle = "rgba(200,200,200,.6)";
  ctx.beginPath();
  ctx.moveTo(x + w/2, y(h));
  ctx.lineTo(x + w/2, y(l));
  ctx.stroke();
  // body
  ctx.fillStyle = green ? "rgba(38,201,144,.9)" : "rgba(212,66,87,.9)";
  const top = Math.min(y(o), y(c));
  const bot = Math.max(y(o), y(c));
  ctx.fillRect(x+1, top, Math.max(1,w-2), Math.max(1, bot-top));
}

function drawLine(ctx, points, y){
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,216,64,.9)";
  ctx.beginPath();
  points.forEach((p,i) => {
    const xx = p.x, yy = y(p.c);
    if (i===0) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy);
  });
  ctx.stroke();
}

export default function CoinFocus(){
  const [pair, setPair] = useState("BTC/USD");
  const [tf, setTf] = useState("1m");
  const [mode, setMode] = useState("candle"); // 'candle' | 'line'
  const [useKR, setUseKR] = useState(false);

  const [candles, setCandles] = useState([]);
  const [lastPrice, setLastPrice] = useState(0);
  const [pct, setPct] = useState(1);
  const [isPaused, setPaused] = useState(false);

  // KnightRider
  useEffect(() => { if (useKR) setPair(knightPick().replace("_","/")); }, [useKR]);

  // Poller (Coinbase function already installed)
  useAdaptivePoll({ pair, tf, limit: 600, setCandles, setLastPrice, isPaused });

  // Refs
  const ref = useRef(null);

  // Draw
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = canvasHiDPI(el);
    const { width, height } = el.getBoundingClientRect();

    // bg
    ctx.clearRect(0,0,width,height);
    const g = ctx.createLinearGradient(0,0,0,height);
    g.addColorStop(0,"rgba(0,0,0,.00)");
    g.addColorStop(1,"rgba(0,0,0,.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,width,height);

    const slice = Math.max(10, Math.floor(candles.length * pct));
    const data = candles.slice(-slice);
    if (data.length < 2) return;

    const min = Math.min(...data.map(d => d.l));
    const max = Math.max(...data.map(d => d.h));
    const pad = (max - min) * 0.08;
    const yMin = min - pad, yMax = max + pad;

    const left = 8, right = width - 8;
    const top = 8, bottom = height - 8;
    const w = right - left, h = bottom - top;

    const xw = w / data.length;
    const y = v => bottom - ( (v - yMin) / (yMax - yMin) ) * h;

    if (mode === "candle"){
      data.forEach((d,i) => {
        const x = left + i * xw;
        drawCandle(ctx, x, Math.max(2, xw*0.75), d.o, d.h, d.l, d.c, y);
      });
    } else {
      const pts = data.map((d,i) => ({ x: left + i*xw, c: d.c }));
      drawLine(ctx, pts, y);
    }

    // last price
    ctx.fillStyle = "rgba(255,216,64,.95)";
    ctx.font = "600 13px ui-sans-serif, system-ui, -apple-system";
    ctx.fillText((lastPrice||0).toLocaleString(), left+6, top+16);
  }, [candles, pct, mode, lastPrice]);

  const portfolioSymbol = useMemo(() => pair, [pair]);

  return (
    <section className="focus-shell">
      <div className="focus-card fov-card">
        <div className="focus-head">
          <div className="focus-kicker">FOCUS</div>
          <h2 className="focus-title">{pair}</h2>
        </div>

        <div className="focus-controls">
          <div className="row">
            <div className="select">
              <select value={pair} onChange={e=>setPair(e.target.value)}>
                {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="select">
              <select value={tf} onChange={e=>setTf(e.target.value)}>
                {TFS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="switch-row">
              <input id="kr" type="checkbox" checked={useKR} onChange={e=>setUseKR(e.target.checked)} />
              <label htmlFor="kr">KnightRider picks</label>
            </div>

            <div className="mode-row">
              <button
                className={`btn tiny ${mode==="candle"?"on":""}`}
                onClick={()=>setMode("candle")}
                aria-pressed={mode==="candle"}
              >Candle</button>
              <button
                className={`btn tiny ${mode==="line"?"on":""}`}
                onClick={()=>setMode("line")}
                aria-pressed={mode==="line"}
              >Line</button>
            </div>
          </div>
          <hr className="soft" />
        </div>

        <div className="canvas-wrap" onPointerDown={()=>setPaused(true)} onPointerUp={()=>setPaused(false)} onPointerCancel={()=>setPaused(false)}>
          <canvas ref={ref} style={{width:"100%",height:"320px", display:"block"}} />
          <div className="live-dot on" aria-live="polite">Live</div>
        </div>

        <div className="scrub-row">
          <input type="range" min="0.1" max="1" step="0.01" value={pct} onChange={e=>setPct(parseFloat(e.target.value))} />
          <span className="scrub-label">{Math.round(pct*100)}% of history</span>
        </div>

        <div className="cta-row">
          <button className="btn buy">Buy</button>
          <button className="btn sell">Sell</button>
          <button className="btn trade">Trade</button>
        </div>

        <PortfolioBar symbol={portfolioSymbol} price={lastPrice} />
      </div>
    </section>
  );
}

import PortfolioBar from "./PortfolioBar.jsx";
