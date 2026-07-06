/** @type {import('lighthouse').Flags} */
module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run build && npm run preview -- --port 4173",
      startServerReadyPattern: "Local",
      url: ["http://localhost:4173/", "http://localhost:4173/feed", "http://localhost:4173/login"],
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.8 }],
        "categories:best-practices": ["error", { minScore: 0.8 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
