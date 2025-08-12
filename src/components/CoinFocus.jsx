import React, { useEffect, useMemo, useRef, useState } from "react";

const ALL = ["BTC_USD","ETH_USD","XRP_USD","SOL_USD","BNB_USD","ADA_USD","DOGE_USD","AVAX_USD","LINK_USD","TON_USD"];

// KnightRider suggested list (rotates daily)
function knightSuggestions(){
  const day = Math.floor(Date.now()/86400000);
  const picks = [];
  for(let i=0;i<3;i++){
    const idx = (day + i * 7) % ALL.length;
    picks.push(ALL[idx]);
  }
  return picks;
}

export default function CoinFocus(){
  const [symbol, setSymbol] = useState(()=>localStorage.getItem("fov:symbol") || "BTC_USD");
  const [watch, setWatch]   = useState(()=>JSON.parse(localStorage.getItem("fov:watch")||"[]"));
  const [useKR, setUseKR]   = useState(()=>localStorage.getItem("fov:kr")==="1");
  const [last, setLast]     = useState(null);
  const [err, setErr]       = useState(null);
  const cvsRef              = useRef(null);

  const list = useMemo(()=>{
    if (useKR) return knightSuggestions();
    return watch.length ? watch : [symbol];
  }, [useKR, watch, symbol]);

  function toggleKR(on){
    setUseKR(on);
    localStorage.setItem("fov:kr", on ? "1":"0");
  }

  function addToWatch(sym){
    const s = new Set(watch);
    s.add(sym);
    const next = Array.from(s);
    setWatch(next);
    localStorage.setItem("fov:watch", JSON.stringify(next));
  }

  function removeFromWatch(sym){
    const next = watch.filter(x=>x!==sym);
    setWatch(next);
    localStorage.setItem("fov:watch", JSON.stringify(next));
  }

  // draw simple candlesticks on a canvas
  function drawCandles(candles){
    const cvs = cvsRef.current;
    if(!cvs) return;
    const ctx = cvs.getContext("2d");
    const W = cvs.width = cvs.clientWidth || 640;
    const H = cvs.height = cvs.clientHeight || 360;

    ctx.clearRect(0,0,W,H);
    if (!candles || !candles.length){ 
      ctx.fillStyle = "#999"; ctx.fillText("No candle data", 12, 20); return; 
    }

    const lows  = candles.map(c=>c.l);
    const highs = candles.map(c=>c.h);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const pad = (max-min)*0.08 || 1;
    const yMin = min - pad, yMax = max + pad;
    const n = candles.length;
    const gap = W / n;

    ctx.fillStyle = "#111";
    ctx.fillRect(0,0,W,H);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,.06)";
    ctx.lineWidth = 1;
    for(let i=1;i<6;i++){
      const y = (H/6)*i;
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }

    for(let i=0;i<n;i++){
      const c = candles[i];
      const open  = c.o, close = c.c, high = c.h, low = c.l;
      const x = i*gap + gap*0.5;
      const y = v => H - ( (v - yMin) / (yMax - yMin) ) * H;

      const up = close >= open;
      ctx.strokeStyle = up ? "#27ae60" : "#c0392b";
      ctx.fillStyle   = up ? "rgba(39,174,96,.9)" : "rgba(192,57,43,.9)";

      // wick
      ctx.beginPath();
      ctx.moveTo(x, y(low));  ctx.lineTo(x, y(high)); ctx.stroke();

      // body
      const bw = Math.max(2, gap*0.5);
      const y1 = y(open), y2 = y(close);
      const top = Math.min(y1,y2), h = Math.abs(y1-y2) || 2;
      ctx.fillRect(x-bw/2, top, bw, h);
    }
  }

  async function load(){
    try{
      setErr(null);

      // price snapshot
      const t = await fetch("/.netlify/functions/ticker",{cache:"no-store"}).then(r=>r.json());
      const row = t.find(r=>r.symbol===symbol);
      if(row){ setLast(row.last); }

      // candles (expects Netlify function 'candles': symbol=BTC_USD, tf=1m, limit=120)
      let candles = [];
      try{
        candles = await fetch(`/.netlify/functions/candles?symbol=${symbol}&tf=1m&limit=120`,{cache:"no-store"}).then(r=>r.json());
        // normalize: expect array of {o,h,l,c}
        if (Array.isArray(candles) && candles.length && candles[0].o===undefined){
          // some APIs send [time,open,high,low,close]
          candles = candles.map(a=>({o:a[1],h:a[2],l:a[3],c:a[4]}));
        }
      }catch(e){ /* optional */ }

      drawCandles(candles);
    }catch(e){
      setErr(String(e?.message||e));
    }
  }

  useEffect(()=>{
    localStorage.setItem("fov:symbol", symbol);
    load();
    const id = setInterval(load, 3000);
    return ()=>clearInterval(id);
    // eslint-disable-next-line
  }, [symbol]);

  return (
    <div className="focus-wrap">
      <div className="focus-card">
        <div className="focus-bar">
          <div className="pill">Market: USDT</div>
          <select value={symbol} onChange={e=>setSymbol(e.target.value)}>
            {ALL.map(s=><option key={s} value={s}>{s.replace("_","/")}</option>)}
          </select>

          <div className="toggle">
            <label style={{display:"flex",alignItems:"center",gap:6}}>
              <input type="checkbox" checked={useKR} onChange={e=>toggleKR(e.target.checked)} />
              KnightRider
            </label>
          </div>

          <button onClick={()=>addToWatch(symbol)}>+ Watch</button>
          <button onClick={()=>removeFromWatch(symbol)} disabled={!watch.includes(symbol)}>− Unwatch</button>
        </div>

        <div className="price-row">
          <div className="sym">{symbol.replace("_","/")}</div>
          <div className="last">{last ?? "—"}</div>
        </div>

        <div className="canvas-wrap"><canvas ref={cvsRef}/></div>

        <div className="watchlist">
          {(useKR ? knightSuggestions() : watch).map(s=>(
            <span key={s} className={"chip"+(s===symbol?" active":"")} onClick={()=>setSymbol(s)}>
              {s.replace("_","/")}
            </span>
          ))}
        </div>

        {err && <div className="hint" style={{color:"#ffd6d6"}}>⚠ {err}</div>}
        <div className="hint">Tip: add to your watchlist, or toggle KnightRider for rotating daily picks.</div>
      </div>
    </div>
  );
}
