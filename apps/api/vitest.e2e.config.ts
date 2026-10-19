import { defineConfig } from "vitest/config";

// End-to-end suite: boots the API against E2E_DATABASE_URL (see the test file).
export default defineConfig({
  test: {
    include: ["test/e2e/**/*.e2e.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 180_000,
    // One API process and one database schema — never run files in parallel.
    fileParallelism: false,
  },
});
