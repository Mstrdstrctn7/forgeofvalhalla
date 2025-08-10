// netlify/functions/get-prices.js
// Fast BTC/ETH prices with no caching + short timeout

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd";

exports.handler = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000); // 3s safety timeout

  try {
    const res = await fetch(COINGECKO_URL, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "user-agent": "ForgeOfValhalla/1.0 (+https://forgeofvalhalla.netlify.app)"
      },
      cache: "no-store"
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
          "access-control-allow-origin": "*"
        },
        body: JSON.stringify({ error: "upstream_error", status: res.status })
      };
    }

    const data = await res.json();
    const out = {
      BTC: Number(data?.bitcoin?.usd ?? 0),
      ETH: Number(data?.ethereum?.usd ?? 0),
      ts: Date.now()
    };

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
        "access-control-allow-origin": "*",
        vary: "Origin"
      },
      body: JSON.stringify(out)
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
        "access-control-allow-origin": "*"
      },
      body: JSON.stringify({ BTC: 0, ETH: 0, ts: Date.now(), error: "timeout_or_fetch_error" })
    };
  }
};
