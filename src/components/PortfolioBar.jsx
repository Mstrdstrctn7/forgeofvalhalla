import React, { useEffect, useMemo, useState } from "react";

/**
 * Minimal portfolio bar that reads/writes localStorage ("fov_portfolio").
 * Entry shape per symbol: { qty: number, avg: number }
 * Props:
 *   symbol: "BTC/USD" (UI form)
 *   price:  number (last price)
 */
export default function PortfolioBar({ symbol, price }) {
  const key = "fov_portfolio";
  const store = () => {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); }
    catch { return {}; }
  };
  const [data, setData] = useState(store());

  useEffect(() => {
    const onStorage = () => setData(store());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const coinKey = symbol.replace("/", "_"); // "BTC_USD"
  const entry = data[coinKey] || { qty: 0, avg: 0 };
  const value = (entry.qty || 0) * (price || 0);
  const pnl = value - (entry.qty || 0) * (entry.avg || 0);

  function quickSet(qty, avg){
    const next = { ...store(), [coinKey]: { qty, avg } };
    localStorage.setItem(key, JSON.stringify(next));
    setData(next);
  }

  return (
    <div className="fov-portfolio">
      <div className="port-row">
        <div className="port-main">
          <div className="port-title">Holdings</div>
          <div className="port-sub">{symbol}</div>
        </div>
        <div className="port-stats">
          <div className="port-price">
            <span className="muted">Last:</span> {price ? price.toLocaleString() : "—"}
          </div>
          <div className="port-qty">
            <span className="muted">Qty:</span> {entry.qty ?? 0}
          </div>
          <div className="port-value">
            <span className="muted">Value:</span> {value ? value.toLocaleString() : 0}
          </div>
          <div className={`port-pnl ${pnl>=0 ? "up":"down"}`}>
            P/L: {pnl ? pnl.toFixed(2) : "0.00"}
          </div>
        </div>
      </div>

      <div className="port-quick">
        <button className="btn mini" onClick={() => quickSet(0,0)}>Clear</button>
        <button className="btn mini" onClick={() => {
          const q = Number(prompt("Set quantity:", entry.qty ?? 0));
          const a = Number(prompt("Set average cost:", entry.avg ?? 0));
          if (!Number.isNaN(q) && !Number.isNaN(a)) quickSet(q, a);
        }}>Edit</button>
        <span className="muted tip">Tip: long-press Edit to update later.</span>
      </div>
    </div>
  );
}
