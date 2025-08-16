import React from "react";
import AdminLayout from "./layouts/admin/index.jsx";
import AuthLayout from "./layouts/auth/index.jsx";
import RTLLayout from "./layouts/rtl/index.jsx";

const routes = [
  { path: "/admin", element: <AdminLayout /> },
  { path: "/auth",  element: <AuthLayout /> },
  { path: "/rtl",   element: <RTLLayout /> },
  // default to /admin for root
  { path: "/",      element: <AdminLayout /> },
];

export default routes;
