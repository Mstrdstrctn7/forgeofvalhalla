export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Use POST' };
  }
  try {
    const { side, symbol, amount } = JSON.parse(event.body || '{}');

    if (!['buy','sell'].includes(side)) throw new Error('side must be "buy" or "sell"');
    if (!['BTC','ETH'].includes(symbol)) throw new Error('symbol must be BTC or ETH');
    const qty = Number(amount);
    if (!Number.isFinite(qty) || qty <= 0) throw new Error('amount must be a positive number');

    // TODO: wire to Crypto.com Exchange here using API key/secret stored in env
    // For now, echo back a fake order id.
    const fakeOrderId = `demo_${Date.now()}`;

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true, id: fakeOrderId, side, symbol, amount: qty })
    };
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
}
