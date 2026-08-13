import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@veya/profile": fileURLToPath(new URL("../profile/src/index.ts", import.meta.url)),
      "@veya/core": fileURLToPath(new URL("../core/src/index.ts", import.meta.url)),
      "@veya/security": fileURLToPath(new URL("../security/src/index.ts", import.meta.url)),
    },
  },
  test: {
    include: ["test/**/*.test.ts"],
  },
});