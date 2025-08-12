/**
 * GET /.netlify/functions/candles?symbol=BTC_USD&tf=1m&limit=600
 * Proxies Binance klines and returns [{t,o,h,l,c,v}, ...].
 * Supports: USDT market (BTC_USD -> BTCUSDT, ETH_USD -> ETHUSDT, etc.)
 */
export async function handler(event) {
  try {
    const qs = new URLSearchParams(event.queryStringParameters || {});
    const uiSymbol = (qs.get("symbol") || "BTC_USD").toUpperCase();
    const tf = (qs.get("tf") || "1m").toLowerCase();
    const limit = Math.min(parseInt(qs.get("limit") || "600", 10), 1000);

    // Map "BTC_USD" -> "BTCUSDT"
    const [base, quoteUI] = uiSymbol.split("_");
    const quote = quoteUI === "USD" ? "USDT" : quoteUI;   // normalize USD -> USDT for Binance
    const binanceSymbol = `${base}${quote}`;

    // Validate timeframe
    const allowed = new Set(["1m","5m","15m","30m","1h","4h","1d"]);
    const interval = allowed.has(tf) ? tf : "1m";

    const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) {
      return json({ error: `Upstream ${res.status}` }, res.status);
    }
    const rows = await res.json(); // [ [openTime,o,h,l,c,v,closeTime,...], ... ]

    const out = rows.map(r => ({
      t: r[0],                    // openTime (ms)
      o: Number(r[1]),
      h: Number(r[2]),
      l: Number(r[3]),
      c: Number(r[4]),
      v: Number(r[5]),
    }));

    return json(out, 200);
  } catch (e) {
    return json({ error: e?.message || "server error" }, 502);
  }
}

function json(body, status = 200) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}
