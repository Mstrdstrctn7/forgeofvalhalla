import React, { useEffect, useState } from "react";
import { supa } from "../lib/supa";

export default function TradingStatus(){
  const [loggedIn, setLoggedIn] = useState(false);
  const [fnOK, setFnOK] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supa.auth.getSession();
        setLoggedIn(!!data?.session);
      } catch { setLoggedIn(false); }
    })();
    (async () => {
      try{
        const r = await fetch("/.netlify/functions/ticker", { cache:"no-store" });
        setFnOK(r.ok);
      }catch{ setFnOK(false); }
    })();
  }, []);

  return (
    <div style={{display:"flex",gap:8,alignItems:"center"}}>
      <span className="badge">
        <span className={`dot ${loggedIn ? "ok" : "warn"}`} />
        {loggedIn ? "Signed In" : "Login Required"}
      </span>
      <span className="badge" title="Netlify Functions">
        <span className={`dot ${fnOK ? "ok" : "err"}`} />
        {fnOK ? "Endpoints OK" : "Endpoint Error"}
      </span>
    </div>
  );
}
