import { defineConfig } from "vitest/config";

// Unit tests only — the e2e suite needs a database; see vitest.e2e.config.ts.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["test/e2e/**", "**/node_modules/**"],
  },
});
