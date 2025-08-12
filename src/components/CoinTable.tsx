import { useEffect, useMemo, useState } from "react";
type Row={symbol:string,last:string,change?:string,high?:string,low?:string,vol?:string};
export default function CoinTable(){
  const [rows,setRows]=useState<Row[]>([]); const [q,setQ]=useState(""); const [quote,setQuote]=useState<"USDT"|"USD"|"ALL">("USDT");
  const [limit,setLimit]=useState(100); const [err,setErr]=useState<string|undefined>();
  async function load(){ try{ setErr(undefined);
      const url=new URL("/.netlify/functions/ticker", location.origin);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("quote", quote);
      const r=await fetch(url.toString(),{cache:"no-store"});
      if(!r.ok) throw new Error(String(r.status));
      setRows(await r.json());
    }catch(e:any){ setErr(e?.message||"fail"); } }
  useEffect(()=>{ load(); const id=setInterval(load, 10000); return ()=>clearInterval(id);},[quote,limit]);
  const data=useMemo(()=>rows.filter(r=>r.symbol.toLowerCase().includes(q.toLowerCase())),[rows,q]);
  return (
    <div style={{padding:16,border:"1px solid #222",borderRadius:16,background:"#0b0b0b"}}>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}>
        <strong style={{fontSize:14}}>Market</strong>
        <select value={quote} onChange={e=>setQuote(e.target.value as any)} style={{background:"#111",border:"1px solid #222",color:"#fff",padding:"6px 8px",borderRadius:8}}>
          <option value="USDT">USDT</option><option value="USD">USD</option><option value="ALL">ALL</option>
        </select>
        <select value={limit} onChange={e=>setLimit(Number(e.target.value))} style={{background:"#111",border:"1px solid #222",color:"#fff",padding:"6px 8px",borderRadius:8}}>
          <option>50</option><option>100</option><option>200</option>
        </select>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search (e.g. BTC, ETH)"
          style={{flex:1,background:"#111",border:"1px solid #222",color:"#fff",padding:"8px 10px",borderRadius:10}}/>
        <button onClick={load} style={{padding:"8px 12px",borderRadius:10,background:"#1f2937",border:"1px solid #374151"}}>Refresh</button>
      </div>
      {err && <div style={{color:"#f87171",fontSize:12,marginBottom:8}}>Error: {err}</div>}
      <div style={{overflow:auto}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
          <thead><tr style={{textAlign:"left",opacity:.7}}>
            <th style={{padding:"6px 8px"}}>Symbol</th>
            <th style={{padding:"6px 8px"}}>Last</th>
            <th style={{padding:"6px 8px"}}>24h Δ</th>
            <th style={{padding:"6px 8px"}}>High</th>
            <th style={{padding:"6px 8px"}}>Low</th>
            <th style={{padding:"6px 8px"}}>Vol</th>
          </tr></thead>
          <tbody>
            {data.map((r)=>(
              <tr key={r.symbol} style={{borderTop:"1px solid #111"}}>
                <td style={{padding:"8px"}}>{r.symbol}</td>
                <td style={{padding:"8px"}}>{r.last}</td>
                <td style={{padding:"8px"}}>{r.change??""}</td>
                <td style={{padding:"8px"}}>{r.high??""}</td>
                <td style={{padding:"8px"}}>{r.low??""}</td>
                <td style={{padding:"8px"}}>{r.vol??""}</td>
              </tr>
            ))}
            {!data.length && <tr><td style={{padding:"8px"}} colSpan={6}>No rows.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
