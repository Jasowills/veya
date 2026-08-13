import { describe, it, expect } from "vitest";
import type { DetectedField } from "@veya/core";
import { emptyProfile, type CareerProfile } from "@veya/profile";
import { buildPlan, fillableAnswers, jobFromHeuristics } from "../src/background/logic.js";

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

function field(partial: Partial<DetectedField> & Pick<DetectedField, "elementId" | "normalized" | "category" | "label" | "type">): DetectedField {
  return {
    sensitive: false,
    required: false,
    hints: [],
    ...partial,
  };
}

describe("jobFromHeuristics", () => {
  it("parses 'Senior Engineer at Acme' titles", () => {
    const j = jobFromHeuristics("https://acme.example.com/jobs/42", "Senior Engineer at Acme");
    expect(j.role).toBe("Senior Engineer");
    expect(j.company).toBe("Acme");
  });

  it("drops trailing site suffix from the title", () => {
    const j = jobFromHeuristics("https://acme.example.com/jobs/42", "Staff Engineer — Careers | Acme");
    expect(j.role).toBe("Staff Engineer");
  });

  it("falls back to the hostname for company", () => {
    const j = jobFromHeuristics("https://careers.acme.io/jobs/9", "Product Designer");
    expect(j.role).toBe("Product Designer");
    expect(j.company).toBe("acme");
  });
});

describe("buildPlan", () => {
  it("fills verified facts from the profile", () => {
    const plan = buildPlan(rich, [
      field({ elementId: "f1", normalized: "FIRST_NAME", category: "PERSONAL_INFORMATION", label: "First name", type: "text" }),
    ]);
    expect(plan[0]!.decision.action).toBe("fill");
    expect(plan[0]!.decision.value).toBe("Ada");
  });

  it("asks for sensitive data that is not in the profile", () => {
    const plan = buildPlan(rich, [
      field({ elementId: "f2", normalized: "GENDER", category: "DEMOGRAPHIC", label: "Gender", sensitive: true, type: "text" }),
    ]);
    expect(plan[0]!.decision.action).toBe("ask");
  });

  it("generates for open-ended questions", () => {
    const plan = buildPlan(rich, [
      field({ elementId: "f3", normalized: "UNKNOWN", category: "BEHAVIORAL", label: "Tell me about a challenge you faced.", type: "textarea" }),
    ]);
    expect(plan[0]!.decision.action).toBe("generate");
  });

  it("uses explicit preference for work authorization", () => {
    const plan = buildPlan(rich, [
      field({ elementId: "f4", normalized: "WORK_AUTHORIZATION", category: "WORK_AUTHORIZATION", label: "Authorized to work", type: "radio" }),
    ]);
    expect(plan[0]!.decision.action).toBe("fill");
    expect(plan[0]!.decision.source).toBe("preference");
  });
});

describe("fillableAnswers", () => {
  it("returns only answers with a resolved value", () => {
    const plan = buildPlan(rich, [
      field({ elementId: "f1", normalized: "FIRST_NAME", category: "PERSONAL_INFORMATION", label: "First name", type: "text" }),
      field({ elementId: "f2", normalized: "UNKNOWN", category: "CUSTOM_TEXT", label: "Anything else?", type: "textarea" }),
    ]);
    plan[0]!.edited = "Ada B."; // simulate an edit overriding the decision
    const answers = fillableAnswers(plan);
    expect(answers).toHaveLength(1);
    expect(answers[0]).toEqual({ elementId: "f1", value: "Ada B." });
  });
});
