import { RouterProvider } from "react-router-dom";
import { router } from "./router";

export default function RouterApp() {
  return <RouterProvider router={router} />;
}
