const allowedIPs = [
  "79.135.152.7", // ← your new VPN IP
  "YOUR_SECONDARY_IP_IF_NEEDED"
];

// Extract requester IP address
const requestIP = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.connection.remoteAddress;

if (!allowedIPs.includes(requestIP)) {
  return res.status(403).json({ success: false, message: "IP not authorized" });
}
