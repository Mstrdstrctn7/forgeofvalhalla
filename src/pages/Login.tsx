import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supa from "../lib/supa";
export default function Login(){
  const nav=useNavigate();
  const [mode,setMode]=useState<"login"|"signup">("login");
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent){ e.preventDefault(); setErr(""); setBusy(true);
    try{
      if(mode==="login"){ const {error}=await supa.auth.signInWithPassword({email,password}); if(error) throw error; }
      else { const {error}=await supa.auth.signUp({email,password}); if(error) throw error; }
      nav("/",{replace:true});
    }catch(e:any){ setErr(e?.message||"Auth error"); } finally{ setBusy(false); }
  }
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:24}}>
      <form onSubmit={submit} style={{width:"100%",maxWidth:360,background:"#0b0b0b",padding:20,borderRadius:12,border:"1px solid #222"}}>
        <h2 style={{fontSize:20,fontWeight:600,marginBottom:12}}>{mode==="login"?"Sign in":"Create account"}</h2>
        <label style={{fontSize:12,opacity:.8}}>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required
          style={{width:"100%",marginBottom:12,padding:"10px 12px",borderRadius:10,background:"#1a1a1a",border:"1px solid #222",color:"#fff"}}/>
        <label style={{fontSize:12,opacity:.8}}>Password</label>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required
          style={{width:"100%",marginBottom:12,padding:"10px 12px",borderRadius:10,background:"#1a1a1a",border:"1px solid #222",color:"#fff"}}/>
        {err && <p style={{color:"#f87171",fontSize:12,marginBottom:8}}>{err}</p>}
        <button disabled={busy}
          style={{width:"100%",marginBottom:10,padding:"10px 12px",borderRadius:10,background:"#059669",border:"1px solid #0f766e",color:"#fff",opacity:busy?.6:1}}>
          {busy?"Please wait…":(mode==="login"?"Sign in":"Create account")}
        </button>
        <p style={{fontSize:12,opacity:.8}}>
          {mode==="login" ? <>No account? <button type="button" onClick={()=>setMode("signup")} style={{color:"#7dd3fc",background:"none",border:"none"}}>Sign up</button></>
                          : <>Have an account? <button type="button" onClick={()=>setMode("login")} style={{color:"#7dd3fc",background:"none",border:"none"}}>Sign in</button></>}
        </p>
      </form>
    </div>
  );
}
