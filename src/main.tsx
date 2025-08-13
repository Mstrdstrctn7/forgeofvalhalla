import ProdErrorBoundary from "./components/ProdErrorBoundary";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import "./devCrashGuard";
import App from "./App";
import "./index.css";

const root = document.getElementById("root")!;
createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <BrowserRouter><BrowserRouter><ProdErrorBoundary><ProdErrorBoundary><BrowserRouter><App /></BrowserRouter></ProdErrorBoundary></ProdErrorBoundary></BrowserRouter></BrowserRouter>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
