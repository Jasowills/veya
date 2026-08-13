import { chromium } from "@playwright/test";
const browser = await chromium.launch();
for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  const page = await browser.newPage({ viewport: vp });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("http://localhost:4175/", { waitUntil: "networkidle" });
  const r = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    navLinksVisible: getComputedStyle(document.querySelector(".nav__links")).display,
    heroCols: getComputedStyle(document.querySelector(".hero__inner")).gridTemplateColumns.split(" ").length,
    btnVisible: [...document.querySelectorAll(".btn")].every((b) => b.getBoundingClientRect().width > 0),
  }));
  console.log(vp.width, JSON.stringify(r));
  await page.close();
}
await browser.close();
