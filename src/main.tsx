import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageContext";
import { initAnalytics } from "./lib/analytics";

initAnalytics();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
);
