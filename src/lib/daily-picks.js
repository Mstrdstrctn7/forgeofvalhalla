export function knightRiderToday(){
  const pool = ["BTC_USD","ETH_USD","SOL_USD","LINK_USD","AVAX_USD","ADA_USD","DOGE_USD","XRP_USD","TON_USD","NEAR_USD"];
  const d = new Date();
  const key = `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`;
  let h=2166136261; for (let i=0;i<key.length;i++){ h^=key.charCodeAt(i); h=(h*16777619)>>>0; }
  // pick 3 rotating, but we’ll show first one by default in focus
  const picks = [pool[h%pool.length], pool[(h+3)%pool.length], pool[(h+7)%pool.length]];
  return picks;
}
