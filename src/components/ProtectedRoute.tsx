import { ReactNode, useEffect, useState } from "react";
import supa from "../lib/supa";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supa.auth.getSession();
      if (!mounted) return;
      setOk(!!data.session);
      setReady(true);
    })();
    return () => { mounted = false; };
  }, []);

  if (!ready) return <div className="p-6 text-sm opacity-70">Loading…</div>;
  if (!ok) return <div className="p-6 text-amber-400">Login Required</div>;
  return <>{children}</>;
}
