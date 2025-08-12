import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supa from "../lib/supa";
import { daily } from "../lib/daily";

export default function Login(){
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw]     = useState("");
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");

  async function onSubmit(e){
    e.preventDefault();
    setErr(""); setBusy(true);
    try{
      const { error } = await supa.auth.signInWithPassword({ email, password: pw });
      if (error) throw error;
      nav("/dashboard");
    }catch(e){
      setErr(String(e.message || e));
    }finally{
      setBusy(false);
    }
  }

  const oath = daily("oath");

  return (
    <div className="container login-page" style={{padding:"16px 14px 28px"}}>
      {/* Momma Joe banner */}
      <div className="pill momma glow">
        <span className="emoji">👑</span>
        <span className="pill-title">Guided by Momma Joe</span>
        <span className="pill-rest">{daily("momma")}</span>
      </div>

      {/* Forge intro */}
      <div className="fov-card forge-hero" style={{marginTop:12}}>
        <h1 className="fov-title"><span className="gold">Forge</span> of Valhalla</h1>
        <p className="fov-lead">
          {daily("forge")}
        </p>
      </div>

      {/* Shield wall (no signups, invite only) */}
      <div className="fov-card" style={{marginTop:16}}>
        <h2 className="fov-h2">Shield Wall</h2>

        <div className="shield-row">
          <div className="shield-name">DumbAssRedneck</div>
          <div className="badge ok">ACTIVE</div>
        </div>
        <div className="shield-row">
          <div className="shield-name">PattyCake</div>
          <div className="badge ok">ACTIVE</div>
        </div>
        <div className="shield-row">
          <div className="shield-name">Joker</div>
          <div className="badge hold">RESERVED</div>
        </div>
        <div className="shield-row">
          <div className="shield-name">DoubleD</div>
          <div className="badge hold">RESERVED</div>
        </div>

        <p className="muted" style={{marginTop:12}}>
          New warriors are invited by the Jarl only. No sign-ups.
        </p>
      </div>

      {/* Oath of the Forge */}
      <div className="fov-card" style={{marginTop:16}}>
        <h2 className="fov-h2">Oath of the Forge</h2>
        <div className="runes">ᛟ ᚱ ᚢ ᛗ • ᚠ ᚱ • ᛞ ᚠ ᚱ</div>
        <ul className="oath">
          {oath.map((line,i)=>(<li key={i}>{line}</li>))}
        </ul>
      </div>

      {/* Sign in */}
      <div className="fov-card" style={{marginTop:16, marginBottom:12}}>
        <h3 className="fov-h3">Sign in</h3>
        <form onSubmit={onSubmit} className="signin">
          <label>Email</label>
          <input type="email" required placeholder="you@email.com"
                 value={email} onChange={e=>setEmail(e.target.value)} />

          <label>Password</label>
          <div className="row">
            <input type="password" required placeholder="••••••••"
                   value={pw} onChange={e=>setPw(e.target.value)} />
            <button className="btn gold" disabled={busy}>
              {busy ? "Entering…" : "Enter the Hall"}
            </button>
          </div>
          {err && <div className="err">{err}</div>}
        </form>
      </div>
    </div>
  );
}
