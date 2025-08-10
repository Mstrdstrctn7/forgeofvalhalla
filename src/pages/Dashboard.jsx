import { useEffect, useState, lazy, Suspense } from "react";
import useSession from "../hooks/useSession";

const PricesPanel = lazy(() => import("../components/PricesPanel"));

const POLL_MS = 3000; // main=3s, fast-poll branch can change to 1500

export default function Dashboard() {
  const { session } = useSession();
  const [prices, setPrices] = useState({});
  const [lastAt, setLastAt] = useState(null);

  useEffect(() => {
    let timer = null;
    let alive = true;

    const hit = async () => {
      try {
        const res = await fetch("/.netlify/functions/get-prices", {
          headers: { "cache-control": "no-cache" }
        });
        const data = await res.json();
        if (!alive) return;
        setPrices({ BTC: data.BTC, ETH: data.ETH, source: data.source });
        setLastAt(new Date());
      } catch {
        // swallow; next tick will retry
      }
    };

    hit(); // immediate
    timer = setInterval(hit, POLL_MS);

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  if (!session) {
    return <div style={{ color: "#fff", padding: 24 }}>Redirecting to login…</div>;
  }

  const variant = import.meta.env.VITE_VARIANT ?? "unknown";
  const freshnessMs = lastAt ? Date.now() - lastAt.getTime() : Infinity;
  const fresh = freshnessMs < 4000; // 4s threshold
  const dotStyle = {
    display: "inline-block",
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: fresh ? "#2ecc71" : "#f1c40f",
    boxShadow: "0 0 8px rgba(0,0,0,.35)",
    marginRight: 8,
    verticalAlign: "middle"
  };

  return (
    <div style={{ color: "#fff", padding: 24 }}>
      <h1>Dashboard</h1>
      <p style={{ opacity: 0.7, marginTop: -8 }}>
        Variant: <b>{variant}</b>
      </p>

      <p style={{ marginTop: 16 }}>
        Welcome, <b>{session.user?.email}</b>!
      </p>

      <div style={{ marginTop: 8 }}>
        <span style={dotStyle} aria-label={fresh ? "fresh" : "stale"} />
        <span style={{ opacity: 0.8 }}>
          Last updated: {lastAt ? lastAt.toLocaleTimeString() : "—"}
          {prices?.source ? ` • source: ${prices.source}` : ""}
        </span>
      </div>

      <div style={{ marginTop: 24 }}>
        <Suspense fallback={<div style={{ opacity: 0.6 }}>Loading prices…</div>}>
          <PricesPanel prices={prices} />
        </Suspense>
      </div>
    </div>
  );
}
