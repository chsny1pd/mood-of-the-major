import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";

const app = <App />;

createRoot(document.getElementById("root")!).render(
  import.meta.env.PROD ? app : <StrictMode>{app}</StrictMode>,
);

void import("./lib/sentry").then(({ initSentry }) => {
  initSentry();
});
