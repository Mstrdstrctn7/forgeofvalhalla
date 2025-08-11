import { useEffect, useRef, useState } from "react";

const WS_URL = "wss://stream.crypto.com/v2/market";
const CHANNELS = ["ticker.BTC_USDT","ticker.ETH_USDT"];

export default function useCryptoTicker() {
  const [ticks, setTicks] = useState({});
  const [status, setStatus] = useState("init");
  const wsRef = useRef(null);
  const pollRef = useRef(null);
  const reconnectRef = useRef(1000);

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch("/.netlify/functions/prices-lite?ts=" + Date.now());
        const j = await r.json();
        if (j?.ok && Array.isArray(j.results)) {
          const next = {};
          j.results.forEach(({ name, data }) => {
            if (data) next[name] = { price: Number(data.a || data.k || data.p || 0), ts: Date.now() };
          });
          if (Object.keys(next).length) setTicks(prev => ({ ...prev, ...next }));
          setStatus("polling");
        }
      } catch {}
    }, 5000);
  }
  function stopPolling() { if (pollRef.current) clearInterval(pollRef.current); pollRef.current = null; }

  function connect() {
    try {
      setStatus("connecting");
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("live");
        stopPolling();
        reconnectRef.current = 1000; // reset backoff
        ws.send(JSON.stringify({
          id: Date.now(),
          method: "subscribe",
          params: { channels: CHANNELS }
        }));
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          const arr = msg?.result?.data || msg?.data || [];
          arr.forEach((d) => {
            const ch = d?.i || d?.instrument_name; // channel or instrument
            const name = d?.i || d?.instrument_name || d?.c || "";
            const key = name.includes("BTC_USDT") ? "BTC_USDT"
                      : name.includes("ETH_USDT") ? "ETH_USDT" : null;
            const price = Number(d?.a || d?.k || d?.p || d?.price || 0);
            if (key && price > 0) {
              setTicks(prev => ({ ...prev, [key]: { price, ts: Date.now() } }));
            }
          });
        } catch {}
      };

      ws.onclose = () => {
        setStatus("reconnecting");
        startPolling();
        // exponential backoff up to 30s
        const wait = Math.min(reconnectRef.current, 30000);
        setTimeout(connect, wait);
        reconnectRef.current = Math.min(wait * 2, 30000);
      };

      ws.onerror = () => {
        try { ws.close(); } catch {}
      };
    } catch {
      startPolling();
    }
  }

  useEffect(() => {
    connect();
    return () => {
      try { wsRef.current?.close(); } catch {}
      stopPolling();
    };
  }, []);

  return { ticks, status };
}
