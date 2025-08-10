import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // TODO: replace with real auth check once login is ready
  const isAuthed = true;
  return isAuthed ? children : <Navigate to="/" replace />;
}
