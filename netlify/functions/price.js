export default async (req, context) => {
  try {
    const url = new URL(req.url);
    const pair = url.searchParams.get("symbol") || "BTC/USD";

    // Simple mapper: XXX/USD -> XXXUSDT
    const [base, quote] = pair.split(/[\/_:-]/);
    const symbol = `${(base||"BTC").toUpperCase()}${(quote||"USD").toUpperCase() === "USD" ? "USDT" : (quote||"USD").toUpperCase()}`;

    const resp = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, { headers: { "cache-control": "no-cache" }});
    if (!resp.ok) return new Response(JSON.stringify({ error: `upstream ${resp.status}` }), { status: 502 });

    const data = await resp.json(); // { symbol, price }
    const price = Number(data?.price);
    if (!Number.isFinite(price)) return new Response(JSON.stringify({ error: "bad payload" }), { status: 502 });

    // CORS open to your site
    return new Response(JSON.stringify(price), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store, max-age=0",
        "access-control-allow-origin": "*"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "price failed" }), { status: 500 });
  }
};
