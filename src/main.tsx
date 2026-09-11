import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { LandingPage } from "./components/LandingPage";
import "./styles.css";
import "./focus.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {"__TAURI_INTERNALS__" in window || window.location.pathname === "/app" ? (
      <App />
    ) : (
      <LandingPage />
    )}
  </React.StrictMode>,
);
