import { describe, it, expect } from "vitest";
import { emptyProfile } from "@veya/profile";
import { isProfileSet, resumeFileToProfile } from "../src/sidepanel/resume.js";

describe("isProfileSet", () => {
  it("is false for an empty profile", () => {
    expect(isProfileSet(emptyProfile())).toBe(false);
  });

  it("is true once any career content exists", () => {
    expect(isProfileSet({ ...emptyProfile(), identity: { firstName: "Ada", lastName: "Lovelace" } })).toBe(true);
    expect(isProfileSet({ ...emptyProfile(), skills: [{ name: "Rust" }] })).toBe(true);
  });
});

describe("resumeFileToProfile", () => {
  it("parses a text resume into a reviewable profile seed", async () => {
    const text = [
      "Ada Lovelace",
      "ada@example.com | +1 (555) 010-0200 | London, UK",
      "",
      "SUMMARY",
      "Mathematician and first programmer.",
      "",
      "SKILLS",
      "TypeScript, Rust, Algorithms",
      "",
      "EXPERIENCE",
      "Acme — Engineer",
      "2020 - Present",
      "- Built things.",
      "",
      "EDUCATION",
      "University of London, BSc Mathematics (2015 - 2017)",
    ].join("\n");
    const file = new File([text], "resume.txt", { type: "text/plain" });
    const p = await resumeFileToProfile(file);

    expect(p.identity).toEqual({ firstName: "Ada", lastName: "Lovelace" });
    expect(p.contact?.email).toBe("ada@example.com");
    expect(p.skills).toEqual([{ name: "TypeScript" }, { name: "Rust" }, { name: "Algorithms" }]);
    expect(p.experience[0]).toMatchObject({ company: "Acme", title: "Engineer", current: true });
    expect(p.education[0]).toMatchObject({ institution: "University of London" });
  });
});
