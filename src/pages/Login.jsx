// src/pages/Login.jsx
import React, { useState } from "react";
import supa from "../lib/supa"; // change if your client lives elsewhere

// Public-domain background (Valhalla-style)
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
      {/* Layers */}
      <div style={{ ...sx.layer, backgroundImage: `url(${bgUrl})`, opacity: 0.28 }} />
      <div style={{ ...sx.layer, background: "radial-gradient(60% 40% at 50% 15%, rgba(212,175,55,.10), transparent 60%)" }} />
      <div style={{ ...sx.layer, background: "linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.94) 70%, #000 100%)" }} />
      <div style={{ ...sx.layer, boxShadow: "inset 0 0 260px #000" }} />

      {/* Top ribbon – Momma Joe */}
      <div style={sx.ribbon}>
        <span role="img" aria-label="raven">🜲</span>&nbsp;
        Guided by <b>Momma Joe</b> — may his counsel steady the hand.
      </div>

      <div style={sx.content}>
        {/* Left column: crest, lore, roster, oath */}
        <section style={sx.left}>
          <div style={sx.crestWrap}><Valknut /></div>
          <h1 style={sx.title}><span style={sx.gold}>Forge</span> of Valhalla</h1>

          <p style={sx.lore}>
            Past the veil of winter and war, chosen hands gather at the anvil. This forge
            is private—oath-bound and invitation-only. The hall opens only to those named
            upon the shield wall.
          </p>

          {/* Roster */}
          <div style={sx.panel}>
            <div style={sx.panelHead}>Shield Wall</div>
            <ul style={sx.rosterList}>
              <RosterRow name="PattyCake" tag="(Patrick)" status="active" />
              <RosterRow name="The DumbAssRedneck" tag="(Taz)" status="active" />
              <RosterRow name="The Joker" tag="(Tyler)" status="reserved" />
              <RosterRow name="DoubleD" tag="(Dalton)" status="reserved" />
            </ul>
            <div style={sx.note}>
              New warriors are invited by the Jarl only. No sign-ups. No exceptions.
            </div>
          </div>

          {/* Oath / flavor */}
          <div style={sx.oath}>
            <Runes />
            <div>
              <div style={sx.oathHead}>Oath of the Forge</div>
              <div style={sx.oathText}>
                Steel before silver. Signal before noise. Loyalty before glory.
              </div>
            </div>
          </div>
        </section>

        {/* Right column: login card */}
        <section style={sx.card}>
          <div style={sx.cardHead}><span style={sx.dotLive} /> Secure Entry</div>

          <form onSubmit={handleLogin} style={{ marginTop: 12 }}>
            <label style={sx.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              style={sx.input}
              autoComplete="username"
            />

            <label style={sx.label}>Password</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              required
              style={sx.input}
              autoComplete="current-password"
            />

            <button type="submit" disabled={loading} style={sx.btn}>
              {loading ? "Opening the gates…" : "Enter Valhalla"}
            </button>

            {err && <div style={sx.err}>⚠ {err}</div>}
          </form>

          <div style={sx.smallPrint}>
            Authorized use only. Activity is logged in the mead-hall ledger.
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- Small pieces ---------- */
function RosterRow({ name, tag, status }) {
  const muted = status !== "active";
  return (
    <li style={{ ...sx.rosterItem, opacity: muted ? 0.6 : 1 }}>
      <span style={sx.badge}>{name}</span>
      <span style={sx.tag}>{tag}</span>
      <span style={{ flex: 1 }} />
      <span style={{ ...sx.status, background: muted ? "#4a1f1f" : "#1a7f37" }}>
        {muted ? "reserved" : "active"}
      </span>
    </li>
  );
}

function Valknut() {
  return (
    <svg viewBox="0 0 100 100" width="90" height="90" style={sx.crest}>
      <polygon points="50,5 93,80 7,80" fill="none" stroke="#d4af37" strokeWidth="3" />
      <polygon points="50,20 83,77 17,77" fill="none" stroke="#c0952d" strokeWidth="3" />
      <polygon points="50,35 73,74 27,74" fill="none" stroke="#8a6b1b" strokeWidth="3" />
      <defs><filter id="g"><feGaussianBlur stdDeviation="0.8" /></filter></defs>
      <polygon points="50,5 93,80 7,80" fill="none" stroke="#d4af37" strokeWidth="3" filter="url(#g)" />
    </svg>
  );
}

function Runes() {
  return (
    <svg viewBox="0 0 220 28" width="220" height="28" style={{ opacity: .9 }}>
      <text x="0" y="20" fill="#d4af37" style={{ fontFamily: "serif", letterSpacing: 4 }}>
        ᚠᛟᚱᚷᛖ · ᛟᚠ · ᚹᚨᛚᚺᚨᛚᛚᚨ
      </text>
    </svg>
  );
}

/* ---------- styles ---------- */
const gold = "#d4af37";
const goldDim = "#9a8031";
const panel = "rgba(12,12,12,.86)";
const ink = "#e6e3da";
const red = "#a4161a";

const sx = {
  page: { position: "relative", minHeight: "100vh", backgroundColor: "#000", overflow: "hidden" },
  layer: { position: "absolute", inset: 0, backgroundSize: "cover", backgroundPosition: "center", pointerEvents: "none" },

  ribbon: {
    position: "relative",
    zIndex: 3,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    margin: "14px 18px 0",
    padding: "6px 10px",
    borderRadius: 999,
    background: `linear-gradient(180deg, ${red}, #5e0d10)`,
    border: `1px solid #6f1015`,
    color: "#ffd6d6",
    fontWeight: 700,
    boxShadow: "0 12px 40px rgba(164,22,26,.35)",
  },

  content: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: 28,
    padding: "36px 22px 48px",
    maxWidth: 1120,
    margin: "0 auto",
  },

  left: { color: ink, display: "flex", flexDirection: "column", gap: 14 },

  crestWrap: {
    width: 96, height: 96, borderRadius: 18,
    background: "rgba(212,175,55,.08)",
    display: "grid", placeItems: "center",
    border: "1px solid rgba(212,175,55,.25)",
    boxShadow: "0 10px 40px rgba(0,0,0,.6)"
  },
  crest: { filter: "drop-shadow(0 0 8px rgba(212,175,55,.25))" },
  title: { fontSize: 36, margin: "6px 0 6px", letterSpacing: 0.5, color: ink, fontWeight: 800 },
  gold: { color: gold },
  lore: { color: "#ddd", lineHeight: 1.6, opacity: 0.92 },

  panel: {
    background: panel,
    border: `1px solid ${goldDim}33`,
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 12px 40px rgba(0,0,0,.5)"
  },
  panelHead: { color: gold, fontWeight: 800, marginBottom: 8, letterSpacing: 0.5 },

  rosterList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 },
  rosterItem: { display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,.05)" },
  badge: { background: `linear-gradient(180deg, ${gold}, ${goldDim})`, color: "#111", padding: "2px 8px", borderRadius: 999, fontWeight: 800, fontSize: 13 },
  tag: { color: "#a2a2a2", fontSize: 12 },
  status: { color: "#fff", padding: "2px 8px", borderRadius: 999, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 },
  note: { marginTop: 8, color: "#a6a6a6", fontSize: 12 },

  oath: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: 12,
    alignItems: "center",
    padding: "12px 12px",
    background: "rgba(212,175,55,.05)",
    border: `1px solid ${goldDim}33`,
    borderRadius: 12
  },
  oathHead: { color: gold, fontWeight: 800, marginBottom: 2, letterSpacing: .4 },
  oathText: { color: "#d3d3d3" },

  card: {
    background: panel,
    borderRadius: 16,
    border: `1px solid ${goldDim}33`,
    padding: 18,
    color: ink,
    boxShadow: "0 22px 54px rgba(0,0,0,.65)",
    alignSelf: "start"
  },
  cardHead: { display: "flex", alignItems: "center", gap: 8, fontWeight: 800, color: gold, letterSpacing: 0.6 },
  dotLive: { width: 10, height: 10, borderRadius: 999, background: "#1a7f37", boxShadow: "0 0 10px rgba(26,127,55,.8)" },

  label: { display: "block", fontSize: 12, color: "#c9c9c9", marginTop: 10, marginBottom: 6 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    background: "#0f0f0f",
    border: "1px solid #2a2a2a",
    color: ink,
    outline: "none"
  },
  btn: {
    width: "100%", marginTop: 14, padding: "10px 12px",
    borderRadius: 10, border: "1px solid #5c4616",
    background: `linear-gradient(180deg, ${gold}, ${goldDim})`,
    color: "#111", fontWeight: 900, letterSpacing: 0.4, cursor: "pointer"
  },
  err: { marginTop: 12, background: "#220000", border: `1px solid ${red}`, color: "#ffd6d6", padding: "8px 10px", borderRadius: 10 },
  smallPrint: { marginTop: 12, color: "#a0a0a0", fontSize: 12, opacity: 0.85 },

  "@media(sm)": {}
};
