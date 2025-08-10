import { useState } from "react";

const MIN_QTY = {
  BTC_USDT: 0.0001, // adjust if exchange requires different step
  ETH_USDT: 0.001,
};

export default function TradeForm({ signedInEmail }) {
  const [instrument, setInstrument] = useState("BTC_USDT");
  const [side, setSide] = useState("BUY");
  const [qty, setQty] = useState("0.001");
  const [msg, setMsg] = useState(null);

  function normalizeQty(q) {
    // Avoid exponents: clamp to 10 decimal places max and return number
    const n = Number(q);
    if (!isFinite(n)) return NaN;
    // toFixed returns string; convert back to number to keep JSON numeric
    return Number(n.toFixed(10));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);

    const n = normalizeQty(qty);
    if (!isFinite(n) || n <= 0) {
      setMsg({ kind: "err", text: "Invalid quantity." });
      return;
    }
    const min = MIN_QTY[instrument] ?? 0;
    if (min && n < min) {
      setMsg({ kind: "err", text: `Quantity too small. Min for ${instrument} is ${min}.` });
      return;
    }

    try {
      const res = await fetch("/.netlify/functions/trade", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-email": signedInEmail || ""
        },
        body: JSON.stringify({
          instrument,
          side,
          quantity: n, // numeric JSON, no exponents
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setMsg({ kind: "ok", text: `✓ ${data.mode} trade submitted`, detail: JSON.stringify(data.order || data.result) });
      } else {
        const detail = typeof data?.detail === "string" ? data.detail : JSON.stringify(data);
        setMsg({ kind: "err", text: `✗ ${data?.error || res.status}`, detail });
      }
    } catch (e) {
      setMsg({ kind: "err", text: "Network error", detail: String(e) });
    }
  }

  const inputStyle = {
    padding: 10, borderRadius: 10,
    border: "1px solid rgba(255,215,0,.25)",
    background: "rgba(10,6,20,.6)", color: "rgb(242,234,227)", outline: "none"
  };

  return (
    <div style={{
      marginTop: 16, padding: 16, borderRadius: 12,
      background: "linear-gradient(135deg, rgba(54,0,51,.7), rgba(30,0,36,.7))",
      border: "1px solid rgba(255,215,0,.25)", color: "rgb(242,234,227)"
    }}>
      <h3 style={{ marginTop: 0, marginBottom: 12, color: "rgb(226,192,68)" }}>Trade (Market)</h3>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Instrument</span>
          <select value={instrument} onChange={e => setInstrument(e.target.value)} style={inputStyle}>
            <option value="BTC_USDT">BTC_USDT</option>
            <option value="ETH_USDT">ETH_USDT</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Side</span>
          <select value={side} onChange={e => setSide(e.target.value)} style={inputStyle}>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Quantity</span>
          <input
            inputMode="decimal"
            placeholder={String(MIN_QTY[instrument] ?? 0.001)}
            value={qty}
            onChange={e => setQty(e.target.value)}
            style={inputStyle}
          />
        </label>

        <button type="submit" style={{
          padding: "12px 16px", borderRadius: 10,
          border: "1px solid rgba(255,215,0,.4)",
          background: "rgb(59,165,93)", color: "white",
          fontWeight: 700, cursor: "pointer"
        }}>
          Place {side}
        </button>
      </form>

      {msg && (
        <div style={{ marginTop: 10, fontSize: 12, opacity: .9, whiteSpace: "pre-wrap" }}>
          {msg.kind === "ok" ? "✅" : "❌"} {msg.text}
          {msg.detail ? ` — ${msg.detail}` : ""}
        </div>
      )}
    </div>
  );
}
