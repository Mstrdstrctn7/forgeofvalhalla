import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard/>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
