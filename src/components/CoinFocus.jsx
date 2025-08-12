import knightPick from "../lib/knight";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAdaptivePoll } from "../lib/useAdaptivePoll";

const ALL = ["BTC/USD","ETH/USD","XRP/USD","BNB/USD","SOL/USD","ADA/USD","DOGE/USD","AVAX/USD","LINK/USD","TON/USD"];
const KNIGHT_PICKS = ["BTC/USD","ETH/USD","LINK/USD"];
const FUNCS = import.meta.env.VITE_FUNCS || "/.netlify/functions";

function useResize(ref){
  const [s,setS]=useState({w:0,h:0});
  useEffect(()=>{ if(!ref.current) return; const ro=new ResizeObserver(e=>{const r=e[0].contentRect; setS({w:Math.round(r.width),h:Math.round(r.height)});}); ro.observe(ref.current); return ()=>ro.disconnect();},[ref]);
  return s;
}

export default function CoinFocus(){
  const [pair, setPair] = useState("BTC/USD");
  const [tf, setTf] = useState("1m");
  const [usePicks, setUsePicks] = useState(false);

  const [candles, setCandles] = useState([]);
  const [lastPrice, setLastPrice] = useState(null);
  const [status, setStatus] = useState(null);
  const [isPaused, setPaused] = useState(false);
  const [rangePct, setRangePct] = useState(100);

  // populate dropdown with live symbols (best-effort)
  const [symbols, setSymbols] = useState(ALL);
  useEffect(()=>{(async()=>{
    try{
      const r = await fetch(`${FUNCS}/ticker`, {cache:"no-store"});
      if(!r.ok) return;
      const j = await r.json();
      const list = j.map(x=>String(x.symbol).replace("_","/")).filter(Boolean);
      if(list.length) setSymbols(Array.from(new Set(list)).sort());
    }catch(_){}
  })();},[]);

  useAdaptivePoll({ pair, tf, limit: 600, setCandles, setLastPrice, setStatus, isPaused });

  const view = useMemo(()=>{
    if(!candles.length) return [];
    const n = candles.length;
    const take = Math.max(20, Math.floor(rangePct/100 * n));
    return candles.slice(n - take);
  },[candles, rangePct]);

  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const size = useResize(wrapRef);

  useEffect(()=>{
    const cvs=canvasRef.current, el=wrapRef.current;
    if(!cvs || !el || !view.length) return;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio||1));
    const W = Math.max(10, size.w), H = Math.max(10, size.h);
    cvs.width=Math.floor(W*dpr); cvs.height=Math.floor(H*dpr); cvs.style.width=W+"px"; cvs.style.height=H+"px";
    const g=cvs.getContext("2d"); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);

    const padL=8,padR=8,padT=8,padB=18, innerW=W-padL-padR, innerH=H-padT-padB;
    let lo=Infinity, hi=-Infinity; for(const k of view){ if(k.l<lo) lo=k.l; if(k.h>hi) hi=k.h; }
    if(!isFinite(lo)||!isFinite(hi)||lo===hi){ lo=0; hi=1; }
    const x=i=>padL+(i/(view.length-1))*innerW;
    const y=p=>padT+(1-(p-lo)/(hi-lo))*innerH;

    // grid
    g.globalAlpha=.25; g.strokeStyle="rgba(212,175,55,.18)"; g.beginPath();
    for(let i=0;i<6;i++){ const yy=padT+(i/5)*innerH; g.moveTo(padL,yy); g.lineTo(W-padR,yy); }
    g.stroke(); g.globalAlpha=1;

    const barW = Math.max(1, innerW/Math.max(10,view.length)*0.7);
    for(let i=0;i<view.length;i++){
      const k=view[i], cx=x(i);
      g.strokeStyle="rgba(212,175,55,.6)"; g.beginPath(); g.moveTo(cx,y(k.h)); g.lineTo(cx,y(k.l)); g.stroke();
      const up=k.c>=k.o; g.fillStyle=up?"rgba(212,175,55,.85)":"rgba(164,22,26,.85)";
      const top=y(Math.max(k.o,k.c)), bot=y(Math.min(k.o,k.c)), h=Math.max(1,bot-top);
      g.fillRect(cx-barW/2, top, barW, h);
    }

    const last=view[view.length-1].c, yy=y(last);
    g.strokeStyle="rgba(24,194,124,.9)"; g.setLineDash([6,6]); g.beginPath(); g.moveTo(padL,yy); g.lineTo(W-padR,yy); g.stroke(); g.setLineDash([]);
    g.fillStyle="rgba(16,16,16,.95)"; const lbl=`${pair} ${last}`; const tw=g.measureText(lbl).width+10;
    g.fillRect(W-padR-tw, yy-10, tw, 18); g.fillStyle="#18c27c"; g.fillText(lbl, W-padR-tw+5, yy+3);
  },[view, size.w, size.h, pair]);

  return (
    <section className="focus-shell">
      <div className="focus-card">
        <div className="focus-head">
          <div className="focus-title">
            <div className="focus-label">FOCUS</div>
            <div className="focus-pair">{pair}</div>
          </div>
          <div className="focus-controls">
            <select value={pair} onChange={e=>{setPair(e.target.value); setPaused(false);}}>
              {(usePicks?KNIGHT_PICKS:symbols).map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <select value={tf} onChange={e=>setTf(e.target.value)}>
              <option value="1m">1m</option><option value="5m">5m</option>
              <option value="1h">1h</option><option value="1d">1d</option>
            </select>
            <label className="toggle">
              <input type="checkbox" checked={usePicks} onChange={e=>setUsePicks(e.target.checked)} />
              <span>KnightRider picks</span>
            </label>
          </div>
        </div>

        <div className="canvas-wrap" ref={wrapRef}>
          <canvas ref={canvasRef}/>
          <div className="loading"><span className={`live-dot ${!isPaused?'on':''}`}/>{isPaused?'Paused':'Live'}</div>
          {status && <div className="status">{status}</div>}
          {!isPaused
            ? <button className="go-live" onClick={()=>setPaused(true)}>Pause</button>
            : <button className="go-live" onClick={()=>setPaused(false)}>Resume</button>}
        </div>

        <div className="scrub-row"
          onMouseDown={()=>setPaused(true)} onTouchStart={()=>setPaused(true)}
          onMouseUp={()=>setPaused(false)} onTouchEnd={()=>setPaused(false)}
        >
          <input type="range" min="5" max="100" value={rangePct}
            onChange={e=>setRangePct(parseInt(e.target.value,10))}/>
          <div className="scrub-label">{rangePct}% of history</div>
        </div>

        <div className="cta-row">
          <button className="cta buy">Buy</button>
          <button className="cta sell">Sell</button>
          <button className="cta trade">Trade</button>
        </div>
      </div>
    </section>
  );
}
