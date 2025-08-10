// src/pages/Dashboard.jsx
import { Suspense, lazy } from "react";
import useSession from "../hooks/useSession";

const PricesStream = lazy(() => import("../components/PricesStream"));

export default function Dashboard() {
  const { session } = useSession();

  if (!session) {
    // ProtectedRoute should already gate this, but double-safety
    return <div style={{ color: "#fff", padding: 24 }}>Redirecting to login…</div>;
  }

  const variant = import.meta.env.VITE_VARIANT ?? "unknown";

  return (
    <div style={{ color: "#fff", padding: 24 }}>
      <h1>Dashboard</h1>
      <p style={{ opacity: 0.7, marginTop: -8 }}>
        Variant: <b>{variant}</b>
      </p>

      <p style={{ marginTop: 16 }}>
        Welcome, <b>{session.user?.email}</b>!
      </p>

      <div style={{ marginTop: 24 }}>
        <Suspense fallback={<div style={{ opacity: 0.6 }}>Loading live prices…</div>}>
          <PricesStream />
        </Suspense>
      </div>
    </div>
  );
}
