import React from "react";
import { supa } from "../lib/supa";

export default function Header(){
  const onSignOut = async () => {
    try{ await supa.auth.signOut(); }catch(_){}
    try{ window.location.href = "/login"; }catch(_){}
  };
  return (
    <header className="header">
      <div style={{display:"flex",gap:10,alignItems:"baseline"}}>
        <h1 style={{margin:0}}>Forge of Valhalla</h1>
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <button className="btn danger" onClick={onSignOut}>Sign out</button>
      </div>
    </header>
  );
}
