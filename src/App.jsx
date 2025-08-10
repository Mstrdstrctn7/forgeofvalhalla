import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Auth from "./pages/Auth.jsx";
import EnvCheck from "./pages/EnvCheck.jsx";
import "./App.css";

import { supabase } from "./supabaseClient";
import useSession from "./hooks/useSession";

// Route guard that uses our session hook state
function ProtectedRoute({ session, loading, children }) {
  if (loading) return null; // could render a spinner if you like
  return session ? children : <Navigate to="/login" replace />;
}

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

        <span style={{ marginLeft: "auto" }} />

        {loading ? null : session ? (
          <>
            <span>Signed in</span>
            <button onClick={signOut}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/env" element={<EnvCheck />} />
        <Route path="/login" element={<Auth />} />
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
