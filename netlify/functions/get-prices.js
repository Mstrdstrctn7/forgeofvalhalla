// netlify/functions/get-prices.js
export async function handler() {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
    );
    if (!r.ok) throw new Error(`Upstream error ${r.status}`);
    const j = await r.json();

    const data = {
      BTC: j?.bitcoin?.usd,
      ETH: j?.ethereum?.usd,
    };

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        // Kill all caching everywhere
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Surrogate-Control": "no-store",
        "Netlify-CDN-Cache-Control": "no-store",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
}
