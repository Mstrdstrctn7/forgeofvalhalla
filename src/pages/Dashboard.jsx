import { useEffect, useState } from "react";

export default function Dashboard() {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("/.netlify/functions/get-prices");
        const data = await res.json();
        setPrices(data);
      } catch (err) {
        console.error("Error fetching prices", err);
      }
    };

    fetchPrices(); // first call immediately
    const interval = setInterval(fetchPrices, 1500); // every 1.5s

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>Live Prices</h2>
      <p>BTC: {prices.BTC ?? "Loading..."}</p>
      <p>ETH: {prices.ETH ?? "Loading..."}</p>
    </div>
  );
}
