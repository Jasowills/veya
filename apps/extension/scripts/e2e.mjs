import { chromium } from "@playwright/test";
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL(".", import.meta.url));
const dist = resolve(dir, "..", "dist");
const testDist = resolve(dir, "..", ".e2e-dist");
const iconDir = resolve(testDist, "icons");

rmSync(testDist, { recursive: true, force: true });
mkdirSync(iconDir, { recursive: true });
cpSync(dist, testDist, { recursive: true });

const manifest = JSON.parse(readFileSync(resolve(dist, "manifest.json"), "utf8"));
manifest.host_permissions = ["http://localhost/*"];
if (!manifest.permissions.includes("tabs")) manifest.permissions.push("tabs");
writeFileSync(resolve(testDist, "manifest.json"), JSON.stringify(manifest, null, 2));

const fixture = `<!doctype html><html><body>
  <h1>Acme — Senior Engineer</h1>
  <form id="app-form">
    <label for="first_name">First name</label>
    <input id="first_name" name="first_name" required />
    <label for="last_name">Last name</label>
    <input id="last_name" name="last_name" required />
    <label for="email">Email address</label>
    <input id="email" type="email" name="email" required />
    <label for="company">Current employer</label>
    <input id="company" name="company" />
    <label for="start">Earliest start date</label>
    <input id="start" type="date" name="start" />
    <label for="work_auth">Are you authorized to work in the US?</label>
    <select id="work_auth" name="work_auth">
      <option value="">Select…</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
    <label for="sponsor">Will you now or in the future require visa sponsorship?</label>
    <input type="radio" name="sponsor" value="yes" id="sponsor_yes" /><label for="sponsor_yes">Yes</label>
    <input type="radio" name="sponsor" value="no" id="sponsor_no" /><label for="sponsor_no">No</label>
    <label for="linkedin">LinkedIn URL</label>
    <input id="linkedin" name="linkedin_url" />
    <label for="why">Why do you want to work at Acme?</label>
    <textarea id="why" name="why"></textarea>
  </form>
</body></html>`;

const server = createServer((req, res) => {
  res.setHeader("content-type", "text/html");
  res.end(fixture);
});
await new Promise((r) => server.listen(4173, "127.0.0.1", r));

const browser = await chromium.launchPersistentContext("", {
  channel: "chromium",
  headless: true,
  args: [`--disable-extensions-except=${testDist}`, `--load-extension=${testDist}`, "--no-sandbox"],
});

const sw = await browser.waitForEvent("serviceworker", { timeout: 10000 });
const origin = sw.url().split("/")[2];
console.log("sw origin:", origin);

const page = await browser.newPage();
await page.goto("http://localhost:4173/");
await page.waitForLoadState("domcontentloaded");

const cdp = await page.context().newCDPSession(page);
await cdp.send("Target.getTargetInfo");

// Resolve the numeric tab id from inside the service worker.
const getTabId = await sw.evaluate(async () => {
  const tabs = await chrome.tabs.query({});
  const t = tabs.find((x) => x.url?.startsWith("http://localhost:4173"));
  return t?.id ?? null;
});
const tabId = getTabId;
console.log("tabId:", tabId);

// Real background path: executeScript (isolated world) + tabs.sendMessage.
const inject = await sw.evaluate(async (o) => {
  await chrome.scripting.executeScript({ target: { tabId: o.tabId }, files: ["content.js"] });
  return "injected";
}, { tabId });
console.log("inject:", inject);

const scan = await sw.evaluate(
  async (o) => {
    const res = await chrome.tabs.sendMessage(o.tabId, { kind: "scanRequest" });
    return { ok: res.ok, fields: res.fields };
  },
  { tabId },
);
console.log("scan ok:", scan.ok, "fields:", scan.fields?.length ?? 0);
for (const f of scan.fields ?? []) {
  console.log(`  ${f.normalized} [${f.type}] "${f.label}"${f.required ? " *" : ""}`);
}

const answers = (scan.fields ?? [])
  .filter((f) => ["FIRST_NAME", "LAST_NAME", "EMAIL", "LINKEDIN_URL"].includes(f.normalized))
  .map((f) => ({
    elementId: f.elementId,
    value: f.normalized === "FIRST_NAME" ? "Ada" : f.normalized === "LAST_NAME" ? "Lovelace" : f.normalized === "EMAIL" ? "ada@example.com" : "https://linkedin.com/in/ada",
  }));

const fill = await sw.evaluate(
  async (o) => {
    const res = await chrome.tabs.sendMessage(o.tabId, { kind: "fillRequest", answers: o.answers });
    return { ok: res.ok, results: res.results };
  },
  { tabId, answers },
);
console.log("fill ok:", fill.ok, JSON.stringify(fill.results));

const values = await page.evaluate(() => ({
  first: document.getElementById("first_name").value,
  last: document.getElementById("last_name").value,
  email: document.getElementById("email").value,
  linkedin: document.getElementById("linkedin").value,
}));
console.log("DOM:", JSON.stringify(values));

await browser.close();
server.close();
console.log("e2e complete");
