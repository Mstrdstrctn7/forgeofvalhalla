import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/admin/index.jsx";
import AuthLayout from "./layouts/auth/index.jsx";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth/*" element={<AuthLayout />} />
      <Route path="/*" element={<AdminLayout />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
