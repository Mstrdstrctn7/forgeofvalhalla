export async function handler() {
  try {
    const ids = ['bitcoin','ethereum'];
    const r = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids='+
      ids.join(',')+'&vs_currencies=usd',
      { headers: { accept: 'application/json' } }
    );
    if (!r.ok) throw new Error('cg '+r.status);
    const j = await r.json();
    const prices = {};
    if (j.bitcoin?.usd)  prices['BTC_USDT'] = j.bitcoin.usd;
    if (j.ethereum?.usd) prices['ETH_USDT'] = j.ethereum.usd;
    return {
      statusCode: 200,
      headers: { 'content-type':'application/json','cache-control':'no-store' },
      body: JSON.stringify({ ok:true, prices })
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: { 'content-type':'application/json','cache-control':'no-store' },
      body: JSON.stringify({ ok:false, error:String(e) })
    };
  }
}
