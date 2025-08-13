import { useEffect, useRef } from "react";

/**
 * Live last-price for a pair/timeframe.
 * Tries Netlify /.netlify/functions/price first (fast),
 * falls back to /candles?limit=1 if unavailable.
 */
export default function useLivePrice({ pair, tf="1m", onPrice, isPaused=false }) {
  const alive = useRef(true), t = useRef(null), ms = useRef(1000), ctrl = useRef(null);
  const FUNCS = import.meta.env.VITE_FUNCS || "/.netlify/functions";

  function schedule(n=ms.current){ clearTimeout(t.current); t.current=setTimeout(tick,n); }

  async function tick(){
    if (!alive.current) return;
    if (isPaused){ schedule(1000); return; }
    try { ctrl.current?.abort(); } catch {}
    ctrl.current = new AbortController();

    let price = null, ok = false, fallback = false;

    // 1) fast path: /price
    try{
      const r = await fetch(`${FUNCS}/price?symbol=${encodeURIComponent(pair)}`, { signal: ctrl.current.signal, cache:"no-store" });
      if (r.ok){
        const j = await r.json();
        price = typeof j === "number" ? j : (j?.price ?? null);
        ok = Number.isFinite(price);
      }
    }catch{}

    // 2) fallback: last candle
    if (!ok){
      fallback = true;
      try{
        const r = await fetch(`${FUNCS}/candles?symbol=${encodeURIComponent(pair)}&tf=${encodeURIComponent(tf)}&limit=1`, { signal: ctrl.current.signal, cache:"no-store" });
        if (r.ok){
          const arr = await r.json();
          price = Array.isArray(arr) && arr[0] ? (arr[0].c ?? null) : null;
          ok = Number.isFinite(price);
        }
      }catch{}
    }

    if (ok){
      onPrice?.(price);
      ms.current = fallback ? 1500 : 1000;   // polite backoff if on fallback
    }else{
      // progressive backoff
      ms.current = ms.current < 5000 ? 5000 : ms.current < 10000 ? 10000 : ms.current < 30000 ? 30000 : 60000;
      console.warn("[live] backoff", ms.current);
    }
    schedule(ms.current);
  }

  useEffect(() => {
    alive.current = true; ms.current = 1000; tick();
    const onFocus = () => { ms.current = 1000; tick(); };
    window.addEventListener("focus", onFocus);
    return () => { alive.current=false; clearTimeout(t.current); try{ctrl.current?.abort();}catch{} window.removeEventListener("focus", onFocus); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair, tf, isPaused]);
}
