/**
 * Crypto.com + Coinbase/Coingecko helpers
 * - map pair/timeframe to each provider’s format
 * - open/close Crypto.com WS subscriptions
 * - lightweight fallbacks (Coinbase, Coingecko)
 */
export const tfMap = {
  "1m": "1m",
  "3m": "3m",
  "5m": "5m",
  "30m": "30m",
  "1h": "1h",
  "24h": "1d",
};

// BTC/USD -> BTC_USDT (Crypto.com) and BTC-USD (Coinbase)
export function toCryptoComPair(pair) {
  const [base, quote] = pair.split("/");
  const q = quote === "USD" ? "USDT" : quote;
  return `${base}_${q}`;
}
export function toCoinbasePair(pair) {
  return pair.replace("/", "-");
}

// --- WS: Crypto.com candlestick + ticker ---
const CRYPTO_WS = "wss://stream.crypto.com/v2/market";

/**
 * openCryptoWS({ pair, tf, onTick, onCandle, onClose }) -> close()
 * - streams candlesticks (interval = tf) and ticker last price
 */
export function openCryptoWS({ pair, tf, onTick, onCandle, onClose }) {
  const inst = toCryptoComPair(pair);
  const chanK = `candlestick.${tfMap[tf] || "1m"}.${inst}`;
  const chanT = `ticker.${inst}`;

  let ws = new WebSocket(CRYPTO_WS);
  let alive = true;

  ws.onopen = () => {
    const sub = {
      id: Date.now(),
      method: "subscribe",
      params: { channels: [chanK, chanT] },
    };
    ws.send(JSON.stringify(sub));
  };

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (!msg || !msg.result || !msg.result.data) return;
      const { channel, data } = msg.result;

      // ticker -> last price
      if (channel === chanT && data?.[0]?.a) {
        const last = Number(data[0].a); // "a" = latest trade price
        if (!Number.isNaN(last)) onTick?.(last);
      }

      // candlestick -> append/update last candle
      if (channel === chanK && data?.[0]) {
        // Crypto.com sends latest candle like:
        // { t: 1700000000000, o:"", h:"", l:"", c:"", v:"" }
        const k = data[0];
        const candle = {
          t: Number(k.t),
          o: Number(k.o),
          h: Number(k.h),
          l: Number(k.l),
          c: Number(k.c),
          v: Number(k.v),
        };
        onCandle?.(candle);
      }
    } catch {}
  };

  ws.onclose = () => {
    if (!alive) return;
    onClose?.();
    // auto-retry after short delay
    setTimeout(() => {
      if (!alive) return;
      openCryptoWS({ pair, tf, onTick, onCandle, onClose });
    }, 1500);
  };

  ws.onerror = () => { try { ws.close(); } catch {} };

  return () => { alive = false; try { ws.close(); } catch {} };
}

// --- Fallbacks (HTTP) ---
const FUNCS = import.meta.env.VITE_FUNCS || "/.netlify/functions";

export async function fetchCryptoCandles(pair, tf, limit = 300, signal) {
  const url = `${FUNCS}/ccandles?pair=${encodeURIComponent(pair)}&tf=${tf}&limit=${limit}`;
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`ccandles ${res.status}`);
  return res.json(); // [{t,o,h,l,c,v}, ...] ascending
}

export async function fetchCoinbasePrice(pair, signal) {
  const p = toCoinbasePair(pair);
  const res = await fetch(`${FUNCS}/cprice?pair=${p}`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`cprice ${res.status}`);
  const j = await res.json();
  return Number(j.price || j.last || j.ask || 0);
}

export async function fetchGeckoPrice(base, quote = "usd", signal) {
  // expects CoinGecko coin id (e.g., 'bitcoin', 'ethereum')
  const res = await fetch(`${FUNCS}/gprice?id=${base}&vs=${quote}`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`gprice ${res.status}`);
  const j = await res.json();
  return Number(j.price || 0);
}
