// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import useSession from "../hooks/useSession"; // ← default import
// (No need to import supabase here)

export default function Dashboard() {
  const { session } = useSession();

  const [prices, setPrices] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const REFRESH_MS = 3000; // 3 seconds

  async function fetchPrices() {
    try {
      const res = await fetch("/.netlify/functions/get-prices", {
        // make sure the browser doesn’t cache the response
        cache: "no-store",
        headers: { "Cache-Control": "no-store" },
      });
      const data = await res.json();
      setPrices(data || {});
      setLastUpdated(new Date());
    } catch (e) {
      console.error("price fetch failed:", e);
    }
  }

  useEffect(() => {
    fetchPrices(); // initial
    const id = setInterval(fetchPrices, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ color: "#fff", padding: 24 }}>
      <h2>Dashboard</h2>
      <p>
        Welcome, <b>{session?.user?.email}</b>!
      </p>
      <p>This page is protected. If you sign out, you’ll be redirected to Login.</p>

      <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
        <Card title="BTC (USD)" value={prices.BTC} />
        <Card title="ETH (USD)" value={prices.ETH} />
      </div>

      <p style={{ opacity: 0.7, marginTop: 12 }}>
        {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : "Loading prices…"}
      </p>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{
      background: "#1f1f1f",
      borderRadius: 12,
      padding: 16,
      minWidth: 160,
      textAlign: "center",
      boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
    }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{title}</div>
      <div style={{ fontSize: 24, marginTop: 6 }}>
        {value !== undefined ? `$${Number(value).toLocaleString()}` : "—"}
      </div>
    </div>
  );
}
