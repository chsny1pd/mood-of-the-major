import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Preload the `/` critical path and avoid render-blocking the full stylesheet so
 * the inline home shell can paint before React finishes the LCP element.
 */
function landingPerformanceHints(): Plugin {
  return {
    name: "landing-performance-hints",
    apply: "build",
    enforce: "post",
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) {
        return html;
      }

      const chunkNames = Object.values(ctx.bundle)
        .filter((item) => item.type === "chunk")
        .map((chunk) => chunk.fileName);

      const sharedPreloads = chunkNames.filter((name) => {
        return (
          name.includes("RouterShell") ||
          /^assets\/i18n-/.test(name) ||
          /^assets\/context-/.test(name) ||
          /^assets\/react-/.test(name)
        );
      });

      const homeRouteChunk = chunkNames.find((name) => name.includes("homeRoute"));

      const fontFile = Object.keys(ctx.bundle).find((fileName) =>
        fileName.includes("dm-sans-latin-wght-normal"),
      );

      const hints = [
        fontFile
          ? `<link rel="preload" href="/${fontFile}" as="font" type="font/woff2" crossorigin />`
          : "",
        ...sharedPreloads.map(
          (fileName) => `<link rel="modulepreload" crossorigin href="/${fileName}" />`,
        ),
        homeRouteChunk
          ? `<script>(function(){var p=location.pathname;if(p!=="/"&&p!=="")return;var l=document.createElement("link");l.rel="modulepreload";l.crossOrigin="";l.href="/${homeRouteChunk}";document.head.appendChild(l);})();</script>`
          : "",
      ]
        .filter(Boolean)
        .join("\n    ");

      let next = html.replace(
        /<link rel="stylesheet" crossorigin href="([^"]+\.css)">/g,
        [
          '<link rel="preload" as="style" crossorigin href="$1" onload="this.onload=null;this.rel=\'stylesheet\'">',
          '<noscript><link rel="stylesheet" crossorigin href="$1"></noscript>',
        ].join(""),
      );

      if (hints) {
        next = next.replace("</head>", `    ${hints}\n  </head>`);
      }

      return next;
    },
  };
}

/**
 * Avoid aggressive manualChunks. With Rolldown (Vite 8), putting recharts /
 * framer-motion in dedicated vendor chunks pulled React + jsx-runtime into
 * those chunks, so `/` and `/feed` downloaded ~500KB of unused JS.
 * Let the bundler keep heavy libs with the route modules that import them.
 */
export default defineConfig({
  plugins: [react(), tailwindcss(), landingPerformanceHints()],
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
