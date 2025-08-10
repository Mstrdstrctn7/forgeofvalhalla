import { useEffect, useState } from 'react';

function Card({ symbol, price }) {
  return (
    <div style={{
      flex: 1, minWidth: 160, padding: 16, border: '1px solid #333',
      borderRadius: 12, background: '#151515'
    }}>
      <div style={{ opacity:.8, marginBottom: 6 }}>{symbol}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>
        {price == null ? '—' : `$${price.toLocaleString()}`}
      </div>
    </div>
  );
}

export default function PriceCards() {
  const [prices, setPrices] = useState({ BTC: null, ETH: null });
  const [msg, setMsg] = useState('Loading…');

  const load = async () => {
    try {
      const r = await fetch('/.netlify/functions/prices');
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || 'failed');
      setPrices(d.prices);
      setMsg('');
    } catch (e) {
      setMsg(`⚠️ ${e.message}`);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ marginTop: 12 }}>
      {msg && <div style={{ marginBottom: 8, opacity:.8 }}>{msg}</div>}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Card symbol="BTC" price={prices.BTC} />
        <Card symbol="ETH" price={prices.ETH} />
      </div>
    </div>
  );
}
