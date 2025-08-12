const LIST = [
  "BTC_USD","ETH_USD","SOL_USD","XRP_USD","LINK_USD","AVAX_USD",
  "ADA_USD","DOGE_USD","TON_USD","DOT_USD","NEAR_USD","ATOM_USD"
];
function dayIdx(n){
  const d=new Date(); const k=`${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`;
  let h=2166136261; for (let i=0;i<k.length;i++){ h^=k.charCodeAt(i); h=(h*16777619)>>>0; }
  return h%n;
}
export function knightRiderToday(count=3){
  const start = dayIdx(LIST.length);
  const out=[]; for(let i=0;i<count;i++) out.push(LIST[(start+i)%LIST.length]);
  return out;
}
