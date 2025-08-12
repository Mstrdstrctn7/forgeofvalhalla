import { Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import TradingStatus from "./components/TradingStatus";
import Login from "./pages/Login";
import CoinTable from "./components/CoinTable";

function Dashboard(){
  return (
    <>
      <Header />
      <main style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Dashboard</h2>
          <TradingStatus />
        </div>
        <CoinTable />
      </main>
    </>
  );
}

export default function App(){
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </ErrorBoundary>
  );
}
