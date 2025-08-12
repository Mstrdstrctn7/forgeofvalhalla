// Extract Supabase user from the JWT coming from the frontend
export function getUserFromAuthHeader(event) {
  const h = event.headers.authorization || event.headers.Authorization;
  if (!h?.startsWith("Bearer ")) return null;
  try {
    const [, jwt] = h.split(" ");
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString("utf8"));
    return payload?.user || null;
  } catch {
    return null;
  }
}
