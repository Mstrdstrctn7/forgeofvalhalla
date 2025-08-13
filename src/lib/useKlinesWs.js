import { useEffect, useRef } from "react";

/** Map "BTC/USD" => "btcusdt" for Binance stream. */
function toBinance(sym){
  const [base, quote] = sym.split("/");
  // Treat USD as USDT for streaming (most pairs are quoted in USDT)
  const q = (quote || "USD").toUpperCase() === "USD" ? "USDT" : quote.toUpperCase();
  return (base + q).toLowerCase();
}

/** Map our TF keys to Binance intervals. */
function toInterval(tf){
  switch(tf){
    case "1m": return "1m";
    case "3m": return "3m";
    case "5m": return "5m";
    case "30m": return "30m";
    case "1h": return "1h";
    case "1d": return "1d";
    default: return "1m";
  }
}

/**
 * WebSocket live klines from Binance. Calls onKline({t,o,h,l,c,v,isFinal})
 * and onPrice(last) for every tick. Gracefully reconnects.
 */
export function useKlinesWs({ pair="BTC/USD", tf="1m", onKline, onPrice, enabled=true }){
  const wsRef = useRef(null);
  const alive = useRef(false);
  const retry = useRef(1000);

  useEffect(() => {
    if (!enabled) return;
    alive.current = true;

    const symbol = toBinance(pair);
    const interval = toInterval(tf);
    const url = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;

    function open(){
      if (!alive.current) return;
      try {
        wsRef.current = new WebSocket(url);
      } catch(e) {
        scheduleReconnect();
        return;
      }

      wsRef.current.onopen = () => { retry.current = 1000; };

      wsRef.current.onmessage = (ev) => {
        try{
          const msg = JSON.parse(ev.data);
          const k = msg.k; // kline payload
          if (!k) return;
          const t = k.t; // open time (ms)
          const kl = {
            t,
            o: +k.o, h: +k.h, l: +k.l, c: +k.c, v: +k.v,
            isFinal: !!k.x
          };
          onKline?.(kl);
          onPrice?.(kl.c);
        }catch(_){}
      };

      wsRef.current.onclose = scheduleReconnect;
      wsRef.current.onerror = scheduleReconnect;
    }

    function scheduleReconnect(){
      if (!alive.current) return;
      try { wsRef.current && wsRef.current.close(); } catch(_){}
      wsRef.current = null;
      const ms = Math.min(retry.current, 10000);
      retry.current = Math.min(retry.current * 2, 10000);
      setTimeout(open, ms);
    }

    open();

    return () => {
      alive.current = false;
      try { wsRef.current && wsRef.current.close(); } catch(_){}
      wsRef.current = null;
    };
  }, [pair, tf, enabled, onKline, onPrice]);
}
export default useKlinesWs;
