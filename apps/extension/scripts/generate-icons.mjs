import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(dir, "..");
const outDir = resolve(root, "resources/icons");
mkdirSync(outDir, { recursive: true });

const mark = readFileSync(resolve(root, "../../packages/shared/src/logo.svg"), "utf8")
  .replace(/stroke="currentColor"/g, 'stroke="#F5F4EF"')
  .replace(/var\(--veya-accent, #C8FF5A\)/g, "#C8FF5A");

const SIZES = [16, 32, 48, 128];

const browser = await chromium.launch();
const page = await browser.newPage();

for (const size of SIZES) {
  const html = `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent;width:${size}px;height:${size}px;overflow:hidden}svg{display:block;width:${size}px;height:${size}px}</style></head><body>${mark}</body></html>`;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html);
  await page.screenshot({ path: resolve(outDir, `icon-${size}.png`) });
  console.log(`wrote icon-${size}.png`);
}

await browser.close();