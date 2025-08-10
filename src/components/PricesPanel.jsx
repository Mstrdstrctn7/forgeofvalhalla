// src/components/PricesPanel.jsx
import { useEffect, useState, useRef } from "react";

const FETCH_MS = 3000; // poll every 3s

export default function PricesPanel() {
  const [prices, setPrices] = useState({ BTC: null, ETH: null, ts: null });
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const timerRef = useRef(null);

  const loadOnce = async () => {
    try {
      setStatus((s) => (s === "ok" ? "ok" : "loading"));
      const res = await fetch("/.netlify/functions/get-prices", {
        cache: "no-store",
        headers: { accept: "application/json" }
      });
      const json = await res.json();
      if (json && typeof json.BTC === "number" && typeof json.ETH === "number") {
        setPrices(json);
        setStatus("ok");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    loadOnce(); // first hit promptly
    timerRef.current = setInterval(loadOnce, FETCH_MS);
    return () => clearInterval(timerRef.current);
  }, []);

  const last = prices.ts ? new Date(prices.ts).toLocaleTimeString() : "—";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <Card title="BTC (USD)" value={fmt(prices.BTC)} status={status} />
      <Card title="ETH (USD)" value={fmt(prices.ETH)} status={status} />
      <div style={{ gridColumn: "1 / -1", opacity: 0.7 }}>Last updated: {last}</div>
    </div>
  );
}

function Card({ title, value, status }) {
  const dim = status === "loading" ? 0.6 : 1;
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        minHeight: 140
      }}
    >
      <div style={{ opacity: 0.8, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, letterSpacing: 1, opacity: dim, transition: "opacity .2s" }}>
        {value}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>
        {status === "loading" ? "Updating…" : status === "error" ? "Error fetching" : "Live"}
      </div>
    </div>
  );
}

function fmt(n) {
  if (typeof n !== "number" || !isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  });
}
