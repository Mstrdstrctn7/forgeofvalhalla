export default async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    const sym = (url.searchParams.get("symbol") || "BTC_USD").toUpperCase();
    const tf  = (url.searchParams.get("tf") || "1m");
    const lim = Math.min(500, parseInt(url.searchParams.get("limit")||"180",10));
    const binance = sym.replace("_USD","USDT").replace("_",""); // BTC_USD -> BTCUSDT
    const api = `https://api.binance.com/api/v3/klines?symbol=${binance}&interval=${tf}&limit=${lim}`;
    const r = await fetch(api, { headers: { "User-Agent":"FoV/1.0" }});
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const rows = await r.json();
    // Return compact objects [{t,o,h,l,c,v}]
    const out = rows.map(k => ({
      t: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5]
    }));
    res.setHeader("content-type","application/json");
    res.end(JSON.stringify(out));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(e.message || e) }));
  }
};
