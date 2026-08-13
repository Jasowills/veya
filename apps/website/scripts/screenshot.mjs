import { chromium } from "@playwright/test";

const url = process.env.URL ?? "http://localhost:4175/";
const out = process.env.OUT ?? "/tmp/veya-site";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.error("pageerror:", String(e)));
await page.emulateMedia({ colorScheme: "dark" });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(4200);
await page.screenshot({ path: `${out}-dark-hero.png` });
await page.screenshot({ path: `${out}-dark-full.png`, fullPage: true });
await page.emulateMedia({ colorScheme: "light" });
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}-light-hero.png` });
await page.screenshot({ path: `${out}-light-full.png`, fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: `${out}-mobile.png`, fullPage: true });
await browser.close();
console.log("captured");
