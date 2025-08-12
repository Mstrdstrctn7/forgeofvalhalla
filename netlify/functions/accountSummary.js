// Uses built-in fetch (Node 18+)
import { getUserFromAuthHeader } from "./_lib/auth.js";
import { getUserKeys } from "./_lib/db.js";
import { sign } from "./_lib/cryptoCom.js";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") return { statusCode: 405, body: "Method Not Allowed" };
  if (process.env.VITE_ENABLE_TRADING !== "true") return { statusCode: 403, body: "Trading disabled" };

  const user = getUserFromAuthHeader(event);
  if (!user?.id) return { statusCode: 401, body: "Missing/invalid auth" };

  try {
    const { api_key, api_secret } = await getUserKeys(user.id);
    const body = { id: Date.now(), method: "private/get-account-summary", api_key, params: {}, nonce: Date.now() };
    const signed = sign(body, api_secret);

    const res = await fetch("https://api.crypto.com/exchange/v1/private/get-account-summary", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(signed)
    });
    const json = await res.json();
    return { statusCode: 200, body: JSON.stringify(json) };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};
