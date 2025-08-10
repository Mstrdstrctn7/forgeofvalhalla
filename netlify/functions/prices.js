/**
 * Returns { ok: true, prices: [{ symbol: 'BTC_USDT', price: 12345.67 }, ...] }
 * Source: Crypto.com Exchange public API (no key required)
 * Docs: https://exchange-docs.crypto.com/exchange/v1/rest-ws/index.html#public-get-ticker
 */
export async function handler() {
  // Edit this list any time you want more/less markets
  const INSTRUMENTS = [
    "BTC_USDT","ETH_USDT","SOL_USDT","ADA_USDT","DOGE_USDT",
    "XRP_USDT","BNB_USDT","LTC_USDT","AVAX_USDT","MATIC_USDT"
  ];

  try {
    // Fetch all tickers in parallel
    const results = await Promise.allSettled(
      INSTRUMENTS.map(name =>
        fetch(`https://api.crypto.com/v2/public/get-ticker?instrument_name=${name}`)
          .then(r => r.json())
          .then(j => ({ name, j }))
      )
    );

    const prices = [];
    for (const r of results) {
      if (r.status !== "fulfilled") {
        prices.push({ symbol: r.reason?.name || "UNKNOWN", price: null, err: "fetch_failed" });
        continue;
      }
      const { name, j } = r.value || {};
      const row = j?.result?.data?.[0] || null;
      // Prefer ask price 'a', fallback to last trade
      const val = row?.a ?? row?.last_trade_price ?? null;
      prices.push({ symbol: name, price: val == null ? null : Number(val) });
    }

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store, max-age=0"
      },
      body: JSON.stringify({ ok: true, prices, ts: Date.now() })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store, max-age=0"
      },
      body: JSON.stringify({ ok: false, error: String(e) })
    };
  }
}
