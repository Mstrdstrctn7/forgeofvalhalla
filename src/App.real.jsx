import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/admin/index.jsx";
import AuthLayout from "./layouts/auth/index.jsx";
import RTLLayout from "./layouts/rtl/index.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/admin" element={<AdminLayout />} />
          <Route path="/auth" element={<AuthLayout />} />
          <Route path="/rtl" element={<RTLLayout />} />
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
