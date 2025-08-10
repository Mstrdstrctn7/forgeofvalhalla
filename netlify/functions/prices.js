export async function handler() {
  try {
    const ids = ['bitcoin','ethereum'].join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
    const res = await fetch(url, { headers: { 'accept': 'application/json' } });
    if (!res.ok) throw new Error(`Price fetch failed: ${res.status}`);
    const data = await res.json();
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        prices: {
          BTC: data.bitcoin?.usd ?? null,
          ETH: data.ethereum?.usd ?? null
        }
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
}
