// netlify/edge-functions/get-prices.js
export default async (request, context) => {
  try {
    const upstream =
      'https://api.binance.com/api/v3/ticker/price?symbols=["BTCUSDT","ETHUSDT"]';

    const r = await fetch(upstream, { headers: { "cache-control": "no-cache" } });
    if (!r.ok) return new Response(JSON.stringify({ error: `upstream ${r.status}` }), { status: 502 });

    const arr = await r.json(); // [{symbol:"BTCUSDT", price:"..."},
                                //  {symbol:"ETHUSDT", price:"..."}]
    const map = Object.fromEntries(arr.map(x => [x.symbol, Number(x.price)]));

    const data = {
      BTC: map.BTCUSDT, // USDT ~ USD
      ETH: map.ETHUSDT,
      ts: Date.now()
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "content-type": "application/json",
        // absolutely no caching anywhere
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Netlify-CDN-Cache-Control": "no-store",
        "Surrogate-Control": "no-store"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};
