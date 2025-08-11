const DEFAULTS = (process.env.COINS || "").trim();

export async function handler(event) {
  try {
    const url = new URL(event.rawUrl || "http://x/");
    const p = url.searchParams.get("symbols") || url.searchParams.get("s") || "";
    const base = (p || DEFAULTS || "BTC_USDT,ETH_USDT").split(",").map(x=>x.trim().toUpperCase()).filter(Boolean);
    const uniq = Array.from(new Set(base)).slice(0, 20);

    const calls = uniq.map(n =>
      fetch(`https://api.crypto.com/v2/public/get-ticker?instrument_name=${encodeURIComponent(n)}`)
        .then(r => r.json())
        .then(j => ({ n, d: j?.result?.data?.[0] || null }))
        .catch(() => ({ n, d: null }))
    );

    const results = await Promise.all(calls);
    const map = {};
    for (const { n, d } of results) {
      const price = Number(d?.k || d?.a || d?.p || d?.price || 0);
      if (Number.isFinite(price) && price > 0) map[n] = { price, ts: Date.now() };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type":"application/json",
        "Access-Control-Allow-Origin":"*",
        "Cache-Control":"no-store, no-cache, must-revalidate, max-age=0"
      },
      body: JSON.stringify({ ok:true, map, symbols: uniq })
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: { "Content-Type":"application/json","Access-Control-Allow-Origin":"*" },
      body: JSON.stringify({ ok:false, error:e.message })
    };
  }
}
