import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { Sentry, initSentry } from "./lib/sentry";
import "./styles/index.css";

initSentry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Something went wrong. Please refresh the page.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
