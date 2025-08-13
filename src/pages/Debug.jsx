import React, { useEffect, useState } from "react";

function line(msg, ok = true){
  return (
    <div style={{display:"flex", gap:8, alignItems:"baseline"}}>
      <span style={{
        display:"inline-block", width:10, height:10, borderRadius:9999,
        background: ok ? "#1a7f37" : "#b91c1c"
      }}/>
      <code style={{opacity:.9}}>{msg}</code>
    </div>
  );
}

function typeOfRenderTarget(x){
  if (x == null) return "null/undefined";
  const t = typeof x;
  if (t !== "function" && t !== "object") return t;
  return x?.$$typeof ? "react-element-like" : t;
}

export default function Debug(){
  const [mods, setMods] = useState({});
  const [report, setReport] = useState([]);
  const [net, setNet] = useState({ ok:false, err:null, sample:null });
  const env = {
    url: !!import.meta.env.VITE_SUPABASE_URL,
    key: !!import.meta.env.VITE_SUPABASE_KEY
  };
  const versions = { react: React?.version || "?", userAgent: navigator.userAgent };

  // Load components dynamically and then run checks
  useEffect(() => {
    (async () => {
      const results = {};
      const load = async (key, path) => {
        try {
          const m = await import(path);
          results[key] = m.default ?? m[key];
        } catch {
          results[key] = undefined;
        }
      };
      await Promise.all([
        load("Header", "../components/Header"),
        load("TradingStatus", "../components/TradingStatus"),
        load("ProtectedRoute", "../components/ProtectedRoute"),
        load("Login", "../pages/Login"),
        load("CoinTable", "../components/CoinTable"),
      ]);
      setMods(results);

      const rows = [];
      const items = Object.entries(results);
      for (const [name, comp] of items){
        rows.push(`${name}: ${comp ? "present" : "MISSING"} (type=${typeOfRenderTarget(comp)})`);
      }
      for (const [name, comp] of items){
        try {
          if (!comp) throw new Error(`Import for ${name} is undefined`);
          React.createElement(comp, {}); // will throw if invalid type
        } catch (e) {
          rows.push(`⛔ createElement(${name}) failed: ${e?.message || e}`);
        }
      }
      setReport(rows);
    })();
  }, []);

  // Functions ping
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/.netlify/functions/ticker", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        setNet({ ok:true, err:null, sample: Array.isArray(j) ? j.slice(0,2) : j });
      } catch (err) {
        setNet({ ok:false, err: String(err), sample:null });
      }
    })();
  }, []);

  return (
    <div style={{padding:16, color:"#ddd", font:"14px/1.4 system-ui, Arial", background:"#0b0b0b"}}>
      <h2 style={{margin:"8px 0 12px"}}>Forge of Valhalla — Debug</h2>

      <div style={{marginBottom:14}}>
        {line(`React ${versions.react}`)}
        {line(`UA: ${versions.userAgent}`)}
        {line(`VITE_SUPABASE_URL: ${env.url ? "set" : "MISSING"}`, env.url)}
        {line(`VITE_SUPABASE_KEY: ${env.key ? "set" : "MISSING"}`, env.key)}
      </div>

      <div style={{margin:"12px 0", padding:"10px", border:"1px solid #333", borderRadius:8}}>
        <div style={{fontWeight:700, marginBottom:6}}>Component sanity</div>
        {report.map((r,i) => <div key={i} style={{margin:"2px 0"}}><code>{r}</code></div>)}
        <div style={{marginTop:10, opacity:.75}}>
          If any import above says <b>MISSING</b> or <b>createElement(...) failed</b> with
          “invalid element type”, that’s the cause of React error #62.
        </div>
      </div>

      <div style={{margin:"12px 0", padding:"10px", border:"1px solid #333", borderRadius:8}}>
        <div style={{fontWeight:700, marginBottom:6}}>Functions ping</div>
        {net.ok ? (
          <>
            {line("GET /.netlify/functions/ticker OK")}
            <pre style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(net.sample, null, 2)}</pre>
          </>
        ) : (
          <>
            {line("Ticker fetch failed", false)}
            <div><code>{net.err}</code></div>
          </>
        )}
      </div>

      <div style={{marginTop:20, opacity:.8}}>
      </div>
    </div>
  );
}
