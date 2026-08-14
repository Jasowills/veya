import { defineConfig } from "vite";
import { resolve } from "node:path";
import { dir, common } from "./vite.config.shared.js";

export default defineConfig({
  ...common,
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
