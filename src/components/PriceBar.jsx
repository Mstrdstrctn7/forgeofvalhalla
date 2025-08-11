import React, { useEffect, useRef, useState } from "react";

export default function PriceBar() {
  const [coins, setCoins] = useState(["BTC_USDT","ETH_USDT"]);
  const [ticks, setTicks] = useState({});
  const [feed, setFeed] = useState("init");
  const wsRef = useRef(null);
  const pollRef = useRef(null);

  // Load coins at runtime
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/.netlify/functions/status?ts="+Date.now());
        const j = await r.json();
        if (j?.ok && Array.isArray(j.coins) && j.coins.length) setCoins(j.coins);
      } catch {}
    })();
  }, []);

  function stopPoll(){ if (pollRef.current) clearInterval(pollRef.current); pollRef.current=null; }
  function startPoll(cs){
    stopPoll();
    pollRef.current = setInterval(async () => {
      try{
        const q = encodeURIComponent(cs.join(","));
        const r = await fetch("/.netlify/functions/prices-lite?symbols="+q+"&ts="+Date.now());
        const j = await r.json();
        if (j?.ok && j.map) { setTicks(prev=>({ ...prev, ...j.map })); setFeed("polling"); }
      }catch{}
    }, 5000);
  }

  // WS live + polling fallback
  useEffect(() => {
    const cs = coins.slice();
    if (!cs.length) return;
    try {
      setFeed("connecting");
      const ws = new WebSocket("wss://stream.crypto.com/v2/market");
      wsRef.current = ws;
      ws.onopen = () => {
        setFeed("live");
        stopPoll();
        ws.send(JSON.stringify({ id:Date.now(), method:"subscribe", params:{ channels: cs.map(s=>"ticker."+s) } }));
      };
      ws.onmessage = (ev) => {
        try{
          const msg = JSON.parse(ev.data);
          const arr = msg?.result?.data || [];
          const next = {};
          for (const d of arr) {
            const name = (d?.i || d?.instrument_name || "");
            const sym = cs.find(s => name.includes(s));
            const px = Number(d?.k || d?.a || d?.p || d?.price || 0);
            if (sym && px>0) next[sym] = { price: px, ts: Date.now() };
          }
          if (Object.keys(next).length) setTicks(prev=>({ ...prev, ...next }));
        }catch{}
      };
      ws.onclose = () => { setFeed("reconnecting"); startPoll(cs); };
      ws.onerror = () => { try{ws.close();}catch{} };
      return () => { try{ws.close();}catch{}; stopPoll(); };
    } catch {
      startPoll(cs);
    }
  }, [coins.join(",")]);

  return (
    <div style={{ display:"grid", gridTemplateColumns:`repeat(${coins.length+1},minmax(0,1fr))`, gap:8, margin:"8px 0" }}>
      {coins.map(s=>{
        const px = ticks[s]?.price;
        return (
          <div key={s} style={{ padding:"6px 10px", borderRadius:10, background:"#1f1f1f" }}>
            <div style={{ fontSize:12, opacity:0.75 }}>{s.replace("_","/")}</div>
            <div style={{ fontSize:18, fontWeight:700 }}>{px? px.toLocaleString(undefined,{ maximumFractionDigits:6 }) : "—"}</div>
          </div>
        );
      })}
      <div style={{ padding:"6px 10px", borderRadius:10, background:"#1f1f1f" }}>
        <div style={{ fontSize:12, opacity:0.75 }}>Feed</div>
        <div style={{ fontSize:18, fontWeight:700 }}>{feed}</div>
      </div>
    </div>
  );
}
