export const handler = async (event) => {
  try {
    const url = new URL(event.rawUrl || `http://localhost${event.path}${event.rawQuery ? '?' + event.rawQuery : ''}`);
    const quote = (url.searchParams.get('quote') || 'USDT').toUpperCase(); // USDT | USD | ALL
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '100', 10), 10), 500);

    // Crypto.com Exchange public tickers
    const r = await fetch("https://api.crypto.com/exchange/v1/public/get-ticker", { headers: { accept: "application/json" } });
    const j = await r.json();
    const data = Array.isArray(j?.result?.data) ? j.result.data : [];

    // Filter by quote (suffix) and sort by volume desc
    const rows = data
      .filter(x => {
        if (quote === 'ALL') return true;
        return typeof x.i === 'string' && x.i.endsWith('_' + quote);
      })
      .sort((a, b) => Number(b.v || 0) - Number(a.v || 0))
      .slice(0, limit)
      .map(x => ({
        symbol: x.i,                 // e.g., BTC_USDT
        last: String(x.a ?? ""),     // last price
        change: String(x.c ?? ""),   // 24h change
        high: String(x.h ?? ""),     // 24h high
        low:  String(x.l ?? ""),     // 24h low
        vol:  String(x.v ?? ""),     // 24h volume
      }));

    if (!rows.length) {
      // Fallback (very unlikely now)
      const cg = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd");
      const p = await cg.json();
      return {
        statusCode: 200,
        headers: {"content-type":"application/json","cache-control":"no-store"},
        body: JSON.stringify([
          { symbol: "BTC_USD", last: String(p?.bitcoin?.usd ?? "") },
          { symbol: "ETH_USD", last: String(p?.ethereum?.usd ?? "") }
        ])
      };
    }

    return {
      statusCode: 200,
      headers: {"content-type":"application/json","cache-control":"no-store"},
      body: JSON.stringify(rows)
    };
  } catch (e) {
    return { statusCode: 502, headers: {"content-type":"application/json"}, body: JSON.stringify({ error: e.message }) };
  }
};
