import React, { useState } from "react";
import { supabase } from "../supabaseClient";

export default function TradeTest() {
  const [log, setLog] = useState("Ready.");
  const [symbol, setSymbol] = useState("BTC_USDT");
  const [amount, setAmount] = useState("5");
  const [overrideEmail, setOverrideEmail] = useState("");

  async function callTrade(action, params = {}) {
    try {
      let email = overrideEmail.trim();
      if (!email) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) throw new Error("No logged-in user and no override email");
        email = user.email;
      }
      const res = await fetch("/.netlify/functions/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action, params }),
      });
      const json = await res.json();
      setLog(JSON.stringify(json, null, 2));
      if (json?.ok) alert(`${action} ✓`);
      else if (json?.error) alert(`Error: ${json.error}`);
    } catch (e) {
      setLog("Error: " + e.message);
      alert("Error: " + e.message);
    }
  }

  const buy  = () => callTrade("order", { instrument_name: symbol, side:"BUY",  type:"MARKET", quantity:"0.0001" });
  const sell = () => callTrade("order", { instrument_name: symbol, side:"SELL", type:"MARKET", quantity:"0.0001" });

  return (
    <div style={{ padding: 12, color: "#fff" }}>
      <h3>Trade Test</h3>
      <div style={{ display:"grid", gap:8, maxWidth:360 }}>
        <label> Symbol
          <input value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())} style={{ width:"100%", padding:8, borderRadius:8 }} />
        </label>
        <label> Amount (qty)
          <input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" style={{ width:"100%", padding:8, borderRadius:8 }} />
        </label>
        <label> (Dev) Override Email
          <input value={overrideEmail} onChange={e=>setOverrideEmail(e.target.value)} placeholder="you@example.com"
            style={{ width:"100%", padding:8, borderRadius:8 }} />
        </label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={()=>callTrade("balances")}>Balances</button>
          <button onClick={buy}  style={{ background:"green",  color:"#fff" }}>Buy</button>
          <button onClick={sell} style={{ background:"crimson",color:"#fff" }}>Sell</button>
        </div>
      </div>
      <pre style={{ marginTop: 12, background:"#111", padding:10, borderRadius:8 }}>{log}</pre>
    </div>
  );
}
