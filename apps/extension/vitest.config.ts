import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@veya/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      "@veya/profile": fileURLToPath(new URL("../../packages/profile/src/index.ts", import.meta.url)),
      "@veya/ai": fileURLToPath(new URL("../../packages/ai/src/index.ts", import.meta.url)),
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
  },
});
