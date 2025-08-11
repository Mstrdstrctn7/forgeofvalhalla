export async function handler() {
  const coins = (process.env.VITE_COINS || process.env.VITE_COINS1 || "BTC_USDT,ETH_USDT")
    .split(",").map(s=>s.trim().toUpperCase()).filter(Boolean);
  const allowed = (process.env.ALLOWED_EMAILS||"")
    .split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
  const paper = (process.env.PAPER_TRADING||"").toLowerCase()==="true";
  return {
    statusCode: 200,
    headers: { "Content-Type":"application/json","Access-Control-Allow-Origin":"*" },
    body: JSON.stringify({ ok:true, coins, allowed, paper })
  };
}
