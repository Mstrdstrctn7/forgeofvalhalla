export const handler = async () => {
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",{headers:{accept:"application/json"}});
    const p = await r.json();
    const rows = [
      { symbol: "BTC_USD", last: String(p?.bitcoin?.usd ?? ""), change: "", high: "", low: "", vol: "" },
      { symbol: "ETH_USD", last: String(p?.ethereum?.usd ?? ""), change: "", high: "", low: "", vol: "" }
    ];
    if (!rows[0].last && !rows[1].last) throw new Error("fallback");
    return { statusCode: 200, headers: { "content-type": "application/json", "cache-control": "no-store" }, body: JSON.stringify(rows) };
  } catch {
    return { statusCode: 200, headers: { "content-type": "application/json", "cache-control": "no-store" }, body: JSON.stringify([
      { symbol: "BTC_USD", last: "0", change: "", high: "", low: "", vol: "" },
      { symbol: "ETH_USD", last: "0", change: "", high: "", low: "", vol: "" }
    ]) };
  }
};
