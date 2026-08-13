import { chromium } from "@playwright/test";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL(".", import.meta.url));
const extensionPath = resolve(dir, "..", "dist");

const browser = await chromium.launchPersistentContext("", {
  channel: "chromium",
  headless: true,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`, "--no-sandbox"],
});

let serviceWorker = null;
try {
  serviceWorker = await browser.waitForEvent("serviceworker", { timeout: 10000 });
} catch {
  console.log("service worker: none");
}
if (serviceWorker) console.log("service worker:", serviceWorker.url());

const pages = browser.pages();
console.log("pages:", pages.length);

if (serviceWorker) {
  const origin = serviceWorker.url().split("/")[2];
  const panel = await browser.newPage();
  await panel.goto(`chrome-extension://${origin}/sidepanel.html`);
  const text = await panel.locator("body").innerText().catch(() => "FAILED");
  console.log("sidepanel renders:", text.slice(0, 140).replace(/\n/g, " | "));
  await panel.close();
}

await browser.close();
console.log("smoke complete");
