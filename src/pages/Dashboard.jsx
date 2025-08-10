import PriceTiles from "../components/PriceTiles.jsx";
import TradeForm from "../components/TradeForm.jsx";

export default function Dashboard() {
  // You’re already signed in via UI; pass the email so the form can set header
  const email = (window.__FOV_EMAIL__ || document.querySelector('b')?.textContent || "").trim();
  return (
    <div style={{ minHeight: "100vh", padding: 16,
      background: "radial-gradient(1000px 600px at 20% -10%, rgba(130,20,170,.3), transparent), radial-gradient(1000px 600px at 120% 20%, rgba(0,180,90,.18), transparent), rgb(22,5,28)",
      color: "rgb(242,234,227)" }}>
      <h1 style={{ marginTop: 0, color: "rgb(226,192,68)" }}>Forge of Valhalla — Dashboard</h1>
      <PriceTiles />
      <TradeForm signedInEmail={email} />
    </div>
  );
}
