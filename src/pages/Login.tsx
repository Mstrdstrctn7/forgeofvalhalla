import { useEffect, useState } from "react";
import { supabase } from "../lib/supa";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.access_token) nav("/", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  async function send() {
    setErr(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Forge of Valhalla</h1>
      {sent ? (
        <p className="text-sm text-gray-400">Magic link sent. Check your email and return here.</p>
      ) : (
        <>
          <input
            className="w-full rounded-xl px-3 py-3 bg-black/20 border border-white/10 outline-none"
            placeholder="you@email.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={send}
            className="w-full rounded-xl px-4 py-3 bg-white/10 hover:bg-white/20 transition"
          >
            Send magic link
          </button>
          {err && <div className="text-red-500 text-sm">{err}</div>}
        </>
      )}
    </div>
  );
}
