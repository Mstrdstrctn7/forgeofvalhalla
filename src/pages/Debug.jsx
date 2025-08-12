import { useEffect, useState } from "react";
import supa from "../lib/supa.js";

export default function Debug(){
  const [envs, setEnvs] = useState({ url: !!import.meta.env.VITE_SUPABASE_URL, key: !!import.meta.env.VITE_SUPABASE_KEY });
  const [sess, setSess] = useState({ ok:false, err:null });
  const [tick, setTick] = useState({ ok:false, err:null, sample:null });

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supa.auth.getSession();
        if (error) setSess({ ok:false, err: error.message });
        else setSess({ ok: !!data?.session, err: null });
      } catch(e){ setSess({ ok:false, err: String(e?.message || e) }); }
    })();
    (async () => {
      try{
        const r = await fetch("/.netlify/functions/ticker", { headers: { accept:"application/json" }});
        if(!r.ok) throw new Error("HTTP "+r.status);
        const j = await r.json();
        setTick({ ok:true, err:null, sample: Array.isArray(j) ? j.slice(0,5) : j });
      }catch(e){ setTick({ ok:false, err:String(e?.message||e), sample:null }); }
    })();
  }, []);

  return (
    <div style={{padding:16,fontFamily:"system-ui, Arial", color:"#eee", background:"#111", minHeight:"100vh"}}>
      <h2 style={{margin:"0 0 8px"}}>Debug</h2>
      <div style={{opacity:.8, marginBottom:12}}>Quick checks for env, Supabase, and ticker function.</div>

      <div style={{background:"#1b1b1b",padding:12,borderRadius:8, border:"1px solid #333", marginBottom:12}}>
        <b>Env</b>
        <div>VITE_SUPABASE_URL: {envs.url ? "✅ present" : "❌ missing"}</div>
        <div>VITE_SUPABASE_KEY: {envs.key ? "✅ present" : "❌ missing"}</div>
      </div>

      <div style={{background:"#1b1b1b",padding:12,borderRadius:8, border:"1px solid #333", marginBottom:12}}>
        <b>Supabase session</b>
        <div>{sess.ok ? "✅ logged in" : "⚠ not logged / error"}</div>
        {sess.err && <div style={{color:"#f88"}}>{sess.err}</div>}
      </div>

      <div style={{background:"#1b1b1b",padding:12,borderRadius:8, border:"1px solid #333"}}>
        <b>Ticker function</b>
        <div>{tick.ok ? "✅ success" : "❌ failed"}</div>
        {tick.err && <div style={{color:"#f88"}}>{tick.err}</div>}
        {tick.sample && <pre style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(tick.sample,null,2)}</pre>}
      </div>

      <div style={{marginTop:16, opacity:.7}}>If something above is ❌, that’s likely the cause of the crash.</div>
    </div>
  );
}
