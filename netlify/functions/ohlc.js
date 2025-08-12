export default async (req, res) => {
  try{
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sym = (url.searchParams.get("symbol") || "BTC_USD").toUpperCase();
    const interval = url.searchParams.get("interval") || "1m";
    const limit = Math.min(parseInt(url.searchParams.get("limit")||"200",10), 500);
    // Map "BTC_USD" -> "BTCUSDT" etc.
    const m = sym.replace("_USD","USDT").replace("-USD","USDT").replace("_USDT","USDT");
    const api = `https://api.binance.com/api/v3/klines?symbol=${m}&interval=${interval}&limit=${limit}`;
    const r = await fetch(api);
    if(!r.ok) return res.status(r.status).json({error:`binance ${r.status}`});
    const rows = await r.json();
    // Map to candlestick structure
    const out = rows.map(k => ({
      time: Math.floor(k[0]/1000),
      open: +k[1], high: +k[2], low: +k[3], close: +k[4], vol: +k[5]
    }));
    res.setHeader("Content-Type","application/json");
    res.status(200).end(JSON.stringify(out));
  }catch(e){
    res.status(500).json({error:String(e?.message||e)});
  }
}
