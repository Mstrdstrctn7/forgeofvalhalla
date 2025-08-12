import React, {useEffect, useMemo, useState} from "react";

type Row = { symbol:string; last?:string; high?:string; low?:string; vol?:string; change?:string };

const ALL = ["BTC_USD","ETH_USD","XRP_USD","BNB_USD","SOL_USD","ADA_USD","DOGE_USD","AVAX_USD","LINK_USD","TON_USD"];

export default function Watch3(){
  const [symbols, setSymbols] = useState<string[]>(["BTC_USD","ETH_USD","XRP_USD"]);
  const [data, setData]       = useState<Record<string, Row>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  const options = useMemo(()=>ALL.filter(s=>!symbols.includes(s) || symbols.length<=3),[symbols]);

  async function load(){
    try{
      setLoading(true); setErr(null);
      const res = await fetch((await import("./lib/funcs")).fn("ticker"), {cache:"no-store"});
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const list: Row[] = await res.json();
      const map: Record<string, Row> = {};
      list.forEach(r => { if (r?.symbol) map[r.symbol] = r; });
      setData(map);
    }catch(e:any){
      setErr(String(e?.message || e));
    }finally{
      setLoading(false);
    }
  }

  useEffect(() => {
    load();                              // initial
    const id = setInterval(load, 3000);  // every 3s
    return () => clearInterval(id);
  }, []);

  function updateSlot(i:number, val:string){
    const next = symbols.slice();
    next[i] = val;
    setSymbols(next);
  }

  return (
    <div className="watch3-grid">
      {symbols.map((sym, i) => {
        const r = data[sym];
        return (
          <div key={i} className="watch3-item">
            <div className="watch3-head">
              <select value={sym} onChange={e=>updateSlot(i, e.target.value)}>
                {options.concat(sym).sort().map(s =>
                  <option key={s} value={s}>{s.replace("_","/")}</option>
                )}
              </select>
              <span className="watch3-badge">{loading ? "…" : (err ? "Error" : "Live")}</span>
            </div>

            <div className="watch3-price">
              <div className="watch3-symbol">{sym.replace("_","/")}</div>
              <div className="watch3-last">{r?.last ?? "—"}</div>
            </div>

            <div className="watch3-meta">
              <div>24h Δ: {r?.change ?? "—"}</div>
              <div>High: {r?.high ?? "—"}</div>
              <div>Low: {r?.low ?? "—"}</div>
              <div>Vol: {r?.vol ?? "—"}</div>
            </div>

            {err && <div className="watch3-err">⚠ {err}</div>}
          </div>
        );
      })}
    </div>
  );
}
