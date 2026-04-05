import React from "react";
import ReactDOM from "react-dom/client";
import "./i18n/i18n";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
// ✅ FIXED: Default import
import AuthProvider from "./context/AuthContext.jsx";
import NotificationProvider from "./context/NotificationContext.jsx";
import ThemeProvider from "./context/ThemeContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);
