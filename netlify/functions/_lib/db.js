// Uses built-in fetch (Node 18+)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function getUserKeys(userId) {
  const url = `${SUPABASE_URL}/rest/v1/user_api_credentials?user_id=eq.${encodeURIComponent(userId)}&select=api_key,api_secret&limit=1`;
  const r = await fetch(url, { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } });
  if (!r.ok) throw new Error(`Supabase read failed: ${r.status}`);
  const rows = await r.json();
  if (!rows?.length) throw new Error("No API keys saved for this user");
  return rows[0];
}
