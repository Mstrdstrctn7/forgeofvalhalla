// Uses built-in fetch (Node 18+)
export const handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith("Bearer ")) return { statusCode: 401, body: "Missing auth" };

    // Minimal decode for demo (verify in prod)
    const [, payload] = authHeader.split(" ");
    const user = JSON.parse(Buffer.from(payload.split(".")[1], "base64").toString("utf8"))?.user;
    if (!user?.id) return { statusCode: 401, body: "Invalid token" };

    const { api_key, api_secret } = JSON.parse(event.body || "{}");
    if (!api_key || !api_secret) return { statusCode: 400, body: "Missing fields" };

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const resp = await fetch(`${SUPABASE_URL}/rest/v1/user_api_credentials`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        user_id: user.id,
        exchange: "crypto_com",
        api_key,
        api_secret
      })
    });

    const text = await resp.text();
    if (!resp.ok) return { statusCode: resp.status, body: text || "Upsert failed" };
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};
