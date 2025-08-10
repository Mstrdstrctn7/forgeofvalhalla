import { useEffect, useState } from "react";
import TradeForm from "../components/TradeForm.jsx";

export default function Dashboard() {
  const [prices, setPrices] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/.netlify/functions/get-prices", { cache: "no-store" });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || res.statusText);
        if (alive) {
          setPrices(j);
          setErr("");
        }
      } catch (e) {
        if (alive) setErr(e.message || String(e));
      }
    };
    tick();
    const id = setInterval(tick, 3000); // 3s
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 16,
        background:
          "radial-gradient(1000px 600px at 20% -10%, rgba(130,20,170,0.3), transparent), radial-gradient(1000px 600px at 120% 20%, rgba(0,180,90,0.18), transparent), #16051c",
        color: "#F2EAE3",
      }}
    >
      <h1 style={{ marginTop: 0, color: "#E2C044" }}>Forge of Valhalla — Dashboard</h1>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <PriceCard symbol="BTC" value={prices?.BTC} />
        <PriceCard symbol="ETH" value={prices?.ETH} />
      </section>

      {err && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #b44",
            background: "rgba(180,0,0,0.15)",
            borderRadius: 10,
            color: "#ffbcbc",
          }}
        >
          Prices error: {err}
        </div>
      )}

      <TradeForm defaultInstrument="BTC_USDT" />
    </div>
  );
}

function PriceCard({ symbol, value }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background:
          "linear-gradient(135deg, rgba(46,0,60,0.55), rgba(30,0,36,0.55))",
        border: "1px solid rgba(255,215,0,0.25)",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.8 }}>{symbol}</div>
      <div style={{ fontSize: 24, fontWeight: 800 }}>
        {value ? formatUSD(value) : "—"}
      </div>
    </div>
  );
}

function formatUSD(n) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return String(n ?? "—");
  }
}
