import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supa } from "../lib/supa";

export default function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supa.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supa.auth.signUp({ email, password });
        if (error) throw error;
        // After sign up, Supabase may require email confirmation depending on settings.
      }
      // On success, go home
      nav("/");
    } catch (e) {
      setErr(e.message || "Auth error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center p-6">
      <form onSubmit={handleSubmit}
        className="w-full max-w-sm bg-zinc-900 p-5 rounded-lg border border-zinc-800">
        <h2 className="text-xl font-semibold mb-4">
          {mode === "login" ? "Sign in" : "Create your account"}
        </h2>

        <label className="block text-sm mb-1">Email</label>
        <input
          type="email" required
          value={email} onChange={(e)=>setEmail(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded bg-zinc-800 outline-none"
          placeholder="you@email.com"
        />

        <label className="block text-sm mb-1">Password</label>
        <input
          type="password" required
          value={password} onChange={(e)=>setPassword(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded bg-zinc-800 outline-none"
          placeholder="••••••••"
        />

        {err && <p className="text-red-400 text-sm mb-2">{err}</p>}

        <button
          disabled={busy}
          className="w-full mb-3 px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60"
        >
          {busy ? "Please wait…" : (mode === "login" ? "Sign in" : "Create account")}
        </button>

        <p className="text-sm text-zinc-400">
          {mode === "login" ? (
            <>
              Don’t have an account?{" "}
              <button type="button" className="text-emerald-400"
                onClick={()=>setMode("signup")}>Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" className="text-emerald-400"
                onClick={()=>setMode("login")}>Sign in</button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
