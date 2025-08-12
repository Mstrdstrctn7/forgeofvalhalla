import "./devCrashGuard";
import DebugStandalone from "./pages/DebugStandalone";
import ErrorBoundary from "./components/ErrorBoundary";
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

function Root(){
  const isDebug = typeof window !== "undefined" && window.location.pathname === "/_debug";
  return isDebug ? <DebugStandalone/> : <Root/>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary><Root/></ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
)
