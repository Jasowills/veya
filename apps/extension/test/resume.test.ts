import { describe, it, expect } from "vitest";
import { emptyProfile, type CareerProfile } from "@veya/profile";
import { isProfileSet, mergeResumeIntoProfile, resumeFileToProfile } from "../src/shared/resume.js";

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

describe("mergeResumeIntoProfile", () => {
  const seed = {
    ...emptyProfile(),
    identity: { firstName: "Ada", lastName: "Lovelace" },
    contact: { email: "ada@example.com" },
    skills: [{ name: "Rust" }],
    experience: [{ id: "x1", company: "Acme", title: "Engineer", current: false, bullets: [], technologies: [] }],
    education: [{ id: "e1", institution: "University of London", honors: [] }],
  };

  it("replaces career sections the resume produced", () => {
    const current = {
      ...emptyProfile(),
      identity: { firstName: "Old", lastName: "Name" },
      skills: [{ name: "Java" }],
    };
    const merged = mergeResumeIntoProfile(current, seed);
    expect(merged.identity).toEqual(seed.identity);
    expect(merged.skills).toEqual(seed.skills);
    expect(merged.experience).toEqual(seed.experience);
    expect(merged.education).toEqual(seed.education);
  });

  it("keeps current sections when the resume produced none", () => {
    const current: CareerProfile = { ...emptyProfile(), identity: { firstName: "Old", lastName: "Name" }, skills: [{ name: "Java" }] };
    const merged = mergeResumeIntoProfile(current, emptyProfile());
    expect(merged.skills).toEqual([{ name: "Java" }]);
    expect(merged.identity).toEqual(current.identity);
  });

  it("preserves non-career data such as preferences", () => {
    const current: CareerProfile = { ...emptyProfile(), preferences: { desiredRoles: ["SRE"], industries: [], employmentTypes: ["full-time"], sponsorshipRequired: false } };
    const merged = mergeResumeIntoProfile(current, seed);
    expect(merged.preferences).toEqual(current.preferences);
  });
});
