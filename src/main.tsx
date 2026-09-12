import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AccountGate } from "./components/Account";
import { LandingPage } from "./components/LandingPage";
import "./styles.css";
import "./focus.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {"__TAURI_INTERNALS__" in window ||
    window.location.pathname !== "/landing" ? (
      <AccountGate>{(user,setUser)=><App user={user} setUser={setUser} />}</AccountGate>
    ) : (
      <LandingPage />
    )}
  </React.StrictMode>,
);
