export async function handler() {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json","Access-Control-Allow-Origin":"*" },
    body: JSON.stringify({ ok:true, ts: Date.now() })
  };
}
