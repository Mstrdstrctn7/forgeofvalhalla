// src/pages/Dashboard.jsx
import { useEffect, useRef, useState } from "react";
import useSession from "../hooks/useSession";              // default import ✅
import PricesPanel from "../components/PricesPanel";        // the panel we added

const FN_URL = "/.netlify/functions/get-prices";

// Small hook to poll the Netlify function every `pollMs` ms
function usePrices(pollMs = 3000) {
  const [prices, setPrices] = useState({});
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const timer = useRef(null);
  const abortRef = useRef(null);

  const fetchOnce = async () => {
    try {
      setError("");
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const res = await fetch(FN_URL, {
        signal: ac.signal,
        // make sure we never get a cached response
        headers: {
          "cache-control": "no-cache",
          pragma: "no-cache",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPrices(data);
      setUpdatedAt(new Date());
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(String(e.message || e));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // first hit immediately
    fetchOnce();

    // then poll
    timer.current = setInterval(fetchOnce, pollMs);

    // optional: pause when tab/app is hidden to save calls
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        clearInterval(timer.current);
      } else {
        fetchOnce();
        timer.current = setInterval(fetchOnce, pollMs);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(timer.current);
      document.removeEventListener("visibilitychange", onVis);
      abortRef.current?.abort();
    };
  }, [pollMs]);

  return { prices, updatedAt, loading, error };
}

export default function Dashboard() {
  const { session } = useSession(); // will be null if signed out
  const { prices, updatedAt, loading, error } = usePrices(3000);

  return (
    <div style={{ padding: 24, color: "#fff" }}>
      <h1>Dashboard</h1>

      <p>
        Welcome, <b>{session?.user?.email ?? "guest"}</b>!
      </p>
      <p>
        This page is protected. If you sign out, you’ll be redirected to Login.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        <PricesPanel symbol="BTC" price={prices.BTC} loading={loading} error={error} />
        <PricesPanel symbol="ETH" price={prices.ETH} loading={loading} error={error} />
      </div>

      <p style={{ opacity: 0.8, marginTop: 16 }}>
        Last updated: {updatedAt ? updatedAt.toLocaleTimeString() : "—"}
      </p>
    </div>
  );
}
