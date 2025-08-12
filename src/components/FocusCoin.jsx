import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import { knightRiderToday } from "../lib/kr";

const ALL = [
  "BTC_USD","ETH_USD","SOL_USD","XRP_USD","ADA_USD","DOGE_USD",
  "AVAX_USD","LINK_USD","TON_USD","DOT_USD","NEAR_USD","ATOM_USD"
];

function useWatchlist(){
  const key="fov.watchlist";
  const [list,setList]=useState(()=>{
    try{ return JSON.parse(localStorage.getItem(key)||"[]") }catch{return []}
  });
  useEffect(()=>{ localStorage.setItem(key, JSON.stringify(list)); },[list]);
  function add(sym){ setList(p=> p.includes(sym)?p:[...p,sym]); }
  function remove(sym){ setList(p=> p.filter(x=>x!==sym)); }
  function move(sym,dir){ setList(p=> {
    const i=p.indexOf(sym); if(i<0) return p.slice();
    const j = Math.min(p.length-1, Math.max(0, i+(dir==="up"?-1:1)));
    const q=p.slice(); [q[i],q[j]]=[q[j],q[i]]; return q;
  });}
  return {list, add, remove, move, setList};
}

export default function FocusCoin(){
  const KR = knightRiderToday(3);
  const {list, add, remove, move, setList} = useWatchlist();
  const [useKR, setUseKR] = useState(false);
  const choices = useMemo(()=> Array.from(new Set([...(useKR?KR:[]), ...ALL])), [useKR, KR]);

  const [symbol,setSymbol] = useState(()=> (list[0] || KR[0] || "BTC_USD"));
  useEffect(()=>{ if(list.length===0) setList([symbol]); },[]); // seed

  // --- Price (every 3s) ---
  const [price,setPrice]=useState(null);
  async function loadPrice(){
    try{
      const r = await fetch("/.netlify/functions/ticker",{cache:"no-store"});
      const rows = await r.json();
      const map={}; rows.forEach(x=>map[x.symbol]=x);
      setPrice(map[symbol]?.last ?? null);
    }catch{/* ignore */}
  }
  useEffect(()=>{ loadPrice(); const id=setInterval(loadPrice,3000); return ()=>clearInterval(id); },[symbol]);

  // --- OHLC chart ---
  const ref=useRef(null), seriesRef=useRef(null), chartRef=useRef(null);
  async function loadCandles(){
    const r = await fetch(`/.netlify/functions/ohlc?symbol=${encodeURIComponent(symbol)}&interval=1m&limit=300`);
    const data = await r.json();
    if(!Array.isArray(data)) return;
    if(!chartRef.current){
      const ch = createChart(ref.current, {
        height: 280,
        layout:{ background:{ type:"solid", color:"#0b0b0b" }, textColor:"#ddd" },
        grid:{ vertLines:{color:"#1b1b1b"}, horzLines:{color:"#1b1b1b"} },
        crosshair:{ mode: CrosshairMode.Magnet },
        rightPriceScale:{ borderVisible:false },
        timeScale:{ borderVisible:false }
      });
      chartRef.current = ch;
      seriesRef.current = ch.addCandlestickSeries({
        upColor:"#16a34a", downColor:"#b91c1c", borderVisible:false, wickUpColor:"#16a34a", wickDownColor:"#b91c1c"
      });
      // responsive
      const ro = new ResizeObserver(()=> ch.applyOptions({ width: ref.current.clientWidth }));
      ro.observe(ref.current);
    }
    seriesRef.current.setData(data);
  }
  useEffect(()=>{ loadCandles(); const id=setInterval(loadCandles, 60_000); return ()=>clearInterval(id); },[symbol]);

  // watchlist helpers
  useEffect(()=>{ if(!list.includes(symbol)) add(symbol); },[symbol]);

  return (
    <div className="focus-wrap">
      <div className="focus-head">
        <div className="left">
          <label className="lbl">Market</label>
          <select className="sel" value={symbol} onChange={e=>setSymbol(e.target.value)}>
            {choices.map(s => <option key={s} value={s}>{s.replace("_","/")}</option>)}
          </select>
        </div>
        <div className="right">
          <label className="toggle">
            <input type="checkbox" checked={useKR} onChange={e=>setUseKR(e.target.checked)} />
            <span/> KnightRider picks
          </label>
          <div className="price">{symbol.replace("_","/")} <b>{price ?? "—"}</b></div>
        </div>
      </div>

      <div ref={ref} className="chart-box" />

      <div className="watchlist">
        <div className="wl-head">Your watchlist</div>
        {(list.length? list: [symbol]).map(s=>(
          <div className={"wl-row"+(s===symbol?" active":"")} key={s}>
            <button className="btn tiny" onClick={()=>move(s,"up")}>↑</button>
            <button className="btn tiny" onClick={()=>move(s,"down")}>↓</button>
            <button className="btn tiny" onClick={()=>setSymbol(s)}>Focus</button>
            <span className="wl-name">{s.replace("_","/")}</span>
            <button className="btn tiny danger" onClick={()=>remove(s)}>✕</button>
          </div>
        ))}
        <div className="adder">
          <select onChange={e=> e.target.value && add(e.target.value)}>
            <option value="">+ Add coin…</option>
            {ALL.filter(s=>!list.includes(s)).map(s=><option key={s} value={s}>{s.replace("_","/")}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
