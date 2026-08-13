import { describe, it, expect } from "vitest";
import { normalizedFieldId, categoryOf } from "../src/normalize.js";
import type { FieldHintSet } from "../src/normalize.js";

function hints(overrides: Partial<FieldHintSet>): FieldHintSet {
  return { labels: [], surrounding: [], ...overrides };
}

describe("normalizedFieldId", () => {
  it("maps common labels", () => {
    expect(normalizedFieldId(hints({ labels: ["First name"] }))).toBe("FIRST_NAME");
    expect(normalizedFieldId(hints({ labels: ["Given name"] }))).toBe("FIRST_NAME");
    expect(normalizedFieldId(hints({ labels: ["Last name"] }))).toBe("LAST_NAME");
    expect(normalizedFieldId(hints({ labels: ["Surname"] }))).toBe("LAST_NAME");
    expect(normalizedFieldId(hints({ labels: ["Email address"] }))).toBe("EMAIL");
    expect(normalizedFieldId(hints({ labels: ["E-mail"] }))).toBe("EMAIL");
    expect(normalizedFieldId(hints({ labels: ["Phone number"] }))).toBe("PHONE");
  });

  it("uses name/id/placeholder as fallbacks", () => {
    expect(normalizedFieldId(hints({ name: "firstName" }))).toBe("FIRST_NAME");
    expect(normalizedFieldId(hints({ placeholder: "Email" }))).toBe("EMAIL");
    expect(normalizedFieldId(hints({ id: "email_address" }))).toBe("EMAIL");
    expect(normalizedFieldId(hints({ id: "linkedin_url" }))).toBe("LINKEDIN_URL");
  });

  it("detects sensitive categories from question text", () => {
    expect(normalizedFieldId(hints({ surrounding: ["Are you legally authorized to work in the United States?"] }))).toBe("WORK_AUTHORIZATION");
    expect(normalizedFieldId(hints({ labels: ["Will you require visa sponsorship?"] }))).toBe("SPONSORSHIP_REQUIRED");
    expect(normalizedFieldId(hints({ labels: ["What are your salary expectations?"] }))).toBe("SALARY_EXPECTATION");
  });

  it("detects employment type from label + select options", () => {
    const field = hints({ labels: ["Employment type"], options: ["Full-time", "Part-time", "Contract"] });
    expect(normalizedFieldId(field)).toBe("EMPLOYMENT_TYPE");
  });

  it("returns UNKNOWN for unrecognized text", () => {
    expect(normalizedFieldId(hints({ labels: ["Favorite color"] }))).toBe("UNKNOWN");
  });

  it("maps to categories", () => {
    expect(categoryOf("FIRST_NAME")).toBe("PERSONAL_INFORMATION");
    expect(categoryOf("EMAIL")).toBe("CONTACT");
    expect(categoryOf("WORK_AUTHORIZATION")).toBe("WORK_AUTHORIZATION");
  });
});