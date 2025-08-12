import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    setLoading(false)
    alert(error ? error.message : 'Check your email for the magic link.')
  }

  return (
    <div className="container" style={{maxWidth: 420, margin: '0 auto'}}>
      <h1 className="title">Forge of Valhalla</h1>
      <input className="input" placeholder="you@email.com"
        value={email} onChange={e => setEmail(e.target.value)} />
      <button className="btn" disabled={!email || loading} onClick={signIn}>
        {loading ? 'Sending…' : 'Send magic link'}
      </button>
    </div>
  )
}
