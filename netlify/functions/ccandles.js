export default async (req, res) => {
  try {
    const url = new URL(req.url);
    const pair = url.searchParams.get("pair") || "BTC/USD";
    const tf   = url.searchParams.get("tf") || "1m";
    const limit= Math.min(1000, Number(url.searchParams.get("limit") || 300));

    const [base, quote] = pair.split("/");
    const q = quote === "USD" ? "USDT" : quote;
    const inst = `${base}_${q}`;

    const r = await fetch(
      `https://api.crypto.com/v2/public/get-candlestick?instrument_name=${inst}&timeframe=${tf}&limit=${limit}`,
      { headers: { "accept": "application/json" }, cache: "no-store" }
    );
    if (!r.ok) return res.status(r.status).send("upstream error");
    const j = await r.json();
    const arr = (j?.result?.data || [])
      .map(k => ({
        t: Number(k.t), o: Number(k.o), h: Number(k.h),
        l: Number(k.l), c: Number(k.c), v: Number(k.v)
      }))
      // Crypto.com returns newest-first; sort ascending for chart
      .sort((a,b) => a.t - b.t);
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(arr));
  } catch (e) {
    return res.status(502).end("ccandles error");
  }
};
