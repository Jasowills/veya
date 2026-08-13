import { copyFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(dir, "..");
const dist = resolve(root, "dist");

mkdirSync(resolve(dist, "icons"), { recursive: true });

copyFileSync(resolve(root, "public", "manifest.json"), resolve(dist, "manifest.json"));

const iconsSrc = resolve(root, "resources/icons");
if (existsSync(iconsSrc)) {
  for (const f of readdirSync(iconsSrc)) {
    copyFileSync(resolve(iconsSrc, f), resolve(dist, "icons", f));
  }
}

console.log("finalized manifest.json + icons");
