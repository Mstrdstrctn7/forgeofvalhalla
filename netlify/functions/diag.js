export async function handler() {
  const allowed = (process.env.ALLOWED_EMAILS||"").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
  const map = ["davilasdynasty@gmail.com","Kingpattykake@gmail.com"];
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json","Access-Control-Allow-Origin":"*" },
    body: JSON.stringify({ ok:true, allowed, accounts: map })
  };
}
