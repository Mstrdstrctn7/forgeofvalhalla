import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  async function save() {
    setSaving(true)
    setStatus('')
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const res = await fetch('/.netlify/functions/saveKeys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ api_key: apiKey.trim(), api_secret: apiSecret.trim() })
    })
    setSaving(false)
    setStatus(res.ok ? 'Saved!' : `Error: ${await res.text()}`)
  }

  return (
    <div className="container">
      <h2 className="title">Exchange Connection</h2>
      <div className="muted" style={{marginBottom: '8px'}}>
        Your keys are stored server-side. Trading unlocks once we enable a dedicated IP.
      </div>
      <input className="input" placeholder="Crypto.com API Key"
        value={apiKey} onChange={e => setApiKey(e.target.value)} />
      <input className="input" placeholder="Crypto.com API Secret"
        value={apiSecret} onChange={e => setApiSecret(e.target.value)} />
      <button className="btn" onClick={save} disabled={!apiKey || !apiSecret || saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
      {status && <div style={{marginTop: 12}}>{status}</div>}
    </div>
  )
}
