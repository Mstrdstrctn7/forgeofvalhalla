import { useEffect, useRef } from "react";

/**
 * Adaptive poller for one market pair/timeframe.
 * Converts UI symbol "BTC/USD" -> API symbol "BTC_USD".
 */
export function useAdaptivePoll({
  pair,              // "BTC/USD"
  tf = "1m",
  limit = 600,
  setCandles,
  setLastPrice,
  setStatus,         // (string|null) -> void  e.g. "HTTP 400", "No data", null
  isPaused = false,
}) {
  const timer = useRef(null);
  const ctrl  = useRef(null);
  const msRef = useRef(1000);
  const alive = useRef(true);
  const FUNCS = import.meta.env.VITE_FUNCS || "/.netlify/functions";

  function schedule(ms){ clearTimeout(timer.current); timer.current = setTimeout(tick, ms); }

  async function tick(){
    if(!alive.current) return;
    if(isPaused){ schedule(1000); return; }
    try{ ctrl.current?.abort(); }catch{}

    const apiPair = String(pair).replace("/", "_"); // <-- fix
    const url = `${FUNCS}/candles?symbol=${encodeURIComponent(apiPair)}&tf=${tf}&limit=${limit}`;

    try{
      const res = await fetch(url, { signal: (ctrl.current=new AbortController()).signal, cache: "no-store" });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); // [{t,o,h,l,c,v}, ...]
      if (!Array.isArray(data) || data.length === 0){
        setStatus?.("No candle data");
      } else {
        setStatus?.(null);
        setCandles?.(data);
        const last = data[data.length-1]?.c ?? 0;
        setLastPrice?.(last);
      }
      msRef.current = Math.max(800, Math.min(msRef.current, 1500));
      schedule(msRef.current);
    }catch(e){
      setStatus?.(e?.message || "Fetch error");
      msRef.current = Math.min(
        msRef.current < 5000 ? 5000 :
        msRef.current < 10000 ? 10000 :
        msRef.current < 30000 ? 30000 : 60000,
        60000
      );
      schedule(msRef.current);
    }
  }

  useEffect(()=>{
    alive.current = true;
    msRef.current = 1000;
    tick();
    const onFocus = ()=>{ msRef.current = 1000; tick(); };
    window.addEventListener("focus", onFocus);
    return ()=>{ alive.current = false; clearTimeout(timer.current); try{ctrl.current?.abort();}catch{} window.removeEventListener("focus", onFocus); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair, tf, isPaused]);
}
export default useAdaptivePoll;
