import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv();

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["tests/setup.ts"],
    include: ["scripts/smoke-pipeline.test.ts", "scripts/smoke-admin.test.ts"],
    env: process.env,
    testTimeout: 180_000
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "..")
    }
  }
});
