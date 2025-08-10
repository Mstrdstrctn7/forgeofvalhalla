import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

/**
 * Simple market-order form.
 * - Reads Supabase user email for x-user-email header.
 * - Posts to /.netlify/functions/trade
 * - Shows JSON result or error.
 */
export default function TradeForm({ defaultInstrument = "BTC_USDT" }) {
  const [instrument, setInstrument] = useState(defaultInstrument);
  const [side, setSide] = useState("BUY");
  const [qty, setQty] = useState("0.001");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Resolve current user email
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setEmail(data?.user?.email || "");
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setEmail(session?.user?.email || "");
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const canSubmit = useMemo(() => {
    return email && instrument && side && Number(qty) > 0 && !busy;
  }, [email, instrument, side, qty, busy]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!email) {
      setMsg("You must be signed in (no email).");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/.netlify/functions/trade", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-email": email.toLowerCase(),
        },
        body: JSON.stringify({
          instrument,
          side,
          quantity: Number(qty),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(`❌ ${res.status} ${res.statusText} → ${json?.error || "unknown"} ${json?.detail ? " — " + JSON.stringify(json.detail) : ""}`);
      } else {
        setMsg(`✅ ${json?.mode?.toUpperCase?.() || "OK"} → ${JSON.stringify(json)}`);
      }
    } catch (err) {
      setMsg(`❗ Network error: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        background:
          "linear-gradient(135deg, rgba(54,0,51,0.7), rgba(30,0,36,0.7))",
        border: "1px solid rgba(255,215,0,0.25)",
        color: "#F2EAE3",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 12, color: "#E2C044" }}>
        Trade (Market)
      </h3>

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Instrument</span>
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            style={sel}
          >
            <option value="BTC_USDT">BTC_USDT</option>
            <option value="ETH_USDT">ETH_USDT</option>
            {/* add more pairs here later */}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Side</span>
          <select value={side} onChange={(e) => setSide(e.target.value)} style={sel}>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Quantity</span>
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            inputMode="decimal"
            style={inp}
            placeholder="0.001"
          />
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,215,0,0.4)",
            background: canSubmit ? "#3BA55D" : "#334",
            color: "white",
            fontWeight: 700,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {busy ? "Placing…" : `Place ${side}`}
        </button>
      </form>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
        Signed in as: <b>{email || "(not signed in)"}</b>
      </div>

      {msg && (
        <pre
          style={{
            marginTop: 12,
            padding: 12,
            background: "rgba(0,0,0,0.35)",
            borderRadius: 8,
            border: "1px solid rgba(0,0,0,0.2)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
{msg}
        </pre>
      )}
    </div>
  );
}

const inp = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid rgba(255,215,0,0.25)",
  background: "rgba(10,6,20,0.6)",
  color: "#F2EAE3",
  outline: "none",
};

const sel = { ...inp, appearance: "none" };
