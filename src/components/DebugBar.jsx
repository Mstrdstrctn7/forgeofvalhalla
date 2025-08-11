import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function DebugBar() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ paper:false, allowed:[], coins:[] });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/.netlify/functions/status?ts="+Date.now());
        const j = await r.json();
        if (j?.ok) setStatus({ paper:j.paper, allowed:j.allowed, coins:j.coins });
      } catch {}
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setEmail(user?.email || "");
      } catch {}
    })();
  }, []);

  return (
    <div style={{ padding:"6px 10px", background:"#1b1b1b", color:"#ccc", borderRadius:8 }}>
      <div><b>Mode:</b> {status.paper ? "PAPER" : "LIVE"}</div>
      <div><b>Logged in:</b> {email || "(none)"} </div>
      <div><b>Allowed:</b> {status.allowed.join(", ") || "(not set)"} </div>
      <div><b>Coins:</b> {status.coins.join(", ")} </div>
    </div>
  );
}
