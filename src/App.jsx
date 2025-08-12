import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Settings from './pages/Settings.jsx'
import Trade from './pages/Trade.jsx'

function Nav() {
  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/trade">Trade</Link>
      <Link to="/settings">Settings</Link>
    </nav>
  )
}

function Authed({ children }) {
  const [session, setSession] = useState(null)
  const nav = useNavigate()
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) nav('/login', { replace: true })
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])
  if (!session) return <div className="container">Loading…</div>
  return children
}

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <Authed>
              <Nav />
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/trade" element={<Trade />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Authed>
          }
        />
      </Routes>
    </div>
  )
}
