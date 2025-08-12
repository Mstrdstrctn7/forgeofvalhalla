import FocusCoin from "../components/FocusCoin";
import React, { useEffect, useState } from 'react'

export default function Dashboard() {
  const [rows, setRows] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    fetch('/.netlify/functions/ticker')
      .then(r => r.json())
      .then(setRows)
      .catch(e => setErr(e.message))
  }, [])

  return (
    <div className="container">
      <h2 className="title">Live Prices</h2>
      {err && <div className="error">{err}</div>}
      {!rows && !err && <div>Loading…</div>}
      {rows && rows.map(r => (
        <div key={r.symbol} className="card">
          <div className="muted">{r.symbol}</div>
          <div className="big">{r.last}</div>
          <div className="muted">24h: {r.change} • H {r.high} • L {r.low} • Vol {r.vol}</div>
        </div>
      ))}
    </div>
  )
}
