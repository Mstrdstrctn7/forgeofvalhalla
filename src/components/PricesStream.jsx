// src/components/PricesStream.jsx
// Realtime prices via Binance WebSocket (miniTicker) with HTTP fallback.
// - Primary: WS: wss://stream.binance.com (BTC/ETH miniTicker)
// - Fallback: HTTP GET /.netlify/functions/get-prices every VITE_POLL_MS (default 3000)
// - Exponential backoff on WS reconnect (1s, 2s, 4s... cap 30s)

import { useEffect, useRef, useState } from "react";

const WS_URL =
  'wss://stream.binance.com:9443/stream?streams=btcusdt@miniTicker/ethusdt@miniTicker';

const DEFAULT_POLL_MS = Number(import.meta.env.VITE_POLL_MS || 3000);

export default function PricesStream() {
  const [prices, setPrices] = useState({ BTC: null, ETH: null, source: null, t: null });
  const [status, setStatus] = useState("idle"); // idle | ws | http | error
  const [lastAt, setLastAt] = useState(null);

  const wsRef = useRef(null);
  const reconnectRef = useRef(0);
  const httpTimerRef = useRef(null);

  const setFresh = (p) => {
    setPrices(p);
    setLastAt(new Date());
  };

  // ---- HTTP fallback (no-cache) ----
  const startHttpPoll = (ms = DEFAULT_POLL_MS) => {
    clearInterval(httpTimerRef.current);
    setStatus("http");
    const hit = async () => {
      try {
        const r = await fetch("/.netlify/functions/get-prices", {
          cache: "no-store",
          headers: { "cache-control": "no-cache" },
        });
        const j = await r.json();
        setFresh({ BTC: j.BTC ?? null, ETH: j.ETH ?? null, source: j.source ?? "http", t: j.t ?? Date.now() });
      } catch {
        // swallow; next tick will try again
      }
    };
    hit();
    httpTimerRef.current = setInterval(hit, ms);
  };

  // ---- WebSocket primary ----
  useEffect(() => {
    let closed = false;

    const connect = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (closed) return;
          setStatus("ws");
          reconnectRef.current = 0; // reset backoff
        };

        ws.onmessage = (evt) => {
          if (closed) return;
          try {
            const msg = JSON.parse(evt.data);
            const stream = msg?.stream || "";
            const c = Number(msg?.data?.c); // last price
            if (!Number.isFinite(c)) return;

            if (stream.startsWith("btcusdt@")) {
              setFresh((prev) => ({ BTC: c, ETH: prev?.ETH ?? null, source: "ws", t: Date.now() }));
            } else if (stream.startsWith("ethusdt@")) {
              setFresh((prev) => ({ BTC: prev?.BTC ?? null, ETH: c, source: "ws", t: Date.now() }));
            }
          } catch {}
        };

        ws.onerror = () => { ws.close(); };

        ws.onclose = () => {
          if (closed) return;
          const n = Math.min(30000, 1000 * Math.pow(2, reconnectRef.current++)); // cap 30s
          startHttpPoll(DEFAULT_POLL_MS);
          setStatus("http"); // fallback active
          setTimeout(() => { if (!closed) connect(); }, n);
        };
      } catch {
        startHttpPoll(DEFAULT_POLL_MS);
      }
    };

    connect(); // try WS first

    return () => {
      closed = true;
      try { wsRef.current?.close(); } catch {}
      clearInterval(httpTimerRef.current);
    };
  }, []);

  const fmt = (n) =>
    typeof n === "number" && Number.isFinite(n)
      ? n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 })
      : "—";

  const freshnessMs = lastAt ? Date.now() - lastAt.getTime() : Infinity;
  const fresh = freshnessMs < 4000;
  const dotStyle = {
    display: "inline-block",
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: fresh ? "#2ecc71" : "#f1c40f",
    boxShadow: "0 0 8px rgba(0,0,0,.35)",
    marginRight: 8,
    verticalAlign: "middle",
  };

  return (
    <div>
      <div style={{ marginBottom: 8, opacity: 0.8 }}>
        <span style={dotStyle} aria-label={fresh ? "fresh" : "stale"} />
        <span>
          Source: <b>{status}</b>
          {prices?.source && status !== "ws" ? ` (${prices.source})` : ""}
          {" • "}
          Last: {lastAt ? lastAt.toLocaleTimeString() : "—"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="BTC (USD)" value={fmt(prices.BTC)} />
        <Card title="ETH (USD)" value={fmt(prices.ETH)} />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        minHeight: 120,
      }}
    >
      <div style={{ opacity: 0.8, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, letterSpacing: 1 }}>{value}</div>
    </div>
  );
}
