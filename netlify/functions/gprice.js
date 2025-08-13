export default async (req, res) => {
  try {
    const url = new URL(req.url);
    const id  = url.searchParams.get("id") || "bitcoin";
    const vs  = (url.searchParams.get("vs") || "usd").toLowerCase();
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=${vs}`,
      { headers: { "accept": "application/json" }, cache: "no-store" });
    if (!r.ok) return res.status(r.status).send("upstream error");
    const j = await r.json();
    const price = Number(j?.[id]?.[vs] ?? 0);
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ price }));
  } catch (e) {
    return res.status(502).end("gprice error");
  }
};
