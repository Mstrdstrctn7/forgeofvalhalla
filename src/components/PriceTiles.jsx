import { useEffect, useState } from "react";

export default function PriceTiles() {
  const [prices, setPrices] = useState({ BTC: null, ETH: null });
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPrices() {
      try {
        const res = await fetch("/.netlify/functions/prices");
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (data?.ok && data?.prices) {
          setPrices(data.prices);
          setError("");
        } else {
          setError("No price data");
        }
      } catch (e) {
        if (mounted) setError("Price fetch failed");
      }
    }

    loadPrices();
    const id = setInterval(loadPrices, 10000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const card = (label, val) => (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: "linear-gradient(135deg, rgba(46,0,60,.55), rgba(30,0,36,.55))",
        border: "1px solid rgba(255,215,0,.25)"
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800 }}>
        {val == null ? "—" : Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>
    </div>
  );

  return (
    <section style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 12
    }}>
      {card("BTC", prices.BTC)}
      {card("ETH", prices.ETH)}
      {error && <div style={{ fontSize: 12, opacity: .7 }}>{error}</div>}
    </section>
  );
}
