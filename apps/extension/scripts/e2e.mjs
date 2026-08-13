import { chromium } from "@playwright/test";
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL(".", import.meta.url));
const dist = resolve(dir, "..", "dist");
const testDist = resolve(dir, "..", ".e2e-dist");
const logFile = resolve(dir, "..", ".e2e.log");
const fixtureFile = resolve(dir, "..", "..", "..", "tests", "fixtures", "job-sites", "workable.html");

const log = (...a) => {
  const line = `${new Date().toISOString().slice(11, 19)} ${a.join(" ")}\n`;
  appendFileSync(logFile, line);
  process.stdout.write(line);
};

rmSync(testDist, { recursive: true, force: true });
mkdirSync(resolve(testDist, "icons"), { recursive: true });
cpSync(dist, testDist, { recursive: true });

const manifest = JSON.parse(readFileSync(resolve(dist, "manifest.json"), "utf8"));
manifest.host_permissions = ["http://localhost/*"];
if (!manifest.permissions.includes("tabs")) manifest.permissions.push("tabs");
writeFileSync(resolve(testDist, "manifest.json"), JSON.stringify(manifest, null, 2));

const fixture = readFileSync(fixtureFile, "utf8");

const server = createServer((req, res) => {
  res.setHeader("content-type", "text/html");
  res.end(fixture);
});
await new Promise((r) => server.listen(4173, "127.0.0.1", r));
log("server up");

const browser = await chromium.launchPersistentContext("", {
  channel: "chromium",
  headless: true,
  args: [`--disable-extensions-except=${testDist}`, `--load-extension=${testDist}`, "--no-sandbox"],
});

const sw = await browser.waitForEvent("serviceworker", { timeout: 15000 });
const origin = sw.url().split("/")[2];
log("sw:", origin);

const formPage = await browser.newPage();
await formPage.goto("http://localhost:4173/");
await formPage.waitForLoadState("domcontentloaded");
log("form page loaded");

const panel = await browser.newPage();
await panel.goto(`chrome-extension://${origin}/sidepanel.html`);
await panel.waitForLoadState("domcontentloaded");
log("panel loaded");

await formPage.bringToFront();
await new Promise((r) => setTimeout(r, 500));
log("form page to front");

await panel.evaluate(async () => {
  await chrome.storage.local.set({ "veya.config.v1": { provider: "ollama", model: "llama3.2:1b" } });
  const p = {
    version: 1,
    identity: { firstName: "Ada", lastName: "Lovelace" },
    contact: { email: "ada@example.com", linkedinUrl: "https://linkedin.com/in/ada" },
    experience: [
      { id: "exp1", company: "Analytical Engines", title: "Staff Engineer", current: true, bullets: ["Led the Rust core platform rewrite."], technologies: ["Rust", "TypeScript"] },
    ],
    skills: [{ name: "Rust", level: "expert" }, { name: "TypeScript", level: "advanced" }],
    preferences: { desiredRoles: ["Senior Software Engineer"], employmentTypes: ["full-time"], sponsorshipRequired: false },
    savedAnswers: [],
    writingStyle: { tone: ["professional"], lengthPreference: "concise", avoid: [] },
    documents: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await chrome.storage.local.set({ "veya.profile.v1": p });
});
log("config + profile seeded");

const msg = (page, m, timeout = 120000) =>
  Promise.race([
    page.evaluate((mm) => chrome.runtime.sendMessage(mm), m),
    new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout: ${m.kind}`)), timeout)),
  ]);

log("sending scan…");
const scan = await msg(panel, { kind: "scan" }, 180000);
log("scan ok:", scan.ok, "job:", JSON.stringify(scan.result?.job));
const plan = scan.result?.plan ?? [];
log("plan size:", plan.length);
for (const p of plan) {
  log(`  ${p.decision.action.padEnd(8)} ${p.field.normalized} "${p.field.label}" — ${p.decision.reason}`);
}

const genField = plan.find((p) => p.decision.action === "generate");
if (genField) {
  log("sending generate…");
  const gen = await msg(panel, { kind: "generate", field: genField.field }, 180000);
  log("generate ok:", gen.ok, "draft:", (gen.result?.text ?? gen.error ?? "").slice(0, 100).replace(/\n/g, " "));
  for (const p of plan) if (p.field.elementId === genField.field.elementId) p.edited = gen.result?.text ?? "";
} else {
  log("no generate field found");
}

const answers = plan
  .map((p) => ({ elementId: p.field.elementId, value: (p.edited ?? p.decision.value ?? "").toString() }))
  .filter((a) => a.value.trim().length > 0);
log("fill answers:", answers.length);
const fill = await msg(panel, { kind: "fill", answers }, 30000);
log("fill ok:", fill.ok, JSON.stringify(fill.result));

const values = await formPage.evaluate(() => ({
  first: document.getElementById("first_name").value,
  last: document.getElementById("last_name").value,
  email: document.getElementById("email").value,
  company: document.getElementById("company").value,
  why: document.getElementById("why").value.slice(0, 60),
}));
log("DOM:", JSON.stringify(values));

await browser.close();
server.close();
log("e2e complete");
