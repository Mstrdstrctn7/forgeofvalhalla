import React, { useMemo } from "react";

/**
 * Forge of Valhalla — Login (mobile-first)
 * - Background: public/valhalla-hall.jpg (full-bleed, covered, darkened)
 * - Momma Joe banner with gold↔deep-red forge glow
 * - Lore intro
 * - Shield Wall (nicknames only; PattyCake & DumbAssRedneck switched)
 * - Oath panel
 * - Sign-in form pinned to bottom; NO sign-up
 */

const WALL = [
  { handle: "DumbAssRedneck" }, // (Patrick)
  { handle: "PattyCake" },      // (Taz)
  { handle: "Joker" },          // (Tyler)
  { handle: "DoubleD" },        // (Dalton)
];

export default function Login() {
  // simple daily “path” line tied to date (stable per 24h)
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

  return (
    <div className="valhalla-wrap">
      {/* background image + dark vignette */}
      <div className="vh-bg" />
      <div className="vh-vignette" />

      {/* top “Momma Joe” banner */}
      <div className="vh-banner">
        <span className="vh-crown" aria-hidden>👑</span>
        <span className="vh-banner-text">
          Guided by <strong>Momma Joe</strong> — may his counsel steady the hand.
        </span>
      </div>

      {/* content column */}
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

        {/* Shield Wall */}
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

        {/* Oath */}
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

      {/* Sign-in: pinned low; no sign-up */}
      <form className="vh-login" onSubmit={(e) => e.preventDefault()}>
        <h4 className="vh-login-title">Sign in</h4>
        <input
          type="email"
          placeholder="you@email.com"
          className="vh-input"
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Password"
          className="vh-input"
          autoComplete="current-password"
        />
        <button type="submit" className="vh-btn">Enter the Hall</button>
      </form>
    </div>
  );
}
