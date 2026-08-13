import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FormScanner } from "../src/dom.js";
import { JSDOM } from "jsdom";

const fixturesDir = join(process.cwd(), "..", "..", "tests", "fixtures", "job-sites");

let doc: Document;

function scanFixture(name: string) {
  const html = readFileSync(join(fixturesDir, name), "utf8");
  doc = new JSDOM(html, { url: "https://example.com/" }).window.document;
  return new FormScanner().scan(doc);
}

describe("job-site fixtures", () => {
  beforeEach(() => {
    doc = new JSDOM("<!DOCTYPE html><body></body>").window.document;
  });

  it("detects the Workable-style form fields", () => {
    const fields = scanFixture("workable.html");
    const by = (id: string) => {
      const f = fields.find((x) => x.hints.includes(id));
      if (!f) throw new Error(`fixture field ${id} not detected`);
      return f;
    };
    expect(by("first_name")).toMatchObject({ normalized: "FIRST_NAME", category: "PERSONAL_INFORMATION", required: true });
    expect(by("last_name")).toMatchObject({ normalized: "LAST_NAME", required: true });
    expect(by("email")).toMatchObject({ normalized: "EMAIL", type: "email" });
    expect(by("company").normalized).toBe("CURRENT_COMPANY");
    expect(by("start").normalized).toBe("AVAILABILITY");
    expect(by("linkedin").normalized).toBe("LINKEDIN_URL");
  });

  it("flags sensitive fields in the Workable fixture (work auth, sponsorship)", () => {
    const fields = scanFixture("workable.html");
    const workAuth = fields.find((f) => f.normalized === "WORK_AUTHORIZATION");
    const sponsor = fields.find((f) => f.normalized === "SPONSORSHIP_REQUIRED");
    expect(workAuth?.sensitive).toBe(true);
    expect(sponsor?.sensitive).toBe(true);
  });

  it("detects the Greenhouse-style form fields incl. EEO demographics as sensitive", () => {
    const fields = scanFixture("greenhouse.html");
    const by = (id: string) => {
      const f = fields.find((x) => x.hints.includes(id));
      if (!f) throw new Error(`fixture field ${id} not detected`);
      return f;
    };
    expect(by("job_application_first_name")).toMatchObject({ normalized: "FIRST_NAME", required: true });
    expect(by("job_application_email").type).toBe("email");
    expect(by("job_application_phone").normalized).toBe("PHONE");
    expect(by("job_application_city").normalized).toBe("CITY");
    expect(by("job_application_linkedin").normalized).toBe("LINKEDIN_URL");
    expect(by("job_application_github").normalized).toBe("GITHUB_URL");
    expect(by("job_application_website").normalized).toBe("WEBSITE_URL");

    expect(by("job_application_salary")).toMatchObject({ normalized: "SALARY_EXPECTATION", sensitive: true });
    expect(by("job_application_gender")).toMatchObject({ normalized: "GENDER", sensitive: true });
    expect(by("job_application_veteran")).toMatchObject({ normalized: "VETERAN_STATUS", sensitive: true });
    expect(by("job_application_disability")).toMatchObject({ normalized: "DISABILITY", sensitive: true });
  });
});
