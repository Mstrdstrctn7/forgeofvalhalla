/**
 * Simple BTC/ETH price fetcher via CoinGecko.
 * Your dashboard polls this every 3s.
 * We add short cache headers so Netlify/CDN can help a bit.
 */
export async function handler() {
  try {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd';
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`coingecko: ${res.status} ${res.statusText}`);

    const json = await res.json();
    const out = {
      BTC: json?.bitcoin?.usd ?? null,
      ETH: json?.ethereum?.usd ?? null,
    };

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        // small cache to smooth bursts; still feels live
        'cache-control': 'public, max-age=5',
      },
      body: JSON.stringify(out),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: err.message || String(err) }),
    };
  }
}
