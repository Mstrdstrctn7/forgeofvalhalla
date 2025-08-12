import React, { useEffect, useMemo, useRef, useState } from "react";
import { createChart, ColorType, LineStyle } from "lightweight-charts";
import supa, { supa as _supa } from "../lib/supa.js";
import { knightRiderToday } from "../lib/daily-picks";

const FUNCS = import.meta.env.VITE_FUNCS || "/.netlify/functions";
const ALL = ["BTC_USD","ETH_USD","XRP_USD","BNB_USD","SOL_USD","LINK_USD","AVAX_USD","ADA_USD","DOGE_USD","TON_USD","NEAR_USD"];

function useUserId(){
  try{
    if (_supa?.auth) return _supa.auth.getUser().then(r=>r.data?.user?.id).catch(()=>null);
  }catch{}
  return Promise.resolve(null);
}

async function loadWatchlist(userId){
  if (userId && supa?.from){
    const { data } = await supa.from("watchlist").select("*").eq("user_id", userId).order("position",{ascending:true});
    if (data?.length) return data.map(d=>d.symbol);
  }
  const raw = localStorage.getItem("fov_watchlist");
  return raw ? JSON.parse(raw) : ["BTC_USD","ETH_USD","ETH_USD".replace("ETH","SOL")]; // BTC, SOL default
}
async function saveWatchlist(list, userId){
  if (userId && supa?.from){
    await supa.from("watchlist").delete().eq("user_id", userId);
    await supa.from("watchlist").insert(list.map((s,i)=>({user_id:userId, symbol:s, position:i})));
  } else {
    localStorage.setItem("fov_watchlist", JSON.stringify(list));
  }
}

export default function CoinFocus(){
  const [useKR, setUseKR] = useState(false);
  const [watch, setWatch] = useState(["BTC_USD","ETH_USD"]);
  const [symbol, setSymbol] = useState("BTC_USD");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const dailyPicks = useMemo(()=>knightRiderToday(),[]);
  const picks = useKR ? dailyPicks : watch;

  useEffect(() => {
    (async ()=>{
      const uid = await useUserId();
      const wl = await loadWatchlist(uid);
      setWatch(wl);
      setSymbol((useKR ? dailyPicks[0] : wl[0]) || "BTC_USD");
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useKR]);

  // Chart
  const wrapRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  // Create once
  useEffect(() => {
    if (!wrapRef.current || chartRef.current) return;
    const chart = createChart(wrapRef.current, {
      autoSize: true,
      layout: { background: {type: ColorType.Solid, color: "#0b0b0b"}, textColor: "#d4d4d4"},
      grid: { vertLines:{color:"#1b1b1b"}, horzLines:{color:"#1b1b1b"} },
      timeScale: { rightOffset: 2, borderColor: "#222" },
      rightPriceScale: { borderColor: "#222" },
      crosshair: { mode: 1, horzLine: {style: LineStyle.Dotted}, vertLine: {style: LineStyle.Dotted} }
    });
    const series = chart.addCandlestickSeries({
      upColor: "#3fb950", downColor: "#e5534b", borderUpColor: "#3fb950", borderDownColor: "#e5534b", wickUpColor: "#3fb950", wickDownColor: "#e5534b",
    });
    chartRef.current = chart;
    seriesRef.current = series;
    const ro = new ResizeObserver(()=> chart.applyOptions({}));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  async function fetchCandles(sym){
    const url = `${FUNCS}/candles?symbol=${encodeURIComponent(sym)}&interval=1m&limit=300`;
    const res = await fetch(url, {cache:"no-store"});
    if (!res.ok) throw new Error("HTTP "+res.status);
    const j = await res.json();
    return j.candles;
  }

  // Load + live update
  useEffect(() => {
    let timer;
    async function load(){
      try{
        setLoading(true); setErr("");
        const c = await fetchCandles(symbol);
        seriesRef.current?.setData(c);
      }catch(e){ setErr(String(e?.message||e)); }
      finally{ setLoading(false); }
    }
    load();
    timer = setInterval(async ()=>{
      try{
        const c = await fetchCandles(symbol);
        seriesRef.current?.setData(c);
      }catch(e){}
    }, 3000);
    return ()=> clearInterval(timer);
  }, [symbol]);

  function onReorder(idx, dir){
    const next = watch.slice();
    const j = idx + (dir==="up"?-1:1);
    if (j<0 || j>=next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setWatch(next); saveWatchlist(next, null);
  }
  async function onAdd(sym){
    const next = Array.from(new Set([...watch, sym]));
    setWatch(next); await saveWatchlist(next, null);
  }
  async function onRemove(sym){
    const next = watch.filter(s=>s!==sym);
    setWatch(next); await saveWatchlist(next, null);
  }

  return (
    <div className="focus-wrap">
      <div className="focus-bar">
        <div className="focus-row">
          <select value={symbol} onChange={e=>setSymbol(e.target.value)}>
            {(useKR? dailyPicks : ALL).map(s=><option key={s} value={s}>{s.replace("_","/")}</option>)}
          </select>
          <label className="toggle">
            <input type="checkbox" checked={useKR} onChange={e=>setUseKR(e.target.checked)}/>
            <span/> KnightRider
          </label>
        </div>
        <div className="watchline">
          {!useKR && watch.map((s,i)=>(
            <div key={s} className={`chip ${s===symbol?"active":""}`}>
              <button onClick={()=>setSymbol(s)}>{s.replace("_","/")}</button>
              <span className="chip-tools">
                <b onClick={()=>onReorder(i,"up")}>↑</b>
                <b onClick={()=>onReorder(i,"down")}>↓</b>
                <b onClick={()=>onRemove(s)}>×</b>
              </span>
            </div>
          ))}
          {!useKR &&
            <select className="chip-add" onChange={e=>{ if(e.target.value) onAdd(e.target.value); e.target.value=""; }}>
              <option value="">+ add</option>
              {ALL.filter(s=>!watch.includes(s)).map(s=><option key={s} value={s}>{s.replace("_","/")}</option>)}
            </select>
          }
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-head">
          <div className="title">{symbol.replace("_","/")} {loading ? "…" : ""}</div>
          {err && <div className="err">⚠ {err}</div>}
        </div>
        <div ref={wrapRef} className="chart-wrap" />
      </div>
    </div>
  );
}
