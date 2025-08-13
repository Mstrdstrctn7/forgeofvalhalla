import { useEffect, useRef } from "react";

/**
 * Live last-price for a pair/timeframe.
 * - Tries GET /price?symbol=PAIR
 * - If that 404/451/5xx, falls back to GET /candles?symbol=PAIR&tf=TF&limit=1
 * - Polls ~1s when healthy, backs off up to 60s on errors
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

    let price = null, ok = false, usedFallback = false;

    // Try /price first
    try{
      const r = await fetch(`${FUNCS}/price?symbol=${encodeURIComponent(pair)}`, { signal: ctrl.current.signal, cache:"no-store" });
      if (r.ok){
        const j = await r.json();
        price = typeof j === "number" ? j : (j?.price ?? null);
        ok = typeof price === "number";
      }
    }catch{}

    // Fallback: /candles?limit=1
    if (!ok){
      usedFallback = true;
      try{
        const r = await fetch(`${FUNCS}/candles?symbol=${encodeURIComponent(pair)}&tf=${encodeURIComponent(tf)}&limit=1`, { signal: ctrl.current.signal, cache:"no-store" });
        if (r.ok){
          const arr = await r.json(); // [{t,o,h,l,c,v}] or []
          price = Array.isArray(arr) && arr[0] ? (arr[0].c ?? null) : null;
          ok = typeof price === "number";
        }
      }catch{}
    }

    if (ok){
      onPrice?.(price);
      // stay fast when healthy, slightly slower if fallback path (to be polite)
      ms.current = usedFallback ? 1500 : 1000;
    }else{
      // backoff on error
      if (ms.current < 5000) ms.current = 5000;
      else if (ms.current < 10000) ms.current = 10000;
      else if (ms.current < 30000) ms.current = 30000;
      else ms.current = 60000;
      console.warn?.("[livePrice] backoff →", ms.current,"ms");
    }
    schedule(ms.current);
  }

  useEffect(() => {
    alive.current = true;
    ms.current = 1000; // reset fast when inputs change
    tick();
    const onFocus = () => { ms.current = 1000; tick(); };
    window.addEventListener("focus", onFocus);
    return () => {
      alive.current = false;
      clearTimeout(t.current);
      try { ctrl.current?.abort(); } catch {}
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair, tf, isPaused]);
}
