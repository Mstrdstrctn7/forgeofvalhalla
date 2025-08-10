git commit -m "feat: live BTC/ETH price cards via Netlify function"import { useEffect, useState } from "react"; git push origin 
main export default function Dashboard() { git add src/pages/Dashboard.jsx const [prices, setPrices] = useState({}); git commit 
-m "feat: set coin price refresh to 1.5 seconds"
git push origin main  const fetchPrices = async () => {
    try {
      const res = await fetch("/.netlify/functions/get-prices");
      const data = await res.json();
      setPrices(data);
    } catch (err) {
      console.error("Error fetching prices:", err);
    }
  };

  useEffect(() => {
    fetchPrices(); // first load
    const interval = setInterval(fetchPrices, 1500); // refresh every 1.5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>Live Prices (1.5s refresh)</h2>
      <pre>{JSON.stringify(prices, null, 2)}</pre>
    </div>
  );
}
