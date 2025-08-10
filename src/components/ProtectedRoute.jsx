import { Navigate } from "react-router-dom";

/**
 * Guards a route.
 * - while `loading` is true, show a tiny placeholder
 * - if there's a session, render children
 * - otherwise, send to /login
 */
export default function ProtectedRoute({ session, loading, children }) {
  if (loading) {
    return <p style={{ color: "#fff", padding: 16 }}>Checking session…</p>;
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
