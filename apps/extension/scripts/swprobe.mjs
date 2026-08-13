/**
 * Diagnostic probe for the extension's panel ⇄ service worker messaging.
 *
 * Finding (2026-08): in Playwright's HEADLESS Chromium, `chrome.runtime.sendMessage`
 * from an extension page to the MV3 service worker never reaches the worker —
 * even a listener registered directly inside the worker via evaluate() is never
 * invoked, and the sendMessage promise never settles. SW→tab messaging works fine
 * (see scripts/e2e.mjs), so the gap is specific to page→SW transport in headless.
 *
 * The panel → SW routing therefore needs verification in a real (headed) Chrome
 * session before release.
 *
 * Usage: node scripts/swprobe.mjs
 */
import { chromium } from "@playwright/test";
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL(".", import.meta.url));
const dist = resolve(dir, "..", "dist");
const testDist = resolve(dir, "..", ".e2e-dist");
const logFile = resolve(dir, "..", ".e2e.log");
const log = (...a) => {
  const l = `${new Date().toISOString().slice(11, 19)} ${a.join(" ")}\n`;
  appendFileSync(logFile, l);
  process.stdout.write(l);
};

rmSync(testDist, { recursive: true, force: true });
mkdirSync(resolve(testDist, "icons"), { recursive: true });
cpSync(dist, testDist, { recursive: true });
const manifest = JSON.parse(readFileSync(resolve(dist, "manifest.json"), "utf8"));
manifest.host_permissions = ["http://localhost/*"];
if (!manifest.permissions.includes("tabs")) manifest.permissions.push("tabs");
writeFileSync(resolve(testDist, "manifest.json"), JSON.stringify(manifest, null, 2));

const server = createServer((_req, res) => {
  res.setHeader("content-type", "text/html");
  res.end("<html><body><p>probe page</p></body></html>");
});
await new Promise((r) => server.listen(4174, "127.0.0.1", r));
log("server up");

const browser = await chromium.launchPersistentContext("", {
  channel: "chromium",
  headless: true,
  args: [`--disable-extensions-except=${testDist}`, `--load-extension=${testDist}`, "--no-sandbox"],
});
const sw = await browser.waitForEvent("serviceworker", { timeout: 15000 });
const origin = sw.url().split("/")[2];
log("sw:", origin);
sw.on("console", (m) => log("SW-CONSOLE:", m.type(), m.text().slice(0, 300)));

const panel = await browser.newPage();
await panel.goto(`chrome-extension://${origin}/sidepanel.html`);
await panel.waitForLoadState("domcontentloaded");
log("panel loaded");

const r = await Promise.race([
  panel.evaluate(() => chrome.runtime.sendMessage({ kind: "context" })),
  new Promise((_, rej) => setTimeout(() => rej(new Error("panel->SW timeout (known headless limitation, see header comment)")), 15000)),
]);
log("panel->SW context:", JSON.stringify(r).slice(0, 160));

await browser.close();
server.close();
log("done");
