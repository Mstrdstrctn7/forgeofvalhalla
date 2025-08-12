import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import Ticker from "./components/Ticker";
import TradingStatus from "./components/TradingStatus";
import Login from "./pages/Login";
import { supabase, type Session } from "./lib/supa";

function Home() {
  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <Header />
      <Ticker />
    </div>
  );
}

function Header() {
  const [session, setSession] = useState<Session>(null);
  const nav = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    nav("/", { replace: true });
  }

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold"><Link to="/">Forge of Valhalla</Link></h1>
      <div className="flex items-center gap-3">
        <TradingStatus />
        {session ? (
          <button onClick={logout} className="text-sm underline">Logout</button>
        ) : (
          <Link to="/login" className="text-sm underline">Login</Link>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
