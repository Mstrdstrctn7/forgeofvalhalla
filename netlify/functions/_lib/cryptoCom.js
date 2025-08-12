import crypto from "crypto";

function paramsToString(obj) {
  if (!obj) return "";
  const keys = Object.keys(obj).sort();
  return keys.map(k => k + (typeof obj[k] === "object" ? paramsToString(obj[k]) : String(obj[k]))).join("");
}

// Create Crypto.com Exchange v1 HMAC signature
export function sign({ id, method, api_key, params, nonce }, secret) {
  const payload = method + String(id) + api_key + paramsToString(params) + String(nonce);
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return { id, method, api_key, params, nonce, sig };
}
