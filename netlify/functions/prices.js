export async function handler() {
  try {
    const ids = 'bitcoin,ethereum';
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
    const res = await fetch(url, { headers: { 'accept': 'application/json' } });
    if (!res.ok) throw new Error(`price fetch failed: ${res.status}`);
    const json = await res.json();
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        prices: {
          BTC: json.bitcoin?.usd ?? null,
          ETH: json.ethereum?.usd ?? null,
        }
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok:false, error: err.message })
    };
  }
}
