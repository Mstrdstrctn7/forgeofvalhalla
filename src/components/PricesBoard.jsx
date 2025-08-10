import React, { useEffect, useState } from "react";

export default function PricesBoard() {
  const [list, setList] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    try {
      const r = await fetch(`/.netlify/functions/prices?t=${Date.now()}`);
      const j = await r.json();
      if (j?.ok && Array.isArray(j.prices)) {
        setList(j.prices);
        setErr("");
      } else {
        setErr("No price data");
      }
    } catch (e) {
      setErr("Price fetch failed");
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5000); // 5s refresh
    return () => clearInterval(id);
  }, []);

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12
      }}
    >
      {list.map(({ symbol, price }) => (
        <div
          key={symbol}
          style={{
            padding: 14,
            borderRadius: 12,
            background:
              "linear-gradient(135deg, rgba(46,0,60,.55), rgba(30,0,36,.55))",
            border: "1px solid rgba(255,215,0,.25)",
            color: "rgb(242,234,227)"
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.8 }}>{symbol.replace("_", "/")}</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            {price == null
              ? "—"
              : Number(price).toLocaleString(undefined, { maximumFractionDigits: 6 })}
          </div>
        </div>
      ))}
      {!list.length && (
        <div style={{ fontSize: 12, opacity: 0.8 }}>{err || "Loading…"}</div>
      )}
    </section>
  );
}
