import { daily } from "../lib/daily";
import React, { useMemo, useState } from "react";
import supa from "../lib/supa";

/** daily “Path” + “Momma Joe” quotes (rotate every 24h UTC by index) */
const PATH_QUOTES = [
  "From iron to oath, the road glows faint and true.",
  "Ash and ember mark the pilgrim’s tread.",
  "Three blows for courage, one for wisdom.",
  "Stand where sparks fall; speak when steel cools.",
];
const MOMMA_QUOTES = [
  "Guided by Momma Joe {daily("momma")}
  "By Momma Joe’s word, measure twice, strike once.",
  "Hold fast {daily("momma")}
  "Momma Joe watches the flame; we watch our aim.",
];
function dailyPick(list){
  const days = Math.floor(Date.now() / 86_400_000);
  return list[days % list.length];
}

export default function Login(){
  const pathLine = useMemo(()=>dailyPick(PATH_QUOTES),[]);
  const mommaLine = useMemo(()=>dailyPick(MOMMA_QUOTES),[]);
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [err,setErr] = useState(null);
  const [busy,setBusy] = useState(false);

  async function onSignIn(e){
    e.preventDefault();
    setErr(null); setBusy(true);
    try{
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if(error) throw error;
      // Vite SPA: redirect to dashboard
      window.location.href = "/";
    }catch(ex){
      setErr(ex?.message || String(ex));
    }finally{
      setBusy(false);
    }
  }

  return (
    <div className="fov-login">
      <div className="fov-wrap">
        {/* Momma Joe banner */}
        <div className="mj-banner" style={{marginTop:4, marginBottom:12}}>
          <span className="mj-crown" aria-hidden>👑</span>
          <strong>Guided by&nbsp;Momma&nbsp;Joe</strong>
          <span className="text-dim">{daily("momma")}</span>
        </div>

        <header className="fov-hero fov-card">
          <h1 className="fov-title"><span className="gold">Forge</span> of Valhalla</h1>
          <p className="fov-lead">
            Past the veil of winter and war, chosen hands gather at the anvil.
            This forge is private{daily("momma")}
            to those named upon the shield wall.
          </p>
          <p className="fov-lead" style={{marginTop:8}}>{pathLine}</p>
        </header>

        <main className="fov-grid" style={{marginTop:14}}>
          {/* Shield wall */}
          <section className="fov-card">
            <div className="fov-section-title">Shield Wall</div>
            <div className="fov-shield">
              <div className="fov-slot"><strong>DumbAssRedneck</strong><span className="badge ok">ACTIVE</span></div>
              <div className="fov-slot"><strong>PattyCake</strong><span className="badge ok">ACTIVE</span></div>
              <div className="fov-slot"><strong>Joker</strong><span className="badge res">RESERVED</span></div>
              <div className="fov-slot"><strong>DoubleD</strong><span className="badge res">RESERVED</span></div>
            </div>
            <p className="text-dim" style={{marginTop:10}}>
              New warriors are invited by the Jarl only. No sign-ups.
            </p>
          </section>

          {/* Oath box */}
          <aside className="fov-card">
            <div className="fov-section-title">Oath of the Forge</div>
            <div className="fov-oath">
              <div className="fov-runes">ᚠ ᚱ ᛉ ᛗ • ᚨ ᛟ • ᛈ ᚠ ᚱ ᚾ ᚠ</div>
              <ul style={{margin:0, paddingLeft:"18px", lineHeight:1.6}}>
                <li>Steel before silver.</li>
                <li>Signal before noise.</li>
                <li>Loyalty before glory.</li>
              </ul>
            </div>
          </aside>
        </main>

        {/* Auth stuck to bottom on mobile for easy reach */}
        <div className="fov-auth">
          <form className="panel" onSubmit={onSignIn}>
            <div style={{fontWeight:800, marginBottom:6}}>Sign in</div>
            <label>Email</label>
            <input type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} required />
            <div className="row">
              <div>
                <label>Password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
              </div>
              <button className="btn" type="submit" disabled={busy}>{busy ? "Signing…" : "Enter the Hall"}</button>
            </div>
            {err && <div style={{marginTop:8, color:"#ffd6d6"}}>⚠ {err}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
