// @ts-nocheck
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import TradingStatus from "./components/TradingStatus";
import CoinTable from "./components/CoinTable";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

function Home(){
  return (
    <>
      <Header />
      <main style={{padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h2 style={{fontSize:18,fontWeight:700}}>Dashboard</h2>
          <TradingStatus />
        </div>
        <CoinTable />
      </main>
    </>
  );
}

export default function App(){
  return (
    <Routes>
      <Route path="/login" element={<Login/>}/>
      <Route path="/" element={<ProtectedRoute><Home/></ProtectedRoute>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}
