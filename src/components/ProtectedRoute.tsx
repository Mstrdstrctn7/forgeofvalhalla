import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supa } from "../lib/supa";
export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const { data: { session } } = await supa.auth.getSession();
      if (!session) { nav("/login", { replace: true }); return; }
      setReady(true);
      const { data: sub } = supa.auth.onAuthStateChange((_e, s) => { if (!s) nav("/login", { replace: true }); });
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => unsub();
  }, [nav]);
  if (!ready) return null;
  return children;
}
