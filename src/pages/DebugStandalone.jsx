import React, { useEffect, useState } from "react";

function Dot({ ok }) {
  return (
    <span style={{
      display:"inline-block", width:10, height:10, borderRadius:9999,
      background: ok ? "#1a7f37" : "#b91c1c", marginRight:8
    }}/>
  );
}

export default function DebugStandalone(){
  const [env] = useState({
    VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_KEY: !!import.meta.env.VITE_SUPABASE_KEY,
  });
  const [net, setNet] = useState({ ok:false, err:null, sample:null });

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/.netlify/functions/ticker", { cache: "no-store" });
        if (!r.ok) throw new Error("HTTP " + r.status);
        const j = await r.json();
        setNet({ ok:true, err:null, sample: Array.isArray(j) ? j.slice(0,2) : j });
      } catch (e) {
        setNet({ ok:false, err:String(e), sample:null });
      }
    })();
  }, []);

  return (
    <div style={{padding:16, color:"#ddd", font:"14px/1.45 system-ui, Arial", background:"#0b0b0b", minHeight:"100vh"}}>
      <h2 style={{margin:"8px 0 12px"}}>Forge of Valhalla — Debug (stand-alone)</h2>

      <div style={{marginBottom:14}}>
        <div><Dot ok={true}/>React {React.version}</div>
        <div style={{opacity:.9, marginTop:4}}><code>{navigator.userAgent}</code></div>
      </div>

      <div style={{margin:"12px 0", padding:"10px", border:"1px solid #333", borderRadius:8}}>
        <div style={{fontWeight:700, marginBottom:6}}>Environment</div>
        <div><Dot ok={env.VITE_SUPABASE_URL}/>VITE_SUPABASE_URL {env.VITE_SUPABASE_URL ? "set" : "MISSING"}</div>
        <div><Dot ok={env.VITE_SUPABASE_KEY}/>VITE_SUPABASE_KEY {env.VITE_SUPABASE_KEY ? "set" : "MISSING"}</div>
      </div>

      <div style={{margin:"12px 0", padding:"10px", border:"1px solid #333", borderRadius:8}}>
        <div style={{fontWeight:700, marginBottom:6}}>Functions ping</div>
        {net.ok ? (
          <>
            <div><Dot ok={true}/>GET /.netlify/functions/ticker OK</div>
            <pre style={{whiteSpace:"pre-wrap", marginTop:8}}>{JSON.stringify(net.sample, null, 2)}</pre>
          </>
        ) : (
          <>
            <div><Dot ok={false}/>Ticker fetch failed</div>
            <div style={{opacity:.85, marginTop:6}}><code>{net.err || "(no error text)"}</code></div>
          </>
        )}
      </div>

      <div style={{marginTop:20, opacity:.8}}>
        This page renders without your app’s router/components. If this loads
        while <code>/</code> still crashes, the issue is inside App/routes/components,
        not with Vite/Netlify.
      </div>
    </div>
  );
}
