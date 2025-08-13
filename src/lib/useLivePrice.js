import { useEffect, useRef } from "react";

/** Polls last trade/price ~1s with error backoff. Calls onPrice(p:number). */
export default function useLivePrice({ pair, onPrice, isPaused=false }) {
  const alive = useRef(true);
  const t = useRef(null);
  const ms = useRef(1000);
  const ctrl = useRef(null);
  const FUNCS = import.meta.env.VITE_FUNCS || "/.netlify/functions";

  function schedule(next=ms.current){ clearTimeout(t.current); t.current=setTimeout(tick,next); }

  async function tick(){
    if (!alive.current){ return; }
    if (isPaused){ schedule(1000); return; }
    try { ctrl.current?.abort(); } catch {}
    ctrl.current = new AbortController();
    const url = `${FUNCS}/price?symbol=${encodeURIComponent(pair)}`;
    try{
      const res = await fetch(url, { signal: ctrl.current.signal, cache:"no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json(); // { price:number } or plain number
      const p = typeof json === "number" ? json : (json?.price ?? null);
      if (typeof p === "number"){ onPrice?.(p); }
      ms.current = 1000;                 // healthy → stay fast
    }catch(e){
      // backoff on error
      ms.current = Math.min(ms.current < 5000 ? 5000 : ms.current*2, 60000);
      // don’t spam console in production; one-line warn helps in dev:
      console.warn?.("[livePrice] backoff", e?.message||e, "→", ms.current,"ms");
    }
    schedule(ms.current);
  }

  useEffect(() => {
    alive.current = true;
    ms.current = 1000;
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
  }, [pair, isPaused]);
}
