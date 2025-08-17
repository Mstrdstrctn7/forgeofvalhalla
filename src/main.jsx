import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "components/ErrorBoundaryCompat.jsx";
import theme from "./theme/theme.js";
import "./assets/css/App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <BrowserRouter basename="/">
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);
