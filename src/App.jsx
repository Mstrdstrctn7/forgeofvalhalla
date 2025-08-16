import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/admin/index.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminLayout />} />
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<div style={{ padding: 24 }}>404 - Not Found</div>} />
    </Routes>
  );
}
