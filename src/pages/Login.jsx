// src/pages/Login.jsx
import React, { useMemo, useState } from "react";
import supa from "../lib/supa";

// === Background options (first one can be your uploaded file) ===
const bgImages = [
  "/img/valhalla-hall.jpg", // <-- add this to /public/img
  "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1600&auto=format&fit=crop",
];

// === Rotating daily quotes (edit freely) ===
const mommaJoeQuotes = [
  "Guided by Momma Joe — may his counsel steady the hand.",
  "Momma Joe watches the coals; strike true, strike once.",
  "Under Momma Joe’s eye, steel remembers its shape.",
  "When doubt creeps in, hear Momma Joe: measure twice, swing once.",
];

const pathLines = [
  "Walk the gold path: patience before profit.",
  "The anvil teaches—signal over noise, always.",
  "Hands steady, eyes clear, heart loyal.",
  "From ember to edge: craft > chance.",
];

// === Day index helper: stable per UTC day, no storage needed ===
function dayIndex(n) {
  const now = new Date();
  const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.floor(utcMidnight / 86400000);
  return ((days % n) + n) % n;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // pick today’s background + quotes
  const bgUrl = useMemo(() => bgImages[dayIndex(bgImages.length)], []);
  const mommaQuote = useMemo(() => mommaJoeQuotes[dayIndex(mommaJoeQuotes.length)], []);
  const pathQuote = useMemo(() => pathLines[dayIndex(pathLines.length)], []);

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
      <style>{css}</style>

      {/* Background layers */}
      <div className="layer bg hall" style={{ backgroundImage: `url(${bgUrl})` }} />
      {/* cool mist + vignette */}
      <div className="layer fog" />
      <div className="layer vignette" />
      <div className="layer noise" />

      {/* Momma Joe ribbon with forge pulse */}
      <div className="ribbon forgeGlow">
        <svg viewBox="0 0 24 18" width="18" height="18" style={{ marginRight: 6 }}>
          <path d="M2 14 L5 5 L12 12 L19 4 L22 14 Z" fill="#ffd6d6" opacity=".9" />
        </svg>
        <span className="ribbonText">{mommaQuote}</span>
      </div>

      {/* Content grid */}
      <div className="grid">
        <section className="left">
          <div className="crestCard">
            <CrossedAxes />
          </div>

          <h1 className="title"><span className="gold">Forge</span> of Valhalla</h1>
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

          {/* Runes + Oath */}
          <div className="runesBar"><Runes /></div>
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

        {/* Sign-in at bottom on mobile */}
        <section className="card">
          <div className="cardHead"><span className="dotLive" /> Secure Entry</div>
          <form onSubmit={handleLogin} style={{ marginTop: 12 }}>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@email.com" />
            <label className="label">Password</label>
            <input className="input" type="password" value={pw} onChange={e=>setPw(e.target.value)} required placeholder="••••••••" />
            <button className="btn" disabled={loading}>{loading ? "Opening the gates…" : "Enter Valhalla"}</button>
            {err && <div className="err">⚠ {err}</div>}
          </form>
          <div className="smallPrint">Authorized use only. Activity is recorded in the mead-hall ledger.</div>
        </section>
      </div>

      {/* Glowing gold “path” with today’s line */}
      <div className="goldPath">
        <div className="pathGlow" />
        <div className="pathText">{pathQuote}</div>
      </div>
    </div>
  );
}

/* ---- small pieces ---- */
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
function Hammer(){ return (<svg viewBox="0 0 64 64" width="40" height="40"><rect x="16" y="8" width="32" height="18" rx="3" fill="#2a2a2a" stroke="#6b5a22"/><rect x="30" y="24" width="4" height="28" rx="2" fill="#6b5a22"/></svg>); }
function Runes(){ return (<svg viewBox="0 0 360 24" width="100%" height="24"><text x="0" y="18" fill="#d4af37" style={{fontFamily:"serif",letterSpacing:5}}>ᚠᛟᚱᚷᛖ · ᛟᚠ · ᚹᚨᛚᚺᚨᛚᛚᚨ</text></svg>); }

