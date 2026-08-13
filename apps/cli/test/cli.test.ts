import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ParsedResume } from "@veya/document-engine";
import { emptyProfile, type CareerProfile } from "@veya/profile";
import { parseDates, resumeToProfile } from "../src/resume-mapper.js";
import { profileExport, profileImport, profileInit, profileShow } from "../src/profile-cmd.js";
import { printChecks } from "../src/doctor.js";

describe("parseDates", () => {
  it("parses month–year ranges and Present", () => {
    expect(parseDates("Jan 2020 – Present")).toEqual({ start: "2020-01", end: undefined, current: true });
  });
  it("parses month–year ranges with an end", () => {
    expect(parseDates("Mar 2017 – Dec 2019")).toEqual({ start: "2017-03", end: "2019-12", current: false });
  });
  it("parses year-only ranges", () => {
    expect(parseDates("2015 - 2017")).toEqual({ start: "2015", end: "2017", current: false });
  });
  it("handles missing dates", () => {
    expect(parseDates(undefined)).toEqual({ current: false });
  });
});

describe("resumeToProfile", () => {
  const resume: ParsedResume = {
    text: "",
    contact: { email: "ada@example.com", phone: "+15550100200", location: "London, UK" },
    skills: ["TypeScript", "Rust"],
    experience: [
      { company: "Acme", title: "Engineer", dates: "2020 - Present", bullets: ["Built things."] },
    ],
    education: ["University of London, BSc Mathematics (2015 - 2017)"],
    sections: [{ heading: "preamble", lines: ["Ada Lovelace", "ada@example.com | +1 (555) 010-0200 | London, UK"] }],
  };

  it("seeds identity, contact, skills, experience and education", () => {
    const p = resumeToProfile(resume);
    expect(p.identity).toEqual({ firstName: "Ada", lastName: "Lovelace" });
    expect(p.contact?.email).toBe("ada@example.com");
    expect(p.skills).toEqual([{ name: "TypeScript" }, { name: "Rust" }]);
    expect(p.experience[0]).toMatchObject({ company: "Acme", title: "Engineer", current: true, bullets: ["Built things."] });
    expect(p.education[0]).toMatchObject({ institution: "University of London", degree: "BSc Mathematics", startYear: "2015", endYear: "2017" });
  });

  it("keeps the profile structurally valid", () => {
    const p = resumeToProfile(resume);
    expect(p.identity).toEqual({ firstName: "Ada", lastName: "Lovelace" });
    expect(Array.isArray(p.savedAnswers)).toBe(true);
    expect(p.savedAnswers).toEqual([]);
    expect(p.experience).toHaveLength(1);
    expect(p.education).toHaveLength(1);
  });
});

describe("profile commands (tmp store)", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "veya-cli-test-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("initializes an empty profile", async () => {
    await profileInit(dir);
    expect(existsSync(join(dir, "profile.json"))).toBe(true);
  });

  it("imports a bare profile seed and exports it", async () => {
    await profileInit(dir);
    const seed: CareerProfile = emptyProfile();
    seed.identity = { firstName: "Ada", lastName: "Lovelace" };
    const seedFile = join(dir, "seed.json");
    writeFileSync(seedFile, JSON.stringify(seed));
    await profileImport(dir, seedFile);

    const out = join(dir, "out.json");
    await profileExport(dir, out);
    const exported = JSON.parse(readFileSync(out, "utf8")) as { profile: CareerProfile };
    expect(exported.profile.identity?.firstName).toBe("Ada");
  });

  it("imports a full export envelope too", async () => {
    await profileInit(dir);
    const envelope = JSON.stringify({ app: "veya", version: 1, profile: emptyProfile(), memory: {} });
    const f = join(dir, "env.json");
    writeFileSync(f, envelope);
    await expect(profileImport(dir, f)).resolves.toBeUndefined();
  });

  it("rejects invalid payloads", async () => {
    await profileInit(dir);
    const f = join(dir, "bad.json");
    writeFileSync(f, JSON.stringify({ profile: { not: "a profile" } }));
    await expect(profileImport(dir, f)).rejects.toThrow();
  });

  it("prints the profile with profile show", async () => {
    await profileInit(dir);
    const spy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await profileShow(dir);
    expect(spy).toHaveBeenCalled();
    const arg = spy.mock.calls[0]?.[0] as string;
    expect(arg).toContain('"experience"');
    spy.mockRestore();
  });
});

describe("printChecks", () => {
  it("reports critical failures with exit code 1", () => {
    const code = printChecks([{ name: "node", ok: false, detail: "Node 0", critical: true }]);
    expect(code).toBe(1);
  });
  it("reports non-critical failures without failing", () => {
    const code = printChecks([{ name: "ollama", ok: false, detail: "down" }]);
    expect(code).toBe(0);
  });
  it("reports all-green", () => {
    const code = printChecks([{ name: "node", ok: true, detail: "Node 24" }]);
    expect(code).toBe(0);
  });
});
