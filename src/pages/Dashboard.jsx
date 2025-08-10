// src/pages/Dashboard.jsx
import { Suspense, lazy } from "react";
import useSession from "../hooks/useSession";

const PricesPanel = lazy(() => import("../components/PricesPanel"));

export default function Dashboard() {
  const { session } = useSession();

  return (
    <div style={{ padding: 16, color: "#fff" }}>
      <h2>Dashboard</h2>
      <p>
        Welcome, <b>{session?.user?.email ?? "friend"}</b>!
      </p>
      <p style={{ opacity: 0.8 }}>
        This page is protected. If you sign out, you’ll be redirected to Login.
      </p>

      <div style={{ marginTop: 24 }}>
        <Suspense fallback={<div style={{ opacity: 0.7 }}>Loading prices…</div>}>
          <PricesPanel />
        </Suspense>
      </div>
    </div>
  );
}
