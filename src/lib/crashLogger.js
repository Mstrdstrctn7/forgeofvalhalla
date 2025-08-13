export function getLastCrash(){
  return (typeof window !== "undefined" && window.__FOV_LAST_ERROR__) || null;
}
