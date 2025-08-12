/**
 * GET /.netlify/functions/candles?symbol=BTC_USD&tf=1m&limit=600
 * Coinbase Exchange proxy → [{t,o,h,l,c,v}, ...] ascending by time.
 * Maps "BTC_USD" → "BTC-USD"
 */
export async function handler(event){
  try{
    const qs = new URLSearchParams(event.queryStringParameters || {});
    const ui = (qs.get("symbol") || "BTC_USD").toUpperCase();
    const tf = (qs.get("tf") || "1m").toLowerCase();
    const limit = Math.min(parseInt(qs.get("limit") || "300",10), 1000);

    // Map UI pair to Coinbase product (USD stays USD)
    const sym = ui.replace("/", "_");
    const [base, quoteUi] = sym.split("_");
    const product = `${base}-${quoteUi === "USDT" ? "USD" : quoteUi}`;

    // Coinbase granularities
    const gmap = { "1m":60, "5m":300, "15m":900, "30m":1800, "1h":3600, "4h":14400, "1d":86400 };
    const gran = gmap[tf] || 60;

    const url = `https://api.exchange.coinbase.com/products/${product}/candles?granularity=${gran}`;
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "forge-of-valhalla/1.0"
      }
    });
    if (!res.ok){
      return json({ error:`Upstream ${res.status}` }, res.status);
    }
    const rows = await res.json(); // [[time, low, high, open, close, volume], ...] latest first
    if (!Array.isArray(rows)) return json({ error:"Bad upstream format" }, 502);

    const out = rows
      .slice(0, limit)
      .reverse()
      .map(r => ({
        t: r[0]*1000,          // seconds → ms
        o: Number(r[3]),
        h: Number(r[2]),
        l: Number(r[1]),
        c: Number(r[4]),
        v: Number(r[5]),
      }));

    return json(out, 200);
  }catch(e){
    return json({ error: e?.message || "server error" }, 502);
  }
}
function json(body, status=200){
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}
