import { useEffect, useState } from "react";

const ALL = ["BTC","ETH","SOL","XRP","ADA","LTC","DOGE"];
const KEY = "fov:selectedSymbols";

export default function CoinsSelector({ value, onChange, max=3 }) {
  const [opts] = useState(ALL);
  const [sel, setSel] = useState(value?.length ? value : ["BTC","ETH"]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (saved.length) setSel(saved.slice(0,max));
  }, [max]);

  useEffect(() => {
    onChange?.(sel);
    localStorage.setItem(KEY, JSON.stringify(sel));
  }, [sel, onChange]);

  const toggle = (sym) => {
    setSel(prev => {
      if (prev.includes(sym)) return prev.filter(s => s!==sym);
      if (prev.length >= max) return prev; // cap
      return [...prev, sym];
    });
  };

  return (
    <div style={{marginTop:12}}>
      <div style={{opacity:0.8, marginBottom:8}}>Pick up to {max} coins:</div>
      <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
        {opts.map(sym => {
          const active = sel.includes(sym);
          return (
            <button key={sym}
              onClick={()=>toggle(sym)}
              style={{
                padding:"6px 10px",
                borderRadius:10,
                border:"1px solid rgba(255,255,255,0.2)",
                background: active ? "rgba(255,255,255,0.12)" : "transparent",
                color:"#fff", letterSpacing:0.3
              }}>
              {sym}{active ? " ✓":""}
            </button>
          );
        })}
      </div>
      <div style={{marginTop:8, fontSize:12, opacity:0.7}}>
        Selected: {sel.join(", ") || "—"}
      </div>
    </div>
  );
}
