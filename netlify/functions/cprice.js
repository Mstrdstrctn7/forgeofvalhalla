export default async (req, res) => {
  try {
    const url = new URL(req.url);
    const pair = url.searchParams.get("pair") || "BTC-USD"; // coinbase format
    const r = await fetch(`https://api.exchange.coinbase.com/products/${pair}/ticker`,
      { headers: { "accept": "application/json" }, cache: "no-store" });
    if (!r.ok) return res.status(r.status).send("upstream error");
    const j = await r.json();
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ price: Number(j.price || j.last || 0) }));
  } catch (e) {
    return res.status(502).end("cprice error");
  }
};
