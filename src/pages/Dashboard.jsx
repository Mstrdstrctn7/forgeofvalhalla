import { lazy, Suspense, useEffect, useState } from "react";
import CoinsSelector from "../components/CoinsSelector";
import useSession from "../hooks/useSession";

const PricesStream = lazy(() => import("../components/PricesStream"));

export default function Dashboard() {
  const { session } = useSession();
  const [syms, setSyms] = useState(["BTC","ETH"]);

  useEffect(() => { if (!session) { /* router would redirect in your app */ } }, [session]);

  return (
    <div style={{color:"#fff", padding:24}}>
      <h1 style={{marginTop:16}}>Dashboard</h1>
      <p style={{marginTop:8}}>Welcome, <b>{session?.user?.email}</b>!</p>

      <CoinsSelector value={syms} onChange={setSyms} />

      <Suspense fallback={<div style={{opacity:0.6, marginTop:12}}>Loading live prices…</div>}>
        <PricesStream symbols={syms} />
      </Suspense>
    </div>
  );
}
