// src/pages/Login.jsx
import React, { useState } from "react";
import supa from "../lib/supa";

// public-domain Valhalla painting
const bgUrl =
  "https://upload.wikimedia.org/wikipedia/commons/9/94/Valhalla_by_Max_Br%C3%BCckner_1896.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supa.auth.signInWithPassword({ email, password: pw });
      if (error) throw error;
      window.location.href = "/dashboard";
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={sx.page}>
      {/* one tiny stylesheet for animations & responsive layout */}
      <style>{css}</style>

      {/* Layers */}
      <div className="layer" style={{ backgroundImage: `url(${bgUrl})`, opacity: .26 }} />
      <div className="layer" style={{ background: "radial-gradient(60% 40% at 50% 15%, rgba(212,175,55,.08), transparent 60%)" }} />
      <div className="layer noise" />
      <div className="layer" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.94) 70%, #000)" }} />

      {/* Forge ribbon – animated glow */}
      <div className="ribbon forgeGlow">
        <Crown />
        <span className="ribbonText">
          Guided by <b>Momma Joe</b> — may his counsel steady the hand.
        </span>
      </div>

      {/* Content grid (1 col on mobile). Card is ordered last on mobile. */}
      <div className="grid">
        {/* Crest + Lore + Roster + Oath */}
        <section className="left">
          <div className="crestCard">
            <CrossedAxes />
          </div>

          <h1 className="title">
            <span className="gold">Forge</span> of Valhalla
          </h1>

          <p className="lore">
            Past the veil of winter and war, chosen hands gather at the anvil.
            This forge is private—oath-bound and invitation-only. The hall opens
            only to those named upon the shield wall.
          </p>

          {/* Roster */}
          <div className="panel">
            <div className="panelHead">Shield Wall</div>
            <ul className="roster">
              <RosterRow name="PattyCake" status="active" />
              <RosterRow name="The DumbAssRedneck" status="active" />
              <RosterRow name="The Joker" status="reserved" />
              <RosterRow name="DoubleD" status="reserved" />
            </ul>
            <div className="note">New warriors are invited by the Jarl only. No sign-ups. No exceptions.</div>
          </div>

          {/* Runes bar */}
          <div className="runesBar">
            <Runes />
          </div>

          {/* Oath – compact & mobile-friendly */}
          <div className="oath">
            <Hammer />
            <div>
              <div className="oathHead">Oath of the Forge</div>
              <div className="oathText">
                Steel before silver. Signal before noise. Loyalty before glory.
              </div>
            </div>
          </div>
        </section>

        {/* Sign-in card (bottom on mobile) */}
        <section className="card">
          <div className="cardHead"><span className="dotLive" /> Secure Entry</div>

          <form onSubmit={handleLogin} style={{ marginTop: 12 }}>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className="input"
              autoComplete="username"
            />

            <label className="label">Password</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              required
              className="input"
              autoComplete="current-password"
            />

            <button type="submit" disabled={loading} className="btn">
              {loading ? "Opening the gates…" : "Enter Valhalla"}
            </button>

            {err && <div className="err">⚠ {err}</div>}
          </form>

          <div className="smallPrint">
            Authorized use only. Activity is recorded in the mead-hall ledger.
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------- Pieces ---------------- */
function RosterRow({ name, status }) {
  const muted = status !== "active";
  return (
    <li className="rosterItem" style={{ opacity: muted ? 0.6 : 1 }}>
      <span className="badge">{name}</span>
      <span style={{ flex: 1 }} />
      <span className="status" style={{ background: muted ? "#4a1f1f" : "#1a7f37" }}>
        {muted ? "reserved" : "active"}
      </span>
    </li>
  );
}

function CrossedAxes() {
  return (
    <svg viewBox="0 0 128 128" width="86" height="86" className="crest">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#d4af37" />
          <stop offset="1" stopColor="#9a8031" />
        </linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="1.2" /></filter>
      </defs>
      <path d="M22 102 L64 60 L106 102" stroke="url(#g)" strokeWidth="6" fill="none" />
      <path d="M40 26 l18 18 -36 36" stroke="url(#g)" strokeWidth="6" fill="none" />
      <path d="M88 26 l-18 18 36 36" stroke="url(#g)" strokeWidth="6" fill="none" />
      <circle cx="64" cy="60" r="44" stroke="url(#g)" strokeWidth="3" fill="none" filter="url(#soft)" />
    </svg>
  );
}

function Hammer() {
  return (
    <svg viewBox="0 0 64 64" width="40" height="40">
      <rect x="16" y="8" width="32" height="18" rx="3" fill="#2a2a2a" stroke="#6b5a22" />
      <rect x="30" y="24" width="4" height="28" rx="2" fill="#6b5a22" />
    </svg>
  );
}

function Crown() {
  return (
    <svg viewBox="0 0 24 18" width="18" height="18" style={{ marginRight: 6 }}>
      <path d="M2 14 L5 5 L12 12 L19 4 L22 14 Z" fill="#ffd6d6" opacity=".85" />
    </svg>
  );
}

function Runes() {
  return (
    <svg viewBox="0 0 360 24" width="100%" height="24">
      <text x="0" y="18" fill="#d4af37" style={{ fontFamily: "serif", letterSpacing: 5 }}>
        ᚠᛟᚱᚷᛖ · ᛟᚠ · ᚹᚨᛚᚺᚨᛚᛚᚨ
      </text>
    </svg>
  );
}

