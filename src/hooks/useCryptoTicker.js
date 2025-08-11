import { useEffect, useRef, useState } from "react";
import { getSymbols } from "../lib/coins";

const WS_URL = "wss://stream.crypto.com/v2/market";

// Normalize Crypto.com ticker payload into a number price
function pickPrice(d) {
  // fields seen: a=ask, b=bid, k=last_trade_price, p=price
  const candidates = [d?.k, d?.a, d?.p, d?.price, d?.last];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export default function useCryptoTicker(customSymbols) {
  const symbols = (customSymbols && customSymbols.length) ? customSymbols : getSymbols();
  const channels = symbols.map(s => `ticker.${s}`);

  const [ticks, setTicks] = useState({});
  const [status, setStatus] = useState("init");
  const wsRef = useRef(null);
  const pollRef = useRef(null);
  const backoffRef = useRef(1000);

  function stopPolling(){ if (pollRef.current) clearInterval(pollRef.current); pollRef.current=null; }
  function startPolling(){
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const q = encodeURIComponent(symbols.join(","));
        const r = await fetch("/.netlify/functions/prices-lite?symbols="+q+"&ts="+Date.now());
        const j = await r.json();
        if (j?.ok && j.map) {
          setTicks(prev => ({ ...prev, ...j.map }));
          setStatus("polling");
        }
      } catch {}
    }, 5000);
  }

  function connect() {
    try {
      setStatus("connecting");
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("live");
        stopPolling();
        backoffRef.current = 1000;
        ws.send(JSON.stringify({ id: Date.now(), method: "subscribe", params: { channels } }));
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          const arr = msg?.result?.data || msg?.data || [];
          const next = {};
          for (const d of arr) {
            const name = d?.i || d?.instrument_name || d?.c;
            const sym = symbols.find(s => (name || "").includes(s));
            const px = pickPrice(d);
            if (sym && px) next[sym] = { price: px, ts: Date.now() };
          }
          if (Object.keys(next).length) setTicks(prev => ({ ...prev, ...next }));
        } catch {}
      };

      ws.onclose = () => {
        setStatus("reconnecting");
        startPolling();
        const wait = Math.min(backoffRef.current, 30000);
        setTimeout(connect, wait);
        backoffRef.current = Math.min(wait * 2, 30000);
      };
      ws.onerror = () => { try { ws.close(); } catch {} };
    } catch {
      startPolling();
    }
  }

  useEffect(() => {
    connect();
    return () => { try { wsRef.current?.close(); } catch {}; stopPolling(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(",")]);

  return { ticks, status, symbols };
}
