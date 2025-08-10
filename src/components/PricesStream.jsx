/**
 * PricesStream — ultra-responsive 3-source WebSocket feed with tiny-move sensitivity.
 * Sources: Binance (USDT), Kraken (USD), Bitstamp (USD).
 * Strategy: median-of-3, outlier clamp at 0.2% from median.
 * Rendering: batches setState in requestAnimationFrame to avoid jank.
 */
import { useEffect, useRef, useState } from "react";

const TOLERANCE = 0.002; // 0.2% from median
const SHOW_DECIMALS = { BTC: 2, ETH: 2 }; // show cents so tiny moves appear

function fmt(sym, x) {
  if (x == null) return "—";
  return Number(x).toLocaleString(undefined, {
    minimumFractionDigits: SHOW_DECIMALS[sym] ?? 2,
    maximumFractionDigits: SHOW_DECIMALS[sym] ?? 2,
  });
}

export default function PricesStream() {
  const [prices, setPrices] = useState({ BTC: null, ETH: null, src: "—", ts: 0 });
  const latestRef = useRef({ BTC: null, ETH: null, src: "—", ts: 0 });
  const rafRef = useRef(0);

  // helpers
  const commit = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setPrices({ ...latestRef.current });
    });
  };

  const accept = (next) => {
    latestRef.current = next;
    commit();
  };

  useEffect(() => {
    let closed = false;

    // Per-source normalizers -> { BTC, ETH, src, ts }
    // 1) Binance (USDT ~ USD), stream miniTicker
    const wsBinance = new WebSocket("wss://stream.binance.com:9443/ws/!miniTicker@arr");
    wsBinance.onmessage = (ev) => {
      if (closed) return;
      try {
        const arr = JSON.parse(ev.data);
        // find BTCUSDT & ETHUSDT
        let btc, eth;
        for (const t of arr) {
          if (t.s === "BTCUSDT") btc = parseFloat(t.c);
          if (t.s === "ETHUSDT") eth = parseFloat(t.c);
        }
        if (btc || eth) mergeTick({ BTC: btc, ETH: eth, src: "binance", ts: Date.now() });
      } catch {}
    };

    // 2) Kraken (USD)
    const wsKraken = new WebSocket("wss://ws.kraken.com/");
    wsKraken.onopen = () => {
      wsKraken.send(JSON.stringify({
        event: "subscribe",
        pair: ["XBT/USD", "ETH/USD"],
        subscription: { name: "ticker" }
      }));
    };
    wsKraken.onmessage = (ev) => {
      if (closed) return;
      try {
        const msg = JSON.parse(ev.data);
        if (!Array.isArray(msg) || !msg[1] || !msg[1].c) return;
        const pair = msg[3]; // "XBT/USD" or "ETH/USD"
        const last = parseFloat(msg[1].c[0]);
        if (!isFinite(last)) return;
        if (pair === "XBT/USD") mergeTick({ BTC: last, src: "kraken", ts: Date.now() });
        if (pair === "ETH/USD") mergeTick({ ETH: last, src: "kraken", ts: Date.now() });
      } catch {}
    };

    // 3) Bitstamp (USD) — ticker channels
    const wsBitstamp = new WebSocket("wss://ws.bitstamp.net");
    wsBitstamp.onopen = () => {
      wsBitstamp.send(JSON.stringify({ event: "bts:subscribe", data: { channel: "ticker_btcusd" } }));
      wsBitstamp.send(JSON.stringify({ event: "bts:subscribe", data: { channel: "ticker_ethusd" } }));
    };
    wsBitstamp.onmessage = (ev) => {
      if (closed) return;
      try {
        const msg = JSON.parse(ev.data);
        if (msg.event !== "ticker") return;
        const p = parseFloat(msg.data?.last);
        if (!isFinite(p)) return;
        if (msg.channel === "ticker_btcusd") mergeTick({ BTC: p, src: "bitstamp", ts: Date.now() });
        if (msg.channel === "ticker_ethusd") mergeTick({ ETH: p, src: "bitstamp", ts: Date.now() });
      } catch {}
    };

    // aggregator state: keep latest from each source
    const lastBySrc = {
      binance: { BTC: null, ETH: null },
      kraken: { BTC: null, ETH: null },
      bitstamp: { BTC: null, ETH: null },
    };

    function median(values) {
      const v = values.filter((x) => typeof x === "number" && isFinite(x)).sort((a, b) => a - b);
      const n = v.length;
      if (!n) return null;
      if (n % 2 === 1) return v[(n - 1) / 2];
      return (v[n / 2 - 1] + v[n / 2]) / 2;
    }

    function clampOutliers(sym, candidates) {
      const m = median(candidates);
      if (m == null) return null;
      // reject values > 0.2% away from median
      const keep = candidates.filter((v) => Math.abs(v - m) / m <= TOLERANCE);
      return median(keep.length ? keep : candidates); // fallback to raw median if all clamped
    }

    function mergeTick(partial) {
      // record the source’s new value(s)
      const src = partial.src;
      if (src && lastBySrc[src]) {
        if (partial.BTC != null) lastBySrc[src].BTC = partial.BTC;
        if (partial.ETH != null) lastBySrc[src].ETH = partial.ETH;
      }

      // build candidate sets
      const btcCandidates = [lastBySrc.binance.BTC, lastBySrc.kraken.BTC, lastBySrc.bitstamp.BTC];
      const ethCandidates = [lastBySrc.binance.ETH, lastBySrc.kraken.ETH, lastBySrc.bitstamp.ETH];

      const nextBTC = clampOutliers("BTC", btcCandidates);
      const nextETH = clampOutliers("ETH", ethCandidates);

      // Only update changed fields; no debounce—every tick is eligible
      const prev = latestRef.current;
      const next = {
        BTC: nextBTC ?? prev.BTC,
        ETH: nextETH ?? prev.ETH,
        src: src ?? prev.src,
        ts: partial.ts ?? Date.now(),
      };

      // If any value changed, commit in rAF
      if (next.BTC !== prev.BTC || next.ETH !== prev.ETH) {
        accept(next);
      }
    }

    return () => {
      closed = true;
      try { wsBinance.close(); } catch {}
      try { wsKraken.close(); } catch {}
      try { wsBitstamp.close(); } catch {}
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={cardStyle}>
        <div style={labelStyle}>BTC (USD)</div>
        <div style={priceStyle}>{fmt("BTC", prices.BTC)}</div>
      </div>
      <div style={cardStyle}>
        <div style={labelStyle}>ETH (USD)</div>
        <div style={priceStyle}>{fmt("ETH", prices.ETH)}</div>
      </div>
      <div style={{ gridColumn: "1 / -1", opacity: 0.65, fontSize: 12 }}>
        Last tick: {prices.ts ? new Date(prices.ts).toLocaleTimeString() : "—"} via {prices.src}
      </div>
    </div>
  );
}

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  padding: 16,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
};
const labelStyle = { fontSize: 12, letterSpacing: 0.4, marginBottom: 6, opacity: 0.8 };
const priceStyle = { fontSize: 28, fontWeight: 700 };
