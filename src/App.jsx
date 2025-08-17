import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const AdminLayout = lazy(() => import("layouts/admin/index.jsx"));
const AuthLayout  = lazy(() => import("layouts/auth/index.jsx"));
const RTLLayout   = lazy(() => import("layouts/rtl/index.jsx"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
        <Routes>
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="/auth/*" element={<AuthLayout />} />
          <Route path="/rtl/*" element={<RTLLayout />} />
          <Route path="/" element={<Navigate to="/admin/default" replace />} />
          <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
