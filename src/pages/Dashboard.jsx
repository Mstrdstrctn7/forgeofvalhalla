import { useEffect, useState } from "react";
import { useSession } from "../hooks/useSession";

export default function Dashboard() {
  const { session } = useSession();
  const [prices, setPrices] = useState({});
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    const fetchPrices = async () => {
      try {
        // add a timestamp to bust any caches and request with no-store
        const res = await fetch(
          `/.netlify/functions/get-prices?t=${Date.now()}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (alive) {
          setPrices(data);
          setErr(null);
        }
      } catch (e) {
        if (alive) setErr(e.message || String(e));
      }
    };

    // initial + poll every 3s
    fetchPrices();
    const id = setInterval(fetchPrices, 3000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div style={{ padding: 24, color: "#fff" }}>
      <h1>Dashboard</h1>
      <p>Welcome, {session?.user?.email}!</p>

      <h3 style={{ marginTop: 24 }}>Live Prices</h3>
      {err && <p style={{ color: "tomato" }}>Error: {err}</p>}

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <div style={{ padding: 12, background: "#222", borderRadius: 8 }}>
          <div>BTC</div>
          <div style={{ fontSize: 24 }}>
            {prices.BTC != null ? `$${prices.BTC}` : "…"}
          </div>
        </div>
        <div style={{ padding: 12, background: "#222", borderRadius: 8 }}>
          <div>ETH</div>
          <div style={{ fontSize: 24 }}>
            {prices.ETH != null ? `$${prices.ETH}` : "…"}
          </div>
        </div>
      </div>
      <p style={{ opacity: 0.6, marginTop: 8 }}>Refresh: every ~3 seconds</p>
    </div>
  );
}
