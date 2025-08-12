import { useEffect, useRef } from "react";

/**
 * Adaptive poller for a single pair/timeframe.
 * - Fast (~1s) when healthy, backs off to 10s…60s on errors
 * - Resumes immediately when page regains focus
 */
export function useAdaptivePoll({
  pair,              // e.g. "BTC/USD"
  tf = "1m",         // timeframe (your API expects "1m","5m","1h","1d")
  limit = 300,       // number of candles
  setCandles,        // (arr) -> void
  setLastPrice,      // (num) -> void
  isPaused = false,  // pause polling while user is scrubbing, etc.
}) {
  const timer = useRef(null);
  const ctrl  = useRef(null);
  const msRef = useRef(1000);          // start fast
  const alive = useRef(true);

  const FUNCS = import.meta.env.VITE_FUNCS || "/.netlify/functions";

  function schedule(nextMs) {
    clearTimeout(timer.current);
    timer.current = setTimeout(tick, nextMs);
  }

  async function tick() {
    if (!alive.current) return;
    if (isPaused) { schedule(1000); return; }

    // abort in-flight request if any
    try { ctrl.current?.abort(); } catch {}
    ctrl.current = new AbortController();

    const url = `${FUNCS}/candles?symbol=${encodeURIComponent(pair)}&tf=${tf}&limit=${limit}`;
    try {
      const res = await fetch(url, { signal: ctrl.current.signal, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); // [{t,o,h,l,c,v}, ...]

      setCandles?.(data);
      const last = data?.[data.length - 1]?.c ?? 0;
      setLastPrice?.(last);

      // healthy → stay fast
      msRef.current = Math.max(800, Math.min(msRef.current, 1500));
      schedule(msRef.current);
    } catch (e) {
      // error → back off progressively
      msRef.current = Math.min(
        msRef.current < 5000 ? 5000 :
        msRef.current < 10000 ? 10000 :
        msRef.current < 30000 ? 30000 : 60000,
        60000
      );
      console.warn("poll error/backoff", e?.message || e, "next ms:", msRef.current);
      schedule(msRef.current);
    }
  }

  useEffect(() => {
    alive.current = true;
    // reset to fast whenever pair/tf changes
    msRef.current = 1000;
    tick();

    // resume immediately when tab regains focus
    const onFocus = () => { msRef.current = 1000; tick(); };
    window.addEventListener("focus", onFocus);

    return () => {
      alive.current = false;
      clearTimeout(timer.current);
      try { ctrl.current?.abort(); } catch {}
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair, tf, isPaused]);
}
export default useAdaptivePoll;
