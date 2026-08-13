import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@veya/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      "@veya/profile": fileURLToPath(new URL("../../packages/profile/src/index.ts", import.meta.url)),
      "@veya/providers": fileURLToPath(new URL("../../packages/providers/src/index.ts", import.meta.url)),
      "@veya/document-engine": fileURLToPath(new URL("../../packages/document-engine/src/index.ts", import.meta.url)),
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
  },
});
