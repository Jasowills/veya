import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const dir = fileURLToPath(new URL(".", import.meta.url));

export const workspaceAlias = {
  "@veya/ai": resolve(dir, "../../packages/ai/src/index.ts"),
  "@veya/core": resolve(dir, "../../packages/core/src/index.ts"),
  "@veya/form-engine": resolve(dir, "../../packages/form-engine/src/index.ts"),
  "@veya/profile": resolve(dir, "../../packages/profile/src/index.ts"),
  "@veya/prompts": resolve(dir, "../../packages/prompts/src/index.ts"),
  "@veya/providers": resolve(dir, "../../packages/providers/src/index.ts"),
  "@veya/security": resolve(dir, "../../packages/security/src/index.ts"),
  "@veya/shared": resolve(dir, "../../packages/shared/src/index.ts"),
};

export const common = {
  resolve: { alias: workspaceAlias },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
  },
  build: {
    outDir: "dist",
  },
};
