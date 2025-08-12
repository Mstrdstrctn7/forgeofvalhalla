import React, { useState } from "react";
import { supa } from "../lib/supa";

export default function Login(){
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [err,setErr] = useState("");

  const onSubmit = async(e)=>{
    e.preventDefault();
    setErr("");
    try{
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = "/";
    }catch(ex){ setErr(ex.message || String(ex)); }
  };

  return (
    <div className="container">
      <div className="card" style={{maxWidth:420, margin:"40px auto"}}>
        <h2 style={{marginTop:0}}>Sign in</h2>
        <form onSubmit={onSubmit} className="vstack" style={{display:"grid",gap:10}}>
          <input className="input" type="email" placeholder="you@email.com"
                 value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password"
                 value={password} onChange={e=>setPassword(e.target.value)} required />
          {err && <div style={{color:"var(--err)"}}>{err}</div>}
          <button className="btn primary" type="submit">Sign in</button>
        </form>
      </div>
    </div>
  );
}
