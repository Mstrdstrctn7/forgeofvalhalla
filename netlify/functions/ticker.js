/**
 * GET /.netlify/functions/ticker
 * Returns a small list of symbols the UI can display.
 */
export async function handler() {
  const symbols = [
    "BTC_USD","ETH_USD","XRP_USD","BNB_USD","SOL_USD",
    "ADA_USD","DOGE_USD","AVAX_USD","LINK_USD","TON_USD"
  ];
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(symbols.map(s => ({ symbol: s }))),
  };
}
