import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["lib/db/**/*.ts", "app/api/uploads/route.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 70
      }
    }
  },
  resolve: {
    alias: {
      "@": rootDir,
      "next/server": fileURLToPath(new URL("./test/shims/next-server.ts", import.meta.url))
    }
  }
});
