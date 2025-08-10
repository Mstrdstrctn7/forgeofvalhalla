import { useEffect, useRef, useState } from "react";

/**
 * PricesStream
 * - Polls /.netlify/functions/get-prices
 * - Adaptive polling: base 3000ms; 1500ms when ≥2 feeds OK & no errors; 5000ms on trouble
 * - Renders a tiny meta badge with feed status + elapsed_ms
 */
export default function PricesStream() {
  const [data, setData] = useState(null);
  const [nextMs, setNextMs] = useState(3000);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  // helpers
  const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
  const feeds = data?.meta?.feeds ?? [];
  const okFeeds = feeds.filter(f => safeNum(f.BTC) || safeNum(f.ETH)).length;
  const errFeeds = feeds.filter(f => !!f.err).length;

  const decideNextDelay = (payload) => {
    // Defaults
    let ms = 3000;

    const meta = payload?.meta || {};
    const feedsArr = meta.feeds || [];
    const ok = feedsArr.filter(f => safeNum(f.BTC) || safeNum(f.ETH)).length;
    const errs = feedsArr.filter(f => !!f.err).length;

    // If we have at least 2 healthy feeds and zero errors, tighten to 1.5s
    if (ok >= 2 && errs === 0) ms = 1500;

    // If we have many errors or zero healthy feeds, back off
    if (ok === 0 || errs >= 2) ms = 5000;

    return ms;
  };

  const schedule = (ms) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fetchOnce, ms);
    setNextMs(ms);
  };

  const fetchOnce = async () => {
    try {
      const res = await fetch("/.netlify/functions/get-prices", {
        cache: "no-store",
        headers: { "pragma": "no-cache", "cache-control": "no-cache" },
      });
      const json = await res.json();
      if (!mountedRef.current) return;
      setData(json);
      schedule(decideNextDelay(json));
    } catch (_e) {
      // Network error -> back off a bit
      if (!mountedRef.current) return;
      schedule(5000);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchOnce();
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // UI bits
  const card = (label, val) => (
    <div style={cardStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={priceStyle}>{val ?? "—"}</div>
    </div>
  );

  const fmtUSD = (n) =>
    Number.isFinite(Number(n)) ? Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

  const cg = feeds.find(f => f.src === "coingecko");
  const bn = feeds.find(f => f.src === "binance");
  const bs = feeds.find(f => f.src === "bitstamp");

  const pill = (name, f) => {
    const ok = !!(safeNum(f?.BTC) || safeNum(f?.ETH));
    const hint = f?.err ? ` (${f.err})` : "";
    return (
      <span style={{...pillStyle, background: ok ? "rgba(0,200,0,.15)" : "rgba(255,0,0,.12)", borderColor: ok ? "rgba(0,200,0,.5)" : "rgba(255,0,0,.4)"}}>
        {name}{ok ? " ✓" : " ·"}{f?.err ? hint : ""}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
        {card("BTC (USD)", data?.BTC != null ? `$${fmtUSD(data.BTC)}` : null)}
        {card("ETH (USD)", data?.ETH != null ? `$${fmtUSD(data.ETH)}` : null)}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
        <span style={{ marginRight: 8 }}>feeds:</span>
        {pill("CG", cg)} {pill("BS", bs)} {pill("BN", bn)}
        <span style={{ marginLeft: 8, opacity: 0.8 }}>
          · {okFeeds} OK / {errFeeds} ERR · {data?.meta?.elapsed_ms ?? "—"} ms
        </span>
        <span style={{ float: "right", opacity: 0.7 }}>
          next {Math.round(nextMs)}ms
        </span>
      </div>
    </div>
  );
}

// styles
const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: 16,
};
const labelStyle = { fontSize: 12, letterSpacing: 0.4, opacity: 0.8, marginBottom: 6 };
const priceStyle = { fontSize: 28, fontWeight: 700 };

const pillStyle = {
  display: "inline-block",
  border: "1px solid transparent",
  padding: "2px 8px",
  borderRadius: 999,
  marginRight: 6,
  fontSize: 11,
};

