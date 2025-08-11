import React from "react";
import useCryptoTicker from "../hooks/useCryptoTicker";

function Cell({ label, value, sub }) {
  return (
    <div style={{ padding: "6px 10px", borderRadius: 10, background: "#1f1f1f" }}>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value ?? "—"}</div>
      {sub ? <div style={{ fontSize: 10, opacity: 0.6 }}>{sub}</div> : null}
    </div>
  );
}

export default function PriceBar() {
  const { ticks, status } = useCryptoTicker();
  const btc = ticks["BTC_USDT"]?.price;
  const eth = ticks["ETH_USDT"]?.price;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, margin: "8px 0" }}>
      <Cell label="BTC/USDT" value={btc?.toLocaleString(undefined,{maximumFractionDigits:2})} />
      <Cell label="ETH/USDT" value={eth?.toLocaleString(undefined,{maximumFractionDigits:2})} />
      <Cell label="Feed" value={status === "live" ? "Live WS" : status} />
    </div>
  );
}
