export const handler = async (event) => {
  const qs = event?.queryStringParameters || {};
  const vs = (qs.vs || 'USD').toLowerCase();      // usd, usdt, etc.
  const limit = Math.min(Math.max(parseInt(qs.limit || '100', 10) || 100, 1), 250);

  try {
    // CoinGecko markets endpoint (no key needed)
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${encodeURIComponent(vs)}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`coingecko ${r.status}`);
    const list = await r.json();

    const rows = (Array.isArray(list) ? list : []).map((c) => ({
      symbol: `${String(c.symbol||'').toUpperCase()}_${vs.toUpperCase()}`,
      last: String(c.current_price ?? ""),
      change: (c.price_change_percentage_24h!=null) ? `${c.price_change_percentage_24h.toFixed(2)}%` : "",
      high: String(c.high_24h ?? ""),
      low: String(c.low_24h ?? ""),
      vol: String(c.total_volume ?? "")
    }));

    if (!rows.length) throw new Error("empty");

    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
      body: JSON.stringify(rows),
    };
  } catch (e) {
    // Fallback — BTC & ETH only
    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
      body: JSON.stringify([
        { symbol: "BTC_USD", last: "0", change: "", high: "", low: "", vol: "" },
        { symbol: "ETH_USD", last: "0", change: "", high: "", low: "", vol: "" }
      ]),
    };
  }
};
