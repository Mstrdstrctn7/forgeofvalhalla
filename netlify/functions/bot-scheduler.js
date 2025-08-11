const base = ()=>process.env.URL || process.env.DEPLOY_URL || process.env.SITE_URL || '';
export async function handler() {
  // fire-and-forget background fn
  fetch(`${base()}/.netlify/functions/bot-tick-background`, { method:'POST' })
    .catch(()=>{});
  return {
    statusCode: 200,
    headers: { 'content-type':'application/json','cache-control':'no-store' },
    body: JSON.stringify({ ok:true, queued:true })
  };
}
