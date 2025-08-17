// src/lib/market/cdcClient.js

// Normalize various ticker payloads to a simple shape
function normalize(item) {
  const name = item.instrument_name || item.i || "";
  const last =
    item.last_price ??
    item.latest_trade_price ??
    item.p ?? item.a ?? item.k ?? 0;
  const changePct =
    item.price_change_pct ?? item.c ?? (item.change?.rate ?? 0);

  return {
    instrument: name,
    last: Number(last),
    changePct: Number(changePct) * (Math.abs(changePct) <= 1 ? 100 : 1),
    raw: item,
  };
}

// HTTP one-shot
export async function fetchTicker(instrument) {
  const url =
    "https://api.crypto.com/v2/public/get-ticker?instrument_name=" +
    encodeURIComponent(instrument);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Crypto.com HTTP ${res.status}`);
  const json = await res.json();
  const arr =
    json?.result?.data ?? json?.result ?? (json?.data ? [json.data] : []);
  const first = Array.isArray(arr) ? arr[0] : null;
  return first ? normalize(first) : null;
}

// WebSocket live subscription (returns a stop() function)
export function subscribeTickers(instruments, onTick) {
  const ws = new WebSocket("wss://stream.crypto.com/v2/market");

  ws.onopen = () => {
    const channels = instruments.map((n) => `ticker.${n}`);
    ws.send(
      JSON.stringify({
        id: Date.now(),
        method: "subscribe",
        params: { channels },
      })
    );
  };

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      const data =
        msg?.result?.data ?? msg?.params?.data ?? msg?.data ?? [];
      for (const item of data) {
        onTick(normalize(item));
      }
    } catch {
      // ignore bad frames
    }
  };

  return () => {
    try {
      ws.close();
    } catch {}
  };
}
