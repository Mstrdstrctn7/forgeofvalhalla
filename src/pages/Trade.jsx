import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

const TRADING_ENABLED = String(import.meta.env.VITE_ENABLE_TRADING) === 'true'

export default function Trade() {
  const [symbol, setSymbol] = useState('BTC_USDT')
  const [side, setSide] = useState('BUY')
  const [type, setType] = useState('MARKET')
  const [qty, setQty] = useState('0.0001')
  const [price, setPrice] = useState('')
  const [status, setStatus] = useState('')

  async function placeOrder(e) {
    e.preventDefault()
    if (!TRADING_ENABLED) {
      alert('Trading will be enabled once we flip on the dedicated IP. Your settings are saved.')
      return
    }
    setStatus('Placing order…')
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const res = await fetch('/.netlify/functions/createOrder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ symbol, side, type, quantity: qty, price })
    })
    const json = await res.json().catch(()=>null)
    setStatus(res.ok ? JSON.stringify(json) : `Error: ${await res.text()}`)
  }

  async function loadBalances() {
    if (!TRADING_ENABLED) { setStatus('Trading disabled'); return }
    setStatus('Loading balances…')
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const res = await fetch('/.netlify/functions/accountSummary', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const json = await res.json().catch(()=>null)
    setStatus(res.ok ? JSON.stringify(json) : `Error: ${await res.text()}`)
  }

  return (
    <div className="container">
      <h2 className="title">Trade {TRADING_ENABLED ? '' : '(Standby)'} </h2>
      <form onSubmit={placeOrder}>
        <select className="select" value={symbol} onChange={e=>setSymbol(e.target.value)}>
          <option>BTC_USDT</option>
          <option>ETH_USDT</option>
        </select>
        <select className="select" value={side} onChange={e=>setSide(e.target.value)}>
          <option>BUY</option>
          <option>SELL</option>
        </select>
        <select className="select" value={type} onChange={e=>setType(e.target.value)}>
          <option>MARKET</option>
          <option>LIMIT</option>
        </select>
        {type === 'LIMIT' && (
          <input className="input" placeholder="Limit price" value={price} onChange={e=>setPrice(e.target.value)} />
        )}
        <input className="input" placeholder="Quantity" value={qty} onChange={e=>setQty(e.target.value)} />
        <button className="btn">{TRADING_ENABLED ? 'Place Order' : 'Place Order (disabled)'}</button>
      </form>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button className="btn" onClick={loadBalances}>Load Balances</button>
      </div>

      {status && <div className="card" style={{ marginTop: 12, wordBreak: 'break-word' }}>{status}</div>}
      {!TRADING_ENABLED && <div className="muted" style={{ marginTop: 8 }}>
        Trading will activate once we route through a dedicated/static IP and set VITE_ENABLE_TRADING=true.
      </div>}
    </div>
  )
}
