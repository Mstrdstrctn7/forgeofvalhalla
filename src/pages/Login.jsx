import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supa } from "../lib/supa";

const WALL = [
  { handle: "DumbAssRedneck" },
  { handle: "PattyCake" },
  { handle: "Joker" },
  { handle: "DoubleD" },
];

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pathLine = useMemo(() => {
    const paths = [
      "A golden path burns through the frost.",
      "Cinders mark the way; step with purpose.",
      "From iron to oath, the road glows faint and true.",
      "Ash rides the wind—the anvil waits ahead.",
      "Steel remembers every footfall upon it.",
      "The hall breathes, the coals answer."
    ];
    const day = Math.floor(Date.now() / 86400000);
    return paths[day % paths.length];
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setErr("");
    if (!email || !pass) { setErr("Enter email and password."); return; }
    try {
      setBusy(true);
      const { error } = await supa.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      nav("/", { replace: true });
    } catch (ex) {
      setErr(ex?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="valhalla-wrap">
      <div className="vh-bg" />
      <div className="vh-vignette" />
      <div className="vh-banner">
        <span className="vh-crown" aria-hidden>👑</span>
        <span className="vh-banner-text">
          Guided by <strong>Momma Joe</strong> — may his counsel steady the hand.
        </span>
      </div>
      <main className="vh-main">
        <header className="vh-hero">
          <div className="vh-mark" aria-hidden />
          <h1 className="vh-title">
            <span className="vh-title-gold">Forge</span> of Valhalla
          </h1>
          <p className="vh-lede">
            Past the veil of winter and war, chosen hands gather at the anvil.
            This forge is private—oathbound and invitation-only. The hall opens
            only to those named upon the shield wall.
          </p>
          <p className="vh-path">{pathLine}</p>
        </header>
        <section className="vh-card vh-wall">
          <h2 className="vh-h2">Shield Wall</h2>
          <div className="vh-wall-grid">
            {WALL.map((w, i) => (
              <div key={w.handle + i} className="vh-badge">
                <div className="vh-badge-inner">
                  <div className="vh-badge-chip">{w.handle}</div>
                  <div className={`vh-status ${i < 2 ? "ok" : "hold"}`}>
                    {i < 2 ? "ACTIVE" : "RESERVED"}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="vh-note">New warriors are invited by the Jarl only. No sign-ups.</p>
        </section>
        <section className="vh-card vh-oath">
          <h3 className="vh-h3">Oath of the Forge</h3>
          <div className="vh-oath-body">
            <div className="vh-runes" aria-hidden>ᚠ ᚱ ᚨ ᚷ ᛟ • ᛋ ᛁ ᚷ ᚾ ᚨ ᛚ</div>
            <ul className="vh-oath-lines">
              <li>Steel before silver.</li>
              <li>Signal before noise.</li>
              <li>Loyalty before glory.</li>
            </ul>
          </div>
        </section>
      </main>
      <form className="vh-login" onSubmit={handleLogin}>
        <h4 className="vh-login-title">Sign in</h4>
        {err && <div className="vh-err">{err}</div>}
        <input
          type="email"
          placeholder="you@email.com"
          className="vh-input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Password"
          className="vh-input"
          value={pass}
          onChange={e => setPass(e.target.value)}
          autoComplete="current-password"
        />
        <button type="submit" className="vh-btn" disabled={busy}>
          {busy ? "Entering…" : "Enter the Hall"}
        </button>
      </form>
    </div>
  );
}
