import { useEffect, useRef, useState } from "react";

const DEFAULT_POLL_MS = Number(import.meta.env.VITE_POLL_MS || 3000);

export default function PricesStream({ symbols = ["BTC","ETH"] }) {
  const [data, setData] = useState({ prices:{}, ts: null, meta:null });
  const pollRef = useRef(null);

  useEffect(() => {
    const qs = encodeURIComponent(symbols.join(","));
    const hit = async () => {
      try {
        const res = await fetch(`/.netlify/functions/get-prices?symbols=${qs}`, {
          headers: { "accept":"application/json", "cache-control":"no-cache" }
        });
        const j = await res.json();
        if (res.ok) setData(j);
      } catch {}
    };
    hit();
    clearInterval(pollRef.current);
    pollRef.current = setInterval(hit, DEFAULT_POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [symbols]);

  return (
    <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, marginTop:16}}>
      {symbols.map(sym => {
        const val = data?.prices?.[sym];
        return (
          <div key={sym} style={{padding:16, borderRadius:16, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{opacity:0.7, marginBottom:6}}>{sym} (USD)</div>
            <div style={{fontSize:28, fontWeight:700}}>{Number.isFinite(val) ? val.toLocaleString() : "—"}</div>
          </div>
        );
      })}
      <div style={{gridColumn:"1/-1", fontSize:12, opacity:0.6, marginTop:6}}>
        Last updated: {data.ts ? new Date(data.ts).toLocaleTimeString() : "—"}
      </div>
    </div>
  );
}
