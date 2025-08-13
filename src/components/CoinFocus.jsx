import { SafeRender } from "../lib/safeRender";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  openCryptoWS,
  fetchCryptoCandles,
  fetchCoinbasePrice,
  tfMap,
} from "../lib/marketFeeds";

const TFS = ["1m","3m","5m","30m","1h","24h"];

export default function CoinFocus(){
  const [pair, setPair] = useState("BTC/USD");
  const [tf, setTf]     = useState("1m");
  const [candles, setCandles] = useState([]);  // ascending [{t,o,h,l,c,v}]
  const [last, setLast] = useState(0);
  const [mode, setMode] = useState("line");    // "line" | "candle"
  const [pct, setPct]   = useState(1);         // slider 0..1 history window

  // initial history load
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const data = await fetchCryptoCandles(pair, tf, 400, ctrl.signal);
        setCandles(data);
        setLast(data[data.length-1]?.c ?? 0);
      } catch (e) {
        // fallback last price only (chart will wait for WS)
        try { setLast(await fetchCoinbasePrice(pair, ctrl.signal)); } catch {}
      }
    })();
    return () => ctrl.abort();
  }, [pair, tf]);

  // live WS stream
  useEffect(() => {
    let close = openCryptoWS({
      pair, tf,
      onTick: (p) => setLast(p),
      onCandle: (k) => {
        setCandles(prev => {
          if (!prev?.length) return [k];
          const lastIdx = prev.length - 1;
          // replace or append if new interval
          if (k.t === prev[lastIdx].t) {
            const next = prev.slice();
            next[lastIdx] = k;
            return next;
          } else if (k.t > prev[lastIdx].t) {
            return [...prev.slice(-399), k];
          } else {
            return prev;
          }
        });
      },
      onClose: () => {/* silent retry handled inside */}
    });
    return () => close && close();
  }, [pair, tf]);

  // derived slice for the slider window
  const view = useMemo(() => {
    const n = Math.max(10, Math.floor(candles.length * Math.max(0.05, pct)));
    return candles.slice(-n);
  }, [candles, pct]);

  // simple SVG render for line (keeps bundle light)
  const linePath = useMemo(() => {
    if (view.length < 2) return "";
    const w = 900, h = 360, pad = 8;
    const xs = (i) => pad + (i * (w - pad*2)) / (view.length - 1);
    const ys = (v) => {
      const lo = Math.min(...view.map(k => k.l ?? k.c));
      const hi = Math.max(...view.map(k => k.h ?? k.c));
      const t = (v - lo) / Math.max(1e-9, (hi - lo));
      return pad + (1 - t) * (h - pad*2);
    };
    return "M " + view.map((k,i)=>`${xs(i)},${ys(k.c)}`).join(" L ");
  }, [view]);

  return (
    <section className="focus-shell">
      <div className="focus-card fov-card">
        <div className="focus-head">
          <select value={pair} onChange={e=>setPair(e.target.value)} className="btn">
            <option>BTC/USD</option>
            <option>ETH/USD</option>
            <option>XRP/USD</option>
            <option>SOL/USD</option>
          </select>
          <select value={tf} onChange={e=>setTf(e.target.value)} className="btn">
            {TFS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="seg">
            <button className={mode==="candle"?"on":""} onClick={()=>setMode("candle")}>Candle</button>
            <button className={mode==="line"  ?"on":""} onClick={()=>setMode("line")}>Line</button>
          </div>
          <label className="kr">
            <input type="checkbox" disabled />
            <span>KnightRider picks</span>
          </label>
        </div>

        <div className="canvas-wrap">
          {mode === "line" ? (
            <svg viewBox="0 0 900 360" preserveAspectRatio="none" className="chart">
              <path d={linePath} vectorEffect="non-scaling-stroke" fill="none" strokeWidth="2"/>
            </svg>
          ) : (
            <div className="loading">Candle view coming (line is live)</div>
          )}
          <div className="go-live">● Live</div>
        </div>

        <div className="scrub-row">
          <input type="range" min="0.05" max="1" step="0.01" value={pct}
                 onChange={e=>setPct(Number(e.target.value))}/>
          <span className="scrub-label">{Math.round(pct*100)}% of history</span>
        </div>

        <div className="cta-row">
          <div className="last">Last:&nbsp;<strong><SafeRender value={last ? last.toLocaleString() : "…"} /></strong></div>
          <div className="ctas">
            <button className="buy">Buy</button>
            <button className="sell">Sell</button>
            <button className="trade">Trade</button>
          </div>
        </div>
      </div>
    </section>
  );
}
