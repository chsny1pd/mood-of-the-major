import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2022",
    modulePreload: {
      polyfill: false,
      resolveDependencies: (_filename, deps) =>
        deps.filter(
          (dep) =>
            !dep.includes("/charts-") &&
            !dep.includes("/motion-") &&
            !dep.includes("/query-") &&
            !dep.includes("/forms-") &&
            !dep.includes("/http-"),
        ),
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("recharts") || id.includes("d3-")) {
            return "charts";
          }

          if (id.includes("@tanstack/react-query")) {
            return "query";
          }

          if (id.includes("react-router") || id.includes("react-router-dom")) {
            return "router";
          }

          if (id.includes("react-dom")) {
            return "react-dom";
          }

          if (id.includes("/react/")) {
            return "react";
          }

          if (id.includes("axios")) {
            return "http";
          }

          if (id.includes("zod") || id.includes("@hookform")) {
            return "forms";
          }

          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "i18n";
          }

          if (id.includes("framer-motion")) {
            return "motion";
          }

          if (id.includes("@sentry")) {
            return "sentry";
          }
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
