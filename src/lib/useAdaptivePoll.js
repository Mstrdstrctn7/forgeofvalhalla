import { useEffect, useRef } from "react";

/**
 * Adaptive poller:
 * - 1s base, grows up to 10s if price unchanged
 * - exponential backoff up to 60s on errors
 * - jitter (±10%) to avoid thundering herd
 * - pauses when tab hidden or offline
 * - caller can pause via isPaused()
 * - cancels in-flight requests on rerun/unmount
 */
export default function useAdaptivePoll(fetcher, deps = [], {
  msMin = 1000,
  msMax = 10000,
  msErrMax = 60000,
  calmStep = 1000,
  hotReset = true,
  isPaused = () => false,
} = {}) {
  const timer = useRef();
  const lastHash = useRef(null);
  const delay = useRef(msMin);
  const errDelay = useRef(msMin);
  const abortRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    function schedule(next) {
      if (cancelled) return;
      const jitter = next * (0.9 + Math.random() * 0.2); // ±10%
      timer.current = setTimeout(tick, jitter);
    }

    async function tick() {
      if (cancelled) return;
      if (isPaused() || document.hidden || navigator.onLine === false) {
        schedule(Math.min(delay.current, 5000));
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const res = await fetcher({ signal: abortRef.current.signal });
        const hash = res == null ? null : JSON.stringify(res).slice(0, 512);
        const changed = hash !== lastHash.current;
        lastHash.current = hash;

        if (changed && hotReset) delay.current = msMin;
        else delay.current = Math.min(msMax, delay.current + calmStep);

        errDelay.current = msMin;
        schedule(delay.current);
      } catch (e) {
        if (e?.name === "AbortError") return;
        errDelay.current = Math.min(msErrMax, Math.max(errDelay.current * 2, 2000));
        schedule(errDelay.current);
      }
    }

    delay.current = msMin;
    errDelay.current = msMin;
    tick();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
