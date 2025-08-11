import DebugBar from "../components/DebugBar";
import TradeTest from "../components/TradeTest";
import PriceBar from "../components/PriceBar";
import LogoutButton from "../components/LogoutButton";
import { getSymbols } from "../lib/coins";
const SYMS = getSymbols();
import React from "react";
import PricesBoard from "../components/PricesBoard";
// If you also have a <PriceBar />

// Trade form component, keep/import it here:
let TradeForm;
try { TradeForm = (await import("../components/TradeForm.jsx")).default; } catch {}

export default function Dashboard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 16,
        background:
          "radial-gradient(1000px 600px at 20% -10%, rgba(130, 20, 170, 0.3), transparent), radial-gradient(1000px 600px at 120% 20%, rgba(0, 180, 90, 0.18), transparent), rgb(22, 5, 28)",
        color: "rgb(242,234,227)",
      }}
    >
      <h1 style={{ marginTop: 0, color: "rgb(226,192,68)" }}> <span style={{float:"right"}}><LogoutButton /></span>
        Forge of Valhalla — Dashboard
      </h1>
      <PricesBoard />
      {TradeForm ? <TradeForm /> : null}
      <TradeTest />
</div>
  );
}
