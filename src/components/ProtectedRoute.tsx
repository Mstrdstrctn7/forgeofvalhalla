import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supa from "../lib/supa";
export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const nav = useNavigate(); const [ok,setOk]=useState<boolean|null>(null);
  useEffect(()=>{ let unsub=()=>{};
    (async()=>{
      const { data:{ session } } = await supa.auth.getSession();
      if (!session) { setOk(false); nav("/login", { replace:true }); return; }
      setOk(true);
      const { data: sub } = supa.auth.onAuthStateChange((_e,s)=>{ if(!s){ setOk(false); nav("/login",{replace:true}); } });
      unsub = ()=>sub.subscription.unsubscribe();
    })(); return ()=>unsub();
  },[nav]);
  if (ok===null) return null; return children;
}
