/**
 * KnightRider: rotate suggested pairs once per UTC day.
 * Return e.g. "BTC_USD". Provide your own list if you like.
 */
const LIST = ["BTC_USD","ETH_USD","XRP_USD","SOL_USD","LINK_USD","ADA_USD","AVAX_USD","DOGE_USD","TON_USD","BNB_USD"];
function dayKeyUTC(){
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`;
}
export function knightPick(list=LIST){
  const key = dayKeyUTC();
  let h = 2166136261;
  for (let i=0;i<key.length;i++){ h ^= key.charCodeAt(i); h = (h*16777619)>>>0; }
  return (list[h % list.length]) || list[0];
}
export function knightList(){ return LIST.slice(); }
export default knightPick;
