import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
    pool: "forks",
    maxWorkers: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
