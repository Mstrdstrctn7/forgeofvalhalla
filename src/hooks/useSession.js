import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

/**
 * Tracks the current Supabase session.
 * - session: the Supabase session object, or null
 * - loading: true until initial session fetch completes
 */
export default function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1) Fetch current session on mount
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    // 2) Listen for changes in auth state
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, s) => setSession(s));

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return { session, loading };
}
