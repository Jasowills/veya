import { defineConfig } from "vite";
import { resolve } from "node:path";
import { dir, workspaceAlias } from "./vite.config.shared.js";

export default defineConfig({
  resolve: { alias: workspaceAlias },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: resolve(dir, "src/content/content.ts"),
      name: "VeyaContent",
      formats: ["iife"],
      fileName: () => "content.js",
    },
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
