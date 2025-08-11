import crypto from "crypto";

const ACCOUNT_MAP = {
  "davilasdynasty@gmail.com": {
    key: process.env.CRYPTOCOM_API_KEY_TAZ,
    secret: process.env.CRYPTOCOM_API_SECRET_TAZ,
  },
  "kingpattykake@gmail.com": {
    key: process.env.CRYPTOCOM_API_KEY_HIS,
    secret: process.env.CRYPTOCOM_API_SECRET_HIS,
  },
};

const json = (code, body) => ({
  statusCode: code,
  headers: {
    "Content-Type":"application/json",
    "Access-Control-Allow-Origin":"*",
    "Cache-Control":"no-store, no-cache, must-revalidate, max-age=0",
  },
  body: JSON.stringify(body),
});

const allowed = () => (process.env.ALLOWED_EMAILS||"")
  .split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);

function sig({ method, id, api_key, nonce, params, secret }) {
  const keys = params ? Object.keys(params).sort() : [];
  const compact = v => (typeof v === "object" ? JSON.stringify(v) : String(v));
  const paramStr = keys.map(k => k + compact(params[k])).join("");
  const payload = method + id + api_key + nonce + paramStr;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function callPriv({ email, method, params }) {
  const key = email.toLowerCase();
  const creds = ACCOUNT_MAP[key];
  if (!creds?.key || !creds?.secret) throw new Error("No API creds mapped for this email");
  const id = Date.now(), nonce = Date.now();
  const api_key = creds.key;
  const s = sig({ method, id, api_key, nonce, params: params||{}, secret: creds.secret });
  const body = { id, method, api_key, params: params||{}, nonce, sig: s };

  const r = await fetch(`https://api.crypto.com/v2/${method}`, {
    method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body)
  });
  const j = await r.json();
  if (!r.ok || j?.code) throw new Error(j?.message || `Exchange error ${r.status}`);
  return j;
}

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") return json(405, { ok:false, error:"Use POST" });
    const { email, action, params } = JSON.parse(event.body || "{}");
    if (!email) return json(400, { ok:false, error:"Missing email" });

    const allow = allowed();
    if (allow.length && !allow.includes(email.toLowerCase())) {
      return json(403, { ok:false, error:"Email not allowed", email, allowed: allow });
    }

    const METHOD = {
      ping: "public/ping",
      balances: "private/get-account-summary",
      order: "private/create-order",
      cancel: "private/cancel-order",
      open_orders: "private/get-open-orders",
      fills: "private/get-trades",
    }[action];

    if (!METHOD) return json(400, { ok:false, error:"Unknown action" });

    if ((process.env.PAPER_TRADING||"").toLowerCase()==="true" && action==="order") {
      return json(200, { ok:false, error:"PAPER_TRADING is ON" });
    }

    if (METHOD === "public/ping") {
      const r = await fetch("https://api.crypto.com/v2/public/ping");
      const t = await r.text();
      return json(200, { ok:true, data: t });
    }

    const data = await callPriv({ email, method: METHOD, params: params||{} });
    return json(200, { ok:true, data });
  } catch (e) {
    return json(200, { ok:false, error: e.message });
  }
}