/* ---------------- Styles ---------------- */
const css = `
:root{
  --gold:#d4af37; --gold-dim:#9a8031; --ink:#e6e3da; --panel:rgba(12,12,12,.86); --red:#a4161a;
}
*{ box-sizing:border-box }
.layer{ position:absolute; inset:0; background-size:cover; background-position:center; pointer-events:none }
.layer.noise {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.05"/></svg>');
  mix-blend-mode:soft-light;
}

.grid{
  position:relative; z-index:2;
  display:grid; gap:22px;
  grid-template-columns:1fr; padding:32px 16px 42px; max-width:980px; margin:0 auto;
}
.left{ color:var(--ink); display:flex; flex-direction:column; gap:14px; order:1 }
.card{ order:2 } /* on mobile, card appears at bottom */

@media (min-width:860px){
  .grid{ grid-template-columns:1.15fr .85fr; gap:28px; padding:40px 22px 60px }
  .left{ order:1 }
  .card{ order:2; align-self:start }
}

.title{ font-size:36px; margin:6px 0 6px; letter-spacing:.5px; color:var(--ink); font-weight:800 }
.gold{ color:var(--gold); }
.lore{ line-height:1.6; opacity:.92 }

.crestCard{
  width:96px;height:96px;border-radius:18px;
  background:rgba(212,175,55,.08);display:grid;place-items:center;
  border:1px solid rgba(212,175,55,.25); box-shadow:0 10px 40px rgba(0,0,0,.6)
}
.crest{ filter: drop-shadow(0 0 8px rgba(212,175,55,.25)) }

.panel{
  background:var(--panel); border:1px solid #d4af3733; border-radius:14px; padding:14px;
  box-shadow:0 12px 40px rgba(0,0,0,.5)
}
.panelHead{ color:var(--gold); font-weight:800; margin-bottom:8px; letter-spacing:.5px }

.roster{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px }
.rosterItem{ display:flex; align-items:center; gap:10px; padding:8px 10px; background:rgba(255,255,255,.02); border-radius:10px; border:1px solid rgba(255,255,255,.05) }
.badge{ background:linear-gradient(180deg, var(--gold), var(--gold-dim)); color:#111; padding:4px 10px; border-radius:999px; font-weight:900; font-size:13px }
.status{ color:#fff; padding:3px 9px; border-radius:999px; font-size:11px; text-transform:uppercase; letter-spacing:.6px }
.note{ margin-top:8px; color:#a6a6a6; font-size:12px }

.runesBar{ margin-top:8px; padding:10px 12px; border:1px solid #d4af3726; border-radius:10px; background:rgba(212,175,55,.04) }

.oath{
  margin-top:12px; display:grid; grid-template-columns:auto 1fr; gap:12px; align-items:center;
  padding:12px; background:rgba(212,175,55,.05); border:1px solid #d4af3726; border-radius:12px
}
.oathHead{ color:var(--gold); font-weight:800; margin-bottom:2px; letter-spacing:.4px }
.oathText{ color:#d3d3d3 }

.card{
  background:var(--panel); border-radius:16px; border:1px solid #d4af3726; padding:18px; color:var(--ink);
  box-shadow:0 22px 54px rgba(0,0,0,.65)
}
.cardHead{ display:flex; align-items:center; gap:8px; font-weight:800; color:var(--gold); letter-spacing:.6px }
.dotLive{ width:10px; height:10px; border-radius:999px; background:#1a7f37; box-shadow:0 0 10px rgba(26,127,55,.8); display:inline-block }

.label{ display:block; font-size:12px; color:#c9c9c9; margin-top:10px; margin-bottom:6px }
.input{ width:100%; padding:10px 12px; border-radius:10px; background:#0f0f0f; border:1px solid #2a2a2a; color:var(--ink); outline:none }
.btn{
  width:100%; margin-top:14px; padding:10px 12px; border-radius:10px; border:1px solid #5c4616;
  background:linear-gradient(180deg, var(--gold), var(--gold-dim)); color:#111; font-weight:900; letter-spacing:.4px; cursor:pointer
}
.err{ margin-top:12px; background:#220000; border:1px solid var(--red); color:#ffd6d6; padding:8px 10px; border-radius:10px }
.smallPrint{ margin-top:12px; color:#a0a0a0; font-size:12px; opacity:.85 }

.ribbon{
  position:relative; z-index:3; display:inline-flex; align-items:center; gap:10px;
  margin:14px 16px 0; padding:10px 14px; border-radius:999px;
  border:1px solid #6f1015; color:#ffd6d6; font-weight:800; box-shadow:0 12px 40px rgba(164,22,26,.35);
  overflow:hidden;
}
.ribbonText{ position:relative; z-index:2 }
.forgeGlow{
  background: linear-gradient(90deg, #801313, #a4161a, #d4af37, #a4161a, #801313);
  background-size: 300% 100%;
  animation: ribbonShift 9s linear infinite, ribbonPulse 2.4s ease-in-out infinite;
}
.forgeGlow::after{
  /* sparks / embers */
  content:""; position:absolute; inset:0; pointer-events:none;
  background: radial-gradient(6px 6px at 22% 40%, rgba(212,175,55,.55), transparent 60%),
              radial-gradient(4px 4px at 70% 20%, rgba(255,200,120,.35), transparent 60%),
              radial-gradient(5px 5px at 42% 70%, rgba(255,170,90,.35), transparent 60%);
  mix-blend-mode:screen; filter:blur(.2px);
}
@keyframes ribbonShift { from{background-position:0% 0} to{background-position:100% 0} }
@keyframes ribbonPulse {
  0%,100% { box-shadow:0 12px 40px rgba(164,22,26,.35); filter: saturate(1); }
  50%     { box-shadow:0 18px 60px rgba(212,175,55,.45); filter: saturate(1.15); }
}
`;

const sx = {
  page: { position: "relative", minHeight: "100vh", background: "#000", overflow: "hidden" }
};
