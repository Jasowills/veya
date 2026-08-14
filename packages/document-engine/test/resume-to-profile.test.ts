import { describe, it, expect } from "vitest";
import type { ParsedResume } from "../src/resume-parser.js";
import { parseDates, resumeToProfile } from "../src/resume-to-profile.js";

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
    experience: [{ company: "Acme", title: "Engineer", dates: "2020 - Present", bullets: ["Built things."] }],
    education: ["University of London, BSc Mathematics (2015 - 2017)"],
    sections: [{ heading: "preamble", lines: ["Ada Lovelace", "ada@example.com | +1 (555) 010-0200 | London, UK"] }],
  };

  it("seeds identity, contact, skills, experience and education", () => {
    const p = resumeToProfile(resume);
    expect(p.identity).toEqual({ firstName: "Ada", lastName: "Lovelace" });
    expect(p.contact?.email).toBe("ada@example.com");
    expect(p.skills).toEqual([{ name: "TypeScript" }, { name: "Rust" }]);
    expect(p.experience[0]).toMatchObject({
      company: "Acme",
      title: "Engineer",
      current: true,
      bullets: ["Built things."],
    });
    expect(p.education[0]).toMatchObject({
      institution: "University of London",
      degree: "BSc Mathematics",
      startYear: "2015",
      endYear: "2017",
    });
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
