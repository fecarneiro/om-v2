import { defineConfig } from "vitest/config";

process.env.DATABASE_URL =
  "postgres://order_manager:order_manager@localhost:5433/order_manager_test";

export default defineConfig({
  test: {
    include: ["src/**/*.int.test.ts"],
    globalSetup: ["tests/migrate-test-db.ts"],
    fileParallelism: false,
  },
});
