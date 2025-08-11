import crypto from "crypto";

// map login email -> env pair (names fixed to your setup)
const ACCOUNT_MAP = {
  "davilasdynasty@gmail.com": {
    key: process.env.CRYPTOCOM_API_KEY_TAZ,
    secret: process.env.CRYPTOCOM_API_SECRET_TAZ,
  },
  "Kingpattykake@gmail.com": {
    key: process.env.CRYPTOCOM_API_KEY_HIS,
    secret: process.env.CRYPTOCOM_API_SECRET_HIS,
  },
};

const ALLOWED = (process.env.ALLOWED_EMAILS || "")
  .split(",").map(s => s.trim()).filter(Boolean);

const PAPER = String(process.env.PAPER_TRADING || "").toLowerCase() === "true";

// Crypto.com v2 signing
function buildSig({ method, id, api_key, nonce, params, secret }) {
  const keys = params ? Object.keys(params).sort() : [];
  const compact = v => (typeof v === "object" ? JSON.stringify(v) : String(v));
  const paramStr = keys.map(k => k + compact(params[k])).join("");
  const payload = method + id + api_key + nonce + paramStr;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function callPrivate({ email, method, params }) {
  const creds = ACCOUNT_MAP[email];
  if (!creds?.key || !creds?.secret) throw new Error("No API creds mapped for this email");
  const id = Date.now();
  const nonce = Date.now();
  const api_key = creds.key;
  const sig = buildSig({ method, id, api_key, nonce, params: params || {}, secret: creds.secret });
  const body = { id, method, api_key, params: params || {}, nonce, sig };

  const r = await fetch(`https://api.crypto.com/v2/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok || data?.code) throw new Error(data?.message || `Exchange error ${r.status}`);
  return data;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Use POST" };
    const { email, action, params } = JSON.parse(event.body || "{}");
    if (!email) return { statusCode: 400, body: "Missing email" };
    if (ALLOWED.length && !ALLOWED.includes(email)) {
      return { statusCode: 403, body: "Email not allowed" };
    }

    const METHOD = {
      ping: "public/ping",
      balances: "private/get-account-summary",
      order: "private/create-order",
      cancel: "private/cancel-order",
      open_orders: "private/get-open-orders",
      fills: "private/get-trades",
    }[action];

    if (!METHOD) return { statusCode: 400, body: "Unknown action" };

    if (METHOD === "public/ping") {
      const r = await fetch("https://api.crypto.com/v2/public/ping");
      return { statusCode: 200, body: await r.text() };
    }

    if (PAPER && action === "order") {
      return { statusCode: 200, body: JSON.stringify({ ok: false, error: "PAPER_TRADING is ON" }) };
    }

    const data = await callPrivate({ email, method: METHOD, params: params || {} });
    return { statusCode: 200, body: JSON.stringify({ ok: true, data }) };
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: e.message }) };
  }
}
