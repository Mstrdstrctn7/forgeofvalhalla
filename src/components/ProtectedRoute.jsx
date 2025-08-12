import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supa from "../lib/supa";

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      // initial check
      const { data: { session } } = await supa.auth.getSession();
      if (!session) {
        navigate("/login", { replace: true });
        setChecking(false);
        return;
      }
      setChecking(false);

      // keep watching auth state
      const { data: sub } = supa.auth.onAuthStateChange((_evt, sess) => {
        if (!sess) navigate("/login", { replace: true });
      });
      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => unsub();
  }, [navigate]);

  if (checking) return null; // or a spinner
  return children;
}
