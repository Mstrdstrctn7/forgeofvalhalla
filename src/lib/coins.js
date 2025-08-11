export function getSymbols() {
  const raw = (import.meta?.env?.VITE_COINS || "").trim();
  const s = raw || "BTC_USDT,ETH_USDT";
  return s.split(",").map(x => x.trim().toUpperCase()).filter(Boolean);
}
