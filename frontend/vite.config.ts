import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Avoid aggressive manualChunks. With Rolldown (Vite 8), putting recharts /
 * framer-motion in dedicated vendor chunks pulled React + jsx-runtime into
 * those chunks, so `/` and `/feed` downloaded ~500KB of unused JS.
 * Let the bundler keep heavy libs with the route modules that import them.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2022",
    modulePreload: {
      polyfill: false,
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
