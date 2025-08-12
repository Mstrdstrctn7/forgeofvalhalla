import React, { useEffect, useMemo, useRef, useState } from "react";

type Row = { symbol:string; last?:string; change?:string; high?:string; low?:string; vol?:string };

const LS_KEY = "fov.watch3.symbols";
const DEFAULTS = ["BTC_USD","ETH_USD","SOL_USD"];

function useInterval(fn:()=>void, ms:number){
  const ref = useRef(fn);
  useEffect(()=>{ ref.current = fn; },[fn]);
  useEffect(()=>{
    const id = setInterval(()=>ref.current(), ms);
    return ()=>clearInterval(id);
  },[ms]);
}

export default function Watch3(){
  const [all, setAll] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [symbols, setSymbols] = useState<string[]>(()=>{
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch {}
    return DEFAULTS;
  });

  const save = (vals:string[])=>{
    setSymbols(vals);
    try { localStorage.setItem(LS_KEY, JSON.stringify(vals)); } catch {}
  };

  const fetchNow = async ()=>{
    try{
      const res = await fetch("/.netlify/functions/ticker", { cache:"no-store" });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      setAll(Array.isArray(j) ? j : []);
      setError(null);
    }catch(e:any){
      setError(String(e?.message || e));
    }
  };

  useEffect(()=>{ fetchNow(); },[]);
  useInterval(fetchNow, 3000);

  const bySymbol = useMemo(()=>{
    const map = new Map<string, Row>();
    for(const r of all) map.set(String(r.symbol), r);
    return map;
  },[all]);

  const options = useMemo(()=>all.map(r=>r.symbol).sort(),[all]);

  const rows = symbols.slice(0,3).map(sym => ({
    sym,
    row: bySymbol.get(sym)
  }));

  return (
    <div style={{display:"grid", gap:12}}>
      <div className="card" style={{padding:"12px"}}>
        <div className="toolbar" style={{marginBottom:8}}>
          <div style={{fontWeight:700}}>Watch 3</div>
          <div style={{opacity:.8, fontSize:12}}>{error ? <span style={{color:"#f88"}}>Error: {error}</span> : "Auto-updating every 3s"}</div>
        </div>
        <div className="watch3-grid">
          {rows.map((r, idx)=>(
            <div key={idx} className="watch3-item">
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <strong style={{color:"var(--gold)"}}>{r.sym}</strong>
                <select
                  className="input"
                  value={symbols[idx] || ""}
                  onChange={e=>{
                    const v = e.target.value;
                    const next = [...symbols];
                    next[idx] = v;
                    // prevent duplicates
                    for(let i=0;i<next.length;i++){
                      if(i!==idx && next[i]===v){ next[i] = ""; }
                    }
                    save(next.slice(0,3));
                  }}
                >
                  <option value="">Select…</option>
                  {options.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="watch3-price">
                {r.row?.last ? Number(r.row.last).toLocaleString() : "—"}
              </div>

              <div className="watch3-meta">
                <span>
                  24h Δ:{" "}
                  {r.row?.change && r.row.change !== ""
                    ? r.row.change
                    : "—"}
                </span>
                <span>H: {r.row?.high || "—"}</span>
                <span>L: {r.row?.low || "—"}</span>
                <span>Vol: {r.row?.vol || "—"}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:8, display:"flex", gap:8}}>
          <button className="btn" onClick={()=>save(DEFAULTS)}>Reset</button>
          <button className="btn primary" onClick={fetchNow}>Refresh now</button>
        </div>
      </div>
    </div>
  );
}