/* ---- styles ---- */
const css = `
:root{
  --gold:#d4af37; --gold-dim:#9a8031; --ink:#e6e3da; --panel:rgba(10,10,10,.86); --red:#a4161a;
}
*{ box-sizing:border-box }
.layer{ position:absolute; inset:0; pointer-events:none }
.bg.hall{ background-size:cover; background-position:center 30%; filter:saturate(.9) contrast(1.15) brightness(.75) }
.fog{ background: radial-gradient(60% 35% at 50% 8%, rgba(200,220,255,.10), transparent 60%),
                radial-gradient(50% 30% at 50% 18%, rgba(180,210,255,.06), transparent 70%) }
.vignette{ background:linear-gradient(180deg, rgba(0,0,0,.45), rgba(0,0,0,.9) 70%, #000) }
.layer.noise{
  background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.05"/></svg>');
  mix-blend-mode:soft-light;
}

.grid{ position:relative; z-index:2; display:grid; gap:22px; grid-template-columns:1fr; padding:32px 16px 110px; max-width:980px; margin:0 auto; }
.left{ color:var(--ink); display:flex; flex-direction:column; gap:14px; order:1 }
.card{ order:2 }

@media (min-width:860px){
  .grid{ grid-template-columns:1.15fr .85fr; gap:28px; padding:40px 22px 140px }
  .card{ order:2; align-self:start }
}

.title{ font-size:36px; margin:6px 0 6px; letter-spacing:.5px; color:var(--ink); font-weight:800 }
.gold{ color:var(--gold) }
.lore{ line-height:1.6; opacity:.92 }

.crestCard{ width:96px;height:96px;border-radius:18px;background:rgba(212,175,55,.08);display:grid;place-items:center;border:1px solid rgba(212,175,55,.25); box-shadow:0 10px 40px rgba(0,0,0,.6) }
.crest{ filter: drop-shadow(0 0 8px rgba(212,175,55,.25)) }

.panel{ background:var(--panel); border:1px solid #d4af3733; border-radius:14px; padding:14px; box-shadow:0 12px 40px rgba(0,0,0,.5) }
.panelHead{ color:var(--gold); font-weight:800; margin-bottom:8px; letter-spacing:.5px }

.roster{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px }
.rosterItem{ display:flex; align-items:center; gap:10px; padding:8px 10px; background:rgba(255,255,255,.02); border-radius:10px; border:1px solid rgba(255,255,255,.05) }
.badge{ background:linear-gradient(180deg, var(--gold), var(--gold-dim)); color:#111; padding:4px 10px; border-radius:999px; font-weight:900; font-size:13px }
.status{ color:#fff; padding:3px 9px; border-radius:999px; font-size:11px; text-transform:uppercase; letter-spacing:.6px }
.note{ margin-top:8px; color:#a6a6a6; font-size:12px }

.runesBar{ margin-top:8px; padding:10px 12px; border:1px solid #d4af3726; border-radius:10px; background:rgba(212,175,55,.04) }
.oath{ margin-top:12px; display:grid; grid-template-columns:auto 1fr; gap:12px; align-items:center; padding:12px; background:rgba(212,175,55,.05); border:1px solid #d4af3726; border-radius:12px }
.oathHead{ color:var(--gold); font-weight:800; margin-bottom:2px; letter-spacing:.4px }
.oathText{ color:#d3d3d3 }

.card{ background:var(--panel); border-radius:16px; border:1px solid #d4af3726; padding:18px; color:var(--ink); box-shadow:0 22px 54px rgba(0,0,0,.65) }
.cardHead{ display:flex; align-items:center; gap:8px; font-weight:800; color:var(--gold); letter-spacing:.6px }
.dotLive{ width:10px;height:10px;border-radius:999px;background:#1a7f37; box-shadow:0 0 10px rgba(26,127,55,.8); display:inline-block }
.label{ display:block; font-size:12px; color:#c9c9c9; margin-top:10px; margin-bottom:6px }
.input{ width:100%; padding:10px 12px; border-radius:10px; background:#0f0f0f; border:1px solid #2a2a2a; color:var(--ink) }
.btn{ width:100%; margin-top:14px; padding:10px 12px; border-radius:10px; border:1px solid #5c4616; background:linear-gradient(180deg, var(--gold), var(--gold-dim)); color:#111; font-weight:900; letter-spacing:.4px; cursor:pointer }
.err{ margin-top:12px; background:#220000; border:1px solid var(--red); color:#ffd6d6; padding:8px 10px; border-radius:10px }
.smallPrint{ margin-top:12px; color:#a0a0a0; font-size:12px; opacity:.85 }

/* Momma Joe ribbon animation */
.ribbon{ position:relative; z-index:3; display:inline-flex; align-items:center; gap:10px; margin:14px 16px 0; padding:10px 14px; border-radius:999px; border:1px solid #6f1015; color:#ffd6d6; font-weight:800; overflow:hidden; }
.ribbonText{ position:relative; z-index:2 }
.forgeGlow{ background: linear-gradient(90deg, #661214, #a4161a, #d4af37, #a4161a, #661214); background-size: 300% 100%; animation: ribbonShift 9s linear infinite, ribbonPulse 2.4s ease-in-out infinite; box-shadow:0 12px 40px rgba(164,22,26,.35) }
.forgeGlow::after{ content:""; position:absolute; inset:0; pointer-events:none; background: radial-gradient(6px 6px at 22% 40%, rgba(212,175,55,.55), transparent 60%), radial-gradient(4px 4px at 70% 20%, rgba(255,200,120,.35), transparent 60%), radial-gradient(5px 5px at 42% 70%, rgba(255,170,90,.35), transparent 60%); mix-blend-mode:screen; filter:blur(.2px) }
@keyframes ribbonShift { from{background-position:0% 0} to{background-position:100% 0} }
@keyframes ribbonPulse { 0%,100%{filter:saturate(1)} 50%{filter:saturate(1.15)} }

/* Glowing path at bottom */
.goldPath{
  position:fixed; left:0; right:0; bottom:0; height:140px; pointer-events:none; z-index:1;
  display:grid; place-items:center; color:#e7d7a8;
}
.pathGlow{
  position:absolute; inset:0;
  background:
    radial-gradient(60% 120% at 50% 140%, rgba(212,175,55,.45), transparent 60%),
    radial-gradient(20% 40% at 50% 0%, rgba(255,180,90,.15), transparent 50%);
  filter: blur(6px);
  animation: pathPulse 4.5s ease-in-out infinite;
}
.pathText{
  position:relative; font-weight:800; letter-spacing:.6px; text-shadow: 0 0 8px rgba(212,175,55,.35);
}
@keyframes pathPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
`;

const sx = { page: { position: "relative", minHeight: "100vh", background: "#000", overflow: "hidden" } };
