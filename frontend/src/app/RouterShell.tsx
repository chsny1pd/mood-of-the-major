import { I18nextProvider } from "react-i18next";
import { RouterProvider } from "react-router-dom";
import i18n from "../lib/i18n";
import { router } from "./router";

export default function RouterShell() {
  return (
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>
  );
}
