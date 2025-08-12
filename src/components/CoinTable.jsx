import React, { useEffect, useMemo, useState } from "react";

export default function CoinTable(){
  const [rows,setRows] = useState([]);
  const [q,setQ] = useState("");
  const [limit,setLimit] = useState(100);
  const [market,setMarket] = useState("USDT");
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try{
      const r = await fetch("/.netlify/functions/ticker?market="+market+"&limit="+limit, { cache:"no-store" });
      if(!r.ok) throw new Error("HTTP "+r.status);
      const j = await r.json();
      setRows(Array.isArray(j) ? j : []);
    }catch(ex){ setError(ex.message || String(ex)); }
    finally{ setLoading(false); }
  };
  useEffect(()=>{ load(); },[]);

  const filtered = useMemo(()=> {
    const s = q.trim().toLowerCase();
    if(!s) return rows;
    return rows.filter(r => String(r.symbol||"").toLowerCase().includes(s));
  }, [rows,q]);

  return (
    <div className="card">
      <div className="toolbar">
        <div>
          <label style={{opacity:.75, marginRight:8}}>Market</label>
          <select className="input" value={market} onChange={e=>setMarket(e.target.value)}>
            <option>USDT</option><option>USD</option><option>BTC</option><option>ETH</option>
          </select>
        </div>
        <select className="input" value={limit} onChange={e=>setLimit(Number(e.target.value))}>
          <option>50</option><option>100</option><option>200</option>
        </select>
        <input className="input" placeholder="Search (e.g. BTC, ETH)"
               value={q} onChange={e=>setQ(e.target.value)} style={{minWidth:220}} />
        <button className="btn" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && <div style={{color:"var(--err)", marginBottom:8}}>Error: {error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th className="num">Last</th>
              <th className="num">24h Δ</th>
              <th className="num">High</th>
              <th className="num">Low</th>
              <th className="num">Vol</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{padding:"12px 10px",opacity:.7}}>No rows.</td></tr>
            )}
            {filtered.map((r,i)=>(
              <tr key={i}>
                <td>{r.symbol}</td>
                <td className="num">{r.last ?? ""}</td>
                <td className="num">{r.change ?? ""}</td>
                <td className="num">{r.high ?? ""}</td>
                <td className="num">{r.low ?? ""}</td>
                <td className="num">{r.vol ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
