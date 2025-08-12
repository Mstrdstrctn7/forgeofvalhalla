/**
 * Daily rotating copy for FoV (UTC-based).
 * Keys: 'momma' -> string, 'forge' -> string, 'oath' -> string[3]
 */
const MOMMA = [
  "— may his counsel steady the hand.",
  "— wisdom at our backs, steel in our grip.",
  "— let patience temper fire.",
  "— walk the road, don’t chase the roar.",
  "— quiet mind, true edge."
];
const FORGE = [
  "Past the veil of winter and war, chosen hands gather at the anvil. This forge is private—oathbound and invitation-only. The hall opens only to those named upon the shield wall.",
  "Here the night gives way to embers. We keep our circle small and our oaths smaller still. Entry is earned, not asked.",
  "Beneath stone and storm we work the signal from the noise. Names are carved, not typed. Doors stay shut to idle talk.",
  "A hall for few, a task for fewer. We carry quiet torches and answer only to the wall of shields.",
  "Steel before silver. Proof before praise. The way in is written on the wall."
];
const OATHS = [
  ["Steel before silver.","Signal before noise.","Loyalty before glory."],
  ["Truth before comfort.","Discipline before drift.","Craft before clout."],
  ["Patience before haste.","Process before pride.","Team before tale."],
  ["Edge before echo.","Work before words.","Beacon before banner."],
  ["Measure before move.","Focus before flair.","Silence before boast."]
];
function idx(n){
  const d = new Date();
  const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
  let h = 2166136261;
  for (let i=0;i<key.length;i++){ h ^= key.charCodeAt(i); h = (h*16777619)>>>0; }
  return h % n;
}
export function daily(key){
  switch (key){
    case "momma": return MOMMA[idx(MOMMA.length)];
    case "forge": return FORGE[idx(FORGE.length)];
    case "oath":  return OATHS[idx(OATHS.length)];
    default: return "";
  }
}
