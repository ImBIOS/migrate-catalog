import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "test/",
        "test-ts/",
        "vitest.config.ts",
        "dist/",
      ],
      all: true,
      thresholds: {
        lines: 83,
        functions: 75,
        branches: 90,
        statements: 83,
      },
    },
  },
});
