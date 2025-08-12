exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8",
  };
  try {
    const url = new URL(event.rawUrl || ("https://x/?" + event.rawQuery));
    const symbol = (url.searchParams.get("symbol") || "BTC_USD").toUpperCase();
    const interval = url.searchParams.get("interval") || "1m";
    // Map FOV symbol "BTC_USD" -> Binance "BTCUSDT"
    const base = symbol.replace(/_USD$/, "");
    const binanceSymbol = base + "USDT";

    const limit = Math.min(parseInt(url.searchParams.get("limit")||"300",10), 1000);
    const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`);
    if (!res.ok) throw new Error(`Upstream ${res.status}`);
    const rows = await res.json();

    // Binance kline fields: [ openTime, open, high, low, close, volume, closeTime, ... ]
    const candles = rows.map(r => ({
      time: Math.floor(r[0]/1000),
      open: Number(r[1]),
      high: Number(r[2]),
      low:  Number(r[3]),
      close:Number(r[4]),
    }));

    return { statusCode: 200, headers, body: JSON.stringify({symbol, interval, candles}) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({error: String(e.message||e)}) };
  }
};
