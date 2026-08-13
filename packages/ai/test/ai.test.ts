import { describe, it, expect } from "vitest";
import { DecisionEngine } from "../src/decision-engine.js";
import { extractJsonBlock } from "../src/json.js";
import { emptyProfile, type CareerProfile } from "@veya/profile";

function profileWith(overrides: Partial<CareerProfile>): CareerProfile {
  return { ...emptyProfile(), ...overrides };
}

const rich = profileWith({
  identity: { firstName: "Ada", lastName: "Lovelace" },
  contact: { email: "ada@example.com", phone: "+1 555 010 0200" },
  experience: [
    { id: "e1", company: "Analytical Engine Co", title: "Senior Engineer", current: true, bullets: ["Built the difference engine API."], technologies: ["TypeScript"] },
  ],
  skills: [{ name: "TypeScript", level: "expert" }],
  savedAnswers: [
    { id: "s1", question: "Why do you want to work here?", category: "CUSTOM_TEXT", answer: "Because of the analytical engine.", createdAt: 0, updatedAt: 0 },
  ],
  preferences: {
    desiredRoles: [],
    industries: [],
    workArrangement: "hybrid",
    salary: { minimum: 120000, currency: "USD" },
    sponsorshipRequired: false,
    relocation: { willing: true, regions: [] },
    workAuthorization: { status: "authorized-to-work" },
    employmentTypes: ["full-time"],
  },
});

describe("DecisionEngine.decide", () => {
  const engine = new DecisionEngine();

  it("fills known verified facts", () => {
    const d = engine.decide({ profile: rich, fieldId: "FIRST_NAME", category: "PERSONAL_INFORMATION", text: "First name" });
    expect(d.action).toBe("fill");
    expect(d.value).toBe("Ada");
    expect(d.source).toBe("verified_profile");
    expect(d.confidence).toBe("high");
  });

  it("fills from explicit preferences for sensitive categories", () => {
    const d = engine.decide({ profile: rich, fieldId: "WORK_AUTHORIZATION", category: "WORK_AUTHORIZATION", text: "Authorized to work" });
    expect(d.source).toBe("preference");
    expect(d.value).toBeDefined();
  });

  it("asks instead of guessing when sensitive data is missing", () => {
    const d = engine.decide({ profile: profileWith({}), fieldId: "GENDER", category: "DEMOGRAPHIC", text: "Gender" });
    expect(d.action).toBe("ask");
  });

  it("asks when sensitive even without a field id", () => {
    const d = engine.decide({ profile: rich, category: "SPONSORSHIP", text: "Will you require sponsorship?", sensitive: true });
    expect(d.action).toBe("ask");
  });

  it("matches saved answers", () => {
    const d = engine.decide({ profile: rich, category: "CUSTOM_TEXT", text: "Why do you want to work here?" });
    expect(d.action).toBe("fill");
    expect(d.source).toBe("saved_answer");
    expect(d.value).toBe("Because of the analytical engine.");
  });

  it("generates for open-ended contextual questions", () => {
    const d = engine.decide({ profile: rich, category: "BEHAVIORAL", text: "Tell me about a challenge you faced." });
    expect(d.action).toBe("generate");
  });

  it("asks when a known field has no value and is not generative", () => {
    const d = engine.decide({ profile: profileWith({}), fieldId: "LINKEDIN_URL", category: "CONTACT", text: "LinkedIn" });
    expect(d.action).toBe("ask");
  });
});

describe("extractJsonBlock", () => {
  it("parses fenced JSON", () => {
    const text = "Sure! Here:\n```json\n{\"answer\":\"hello\"}\n```";
    expect(extractJsonBlock(text)).toEqual({ answer: "hello" });
  });

  it("parses JSON preceded by prose", () => {
    expect(extractJsonBlock('The answer is {"category":"SKILLS"} done')).toEqual({ category: "SKILLS" });
  });

  it("handles nested strings with braces", () => {
    const s = JSON.stringify({ text: "uses { and } braces" });
    expect(extractJsonBlock(s)).toEqual({ text: "uses { and } braces" });
  });

  it("throws on missing JSON", () => {
    expect(() => extractJsonBlock("no json here")).toThrow();
  });
});