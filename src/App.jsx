import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Auth from "./pages/Auth.jsx";
import EnvCheck from "./pages/EnvCheck.jsx";
import { supabase } from "./supabaseClient";
import useSession from "./hooks/useSession";

export default function App() {
  const { session, loading } = useSession();

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <BrowserRouter>
      <nav style={{ display: "flex", gap: 12, padding: 12 }}>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/env">Env</Link>
        {loading ? (
          <span>Loading…</span>
        ) : session ? (
          <>
            <span style={{ opacity: 0.8 }}>
              {session.user?.email ?? "signed in"}
            </span>
            <button onClick={signOut}>Sign out</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/env" element={<EnvCheck />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute session={session} loading={loading}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
