import React, { useEffect, useMemo, useRef, useState } from "react";

const ALL = ["BTC_USD","ETH_USD","XRP_USD","SOL_USD","BNB_USD","ADA_USD","DOGE_USD","AVAX_USD","LINK_USD","TON_USD"];
const TFS = ["1m","5m","1h","1d"];

function knightSuggestions(){
  const day = Math.floor(Date.now()/86400000);
  return [0,1,2].map(i => ALL[(day + i*7) % ALL.length]);
}

function fmt(n){ if(n==null) return "—"; const f=+n; return (f>=1000)?Math.round(f).toString():f.toString(); }

export default function CoinFocus(){
  const [symbol, setSymbol] = useState(()=>localStorage.getItem("fov:symbol") || "BTC_USD");
  const [tf, setTf]         = useState(()=>localStorage.getItem("fov:tf") || "1m");
  const [watch, setWatch]   = useState(()=>JSON.parse(localStorage.getItem("fov:watch")||"[]"));
  const [useKR, setUseKR]   = useState(()=>localStorage.getItem("fov:kr")==="1");
  const [last, setLast]     = useState(null);
  const [err, setErr]       = useState(null);
  const [modal, setModal]   = useState(null); // {type:"buy"/"sell"/"trade"}
  const cvsRef              = useRef(null);

  const list = useMemo(()=> useKR ? knightSuggestions() : (watch.length ? watch : [symbol]), [useKR, watch, symbol]);

  function toggleKR(on){ setUseKR(on); localStorage.setItem("fov:kr", on ? "1":"0"); }
  function addToWatch(sym){ const s=new Set(watch); s.add(sym); const next=[...s]; setWatch(next); localStorage.setItem("fov:watch",JSON.stringify(next)); }
  function removeFromWatch(sym){ const next=watch.filter(x=>x!==sym); setWatch(next); localStorage.setItem("fov:watch",JSON.stringify(next)); }
  function setTF(v){ setTf(v); localStorage.setItem("fov:tf", v); }

  function drawCandles(candles){
    const cvs=cvsRef.current; if(!cvs) return;
    const ctx=cvs.getContext("2d");
    const W=cvs.width = cvs.clientWidth || 640;
    const H=cvs.height= cvs.clientHeight|| 360;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#0c0c0c"; ctx.fillRect(0,0,W,H);
    if(!candles?.length){ ctx.fillStyle="#aaa"; ctx.fillText("No candle data",12,20); return; }

    const lows=candles.map(c=>c.l), highs=candles.map(c=>c.h);
    const min=Math.min(...lows), max=Math.max(...highs), pad=(max-min)*0.08||1;
    const yMin=min-pad, yMax=max+pad; const n=candles.length; const gap=W/n;

    ctx.strokeStyle="rgba(255,255,255,.06)";
    for(let i=1;i<6;i++){ const y=(H/6)*i; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    for(let i=0;i<n;i++){
      const c=candles[i]; const x=i*gap+gap*0.5; const y=v=>H-((v-yMin)/(yMax-yMin))*H;
      const up=c.c>=c.o; ctx.strokeStyle=up?"#27ae60":"#e74c3c"; ctx.fillStyle=up?"rgba(39,174,96,.9)":"rgba(231,76,60,.9)";
      ctx.beginPath(); ctx.moveTo(x,y(c.l)); ctx.lineTo(x,y(c.h)); ctx.stroke();
      const bw=Math.max(2,gap*.5); const y1=y(c.o), y2=y(c.c); const top=Math.min(y1,y2), h=Math.abs(y1-y2)||2;
      ctx.fillRect(x-bw/2, top, bw, h);
    }
  }

  async function load(){
    try{
      setErr(null);
      // price ping
      const t = await fetch("/.netlify/functions/ticker",{cache:"no-store"}).then(r=>r.json()).catch(()=>[]);
      const row = Array.isArray(t) ? t.find(r=>r.symbol===symbol) : null;
      if(row) setLast(row.last);

      // candles
      let candles = await fetch(`/.netlify/functions/candles?symbol=${symbol}&tf=${tf}&limit=180`,{cache:"no-store"}).then(r=>r.json());
      if (Array.isArray(candles) && candles.length && candles[0].o===undefined) {
        // Fallback in case another format slips in
        candles = candles.map(a=>({o:a[1],h:a[2],l:a[3],c:a[4]}));
      }
      drawCandles(candles);
    }catch(e){ setErr(String(e?.message||e)); }
  }

  useEffect(()=>{ localStorage.setItem("fov:symbol",symbol); load(); const id=setInterval(load,5000); return ()=>clearInterval(id); },[symbol,tf]);

  return (
    <div className="focus-wrap">
      <div className="focus-card">
        <div className="focus-header">
          <div className="pill">Market: USDT</div>
          <select className="sel" value={symbol} onChange={e=>setSymbol(e.target.value)}>
            {ALL.map(s=><option key={s} value={s}>{s.replace("_","/")}</option>)}
          </select>
          <div className="tf">
            {TFS.map(x=><button key={x} className={x===tf?"active":""} onClick={()=>setTF(x)}>{x}</button>)}
          </div>
          <label className="pill" style={{display:"flex",alignItems:"center",gap:8}}>
            <input type="checkbox" checked={useKR} onChange={e=>toggleKR(e.target.checked)} /> KnightRider
          </label>
          <button className="btn" onClick={()=>addToWatch(symbol)}>+ Watch</button>
          <button className="btn" onClick={()=>removeFromWatch(symbol)} disabled={!watch.includes(symbol)}>− Unwatch</button>
        </div>

        <div className="price-row">
          <div className="sym">{symbol.replace("_","/")}</div>
          <div className="last">{fmt(last)}</div>
        </div>

        <div className="canvas-wrap"><canvas ref={cvsRef}/></div>

        <div className="action-row">
          <button className="act buy"  onClick={()=>setModal({type:"buy"})}>Buy</button>
          <button className="act sell" onClick={()=>setModal({type:"sell"})}>Sell</button>
          <button className="act trade" onClick={()=>setModal({type:"trade"})}>Trade</button>
        </div>

        <div className="watchlist">
          {(useKR ? knightSuggestions() : watch).map(s=>(
            <span key={s} className={"chip"+(s===symbol?" active":"")} onClick={()=>setSymbol(s)}>
              {s.replace("_","/")}
            </span>
          ))}
        </div>

        {err && <div className="hint" style={{color:"#ffd6d6"}}>⚠ {err}</div>}
        <div className="hint">Tip: tap a timeframe, then Buy/Sell/Trade (modal placeholder) — watchlist & KnightRider picks below.</div>
      </div>

      {modal && (
        <div className="modal" onClick={()=>setModal(null)}>
          <div className="box" onClick={e=>e.stopPropagation()}>
            <h3 style={{color:"var(--gold,#d4af37)"}}>
              {modal.type==="buy" ? "Buy" : modal.type==="sell" ? "Sell" : "Trade"} {symbol.replace("_","/")}
            </h3>
            <p>This is a placeholder. Wire this to your exchange or on-chain flow later.</p>
            <button className="btn close" onClick={()=>setModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
