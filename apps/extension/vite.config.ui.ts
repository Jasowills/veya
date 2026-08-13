import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { dir, workspaceAlias } from "./vite.config.shared.js";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: workspaceAlias },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      input: {
        sidepanel: resolve(dir, "sidepanel.html"),
        options: resolve(dir, "options.html"),
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
