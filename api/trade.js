export default async function handler(req, res) {
  const allowedIPs = [
    "79.135.152.7", // your VPN
    // add more if needed
  ];

  const requestIP =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress;

  if (!allowedIPs.includes(requestIP)) {
    return res.status(403).json({ success: false, message: "IP not authorized" });
  }

  const { coin, amountPercent, action, paper, email } = req.body;

  if (!coin || !amountPercent || !action || !email) {
    return res.status(400).json({ success: false, message: "Missing parameters" });
  }

  // 🔒 Simulate trade logic here (replace with real logic or fetch to Crypto.com)
  console.log("💥 TRADE EXECUTED:", { coin, amountPercent, action, paper, email });

  return res.status(200).json({
    success: true,
    message: `Executed ${action.toUpperCase()} of ${amountPercent}% ${coin} in ${paper ? "paper" : "live"} mode.`,
  });
}
