import React from "react";
import useCryptoTicker from "../hooks/useCryptoTicker";
import { getSymbols } from "../lib/coins";

function Cell({ label, value, sub }) {
  return (
    <div style={{ padding: "6px 10px", borderRadius: 10, background: "#1f1f1f" }}>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value ?? "—"}</div>
      {sub ? <div style={{ fontSize: 10, opacity: 0.6 }}>{sub}</div> : null}
    </div>
  );
}

export default function PriceBar({ symbols }) {
  const syms = (symbols && symbols.length) ? symbols : getSymbols();
  const { ticks, status } = useCryptoTicker(syms);

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${syms.length+1}, minmax(0,1fr))`, gap: 8, margin: "8px 0" }}>
      {syms.map(s => {
        const px = ticks[s]?.price;
        return <Cell key={s} label={s.replace("_", "/")} value={px?.toLocaleString(undefined,{maximumFractionDigits:6})} />;
      })}
      <Cell label="Feed" value={status === "live" ? "Live WS" : status} />
    </div>
  );
}
