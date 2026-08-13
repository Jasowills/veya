/**
 * Deterministic field resolution.
 *
 * Maps a normalized field id (FIRST_NAME, EMAIL, WORK_AUTHORIZATION, …) to a
 * value from the verified profile. This runs BEFORE any LLM involvement: known
 * facts and preferences fill directly; everything else is routed to the
 * decision engine.
 */

import type { NormalizedFieldId, QuestionCategory, AnswerSource } from "@veya/core";
import { SENSITIVE_CATEGORIES, FIELD_TO_CATEGORY } from "@veya/core";
import type { CareerProfile } from "./schema.js";

export interface FieldResolution {
  value: string | undefined;
  source: AnswerSource;
  confidence: "high" | "medium" | "low" | "none";
  reason: string;
}

const LOW = "low" as const;
const HIGH = "high" as const;

export function resolveField(profile: CareerProfile, fieldId: NormalizedFieldId): FieldResolution {
  const category = FIELD_TO_CATEGORY[fieldId];

  // Sensitive categories (authorization, sponsorship, salary, demographics,
  // relocation) are never auto-inferred beyond explicit preferences.
  if (SENSITIVE_CATEGORIES.has(category)) {
    return resolveSensitive(profile, fieldId, category);
  }

  switch (fieldId) {
    case "FIRST_NAME":
      return pick(profile.identity?.firstName, HIGH, "From your profile");
    case "LAST_NAME":
      return pick(profile.identity?.lastName, HIGH, "From your profile");
    case "PREFERRED_NAME":
      return pick(profile.identity?.preferredName, LOW, "Preferred name, if set");
    case "EMAIL":
      return pick(profile.contact?.email, HIGH, "From your contact information");
    case "PHONE":
      return pick(profile.contact?.phone, HIGH, "From your contact information");
    case "ADDRESS_LINE1":
      return pick(profile.contact?.addressLine1, HIGH, "From your contact information");
    case "ADDRESS_LINE2":
      return pick(profile.contact?.addressLine2, LOW, "From your contact information");
    case "CITY":
      return pick(profile.contact?.city, HIGH, "From your contact information");
    case "STATE":
      return pick(profile.contact?.state, HIGH, "From your contact information");
    case "POSTAL_CODE":
      return pick(profile.contact?.postalCode, HIGH, "From your contact information");
    case "COUNTRY":
      return pick(profile.contact?.country, HIGH, "From your contact information");
    case "LINKEDIN_URL":
      return pick(profile.contact?.linkedinUrl, HIGH, "From your contact information");
    case "GITHUB_URL":
      return pick(profile.contact?.githubUrl, HIGH, "From your contact information");
    case "PORTFOLIO_URL":
      return pick(profile.contact?.portfolioUrl, HIGH, "From your contact information");
    case "WEBSITE_URL":
      return pick(profile.contact?.websiteUrl, HIGH, "From your contact information");
    case "CURRENT_TITLE":
      return pick(currentRole(profile)?.title, HIGH, "From your most recent role");
    case "CURRENT_COMPANY":
      return pick(currentRole(profile)?.company, HIGH, "From your most recent role");
    case "SUMMARY":
      return pick(profile.writingStyle?.sample, LOW, "From your writing style sample");
    case "EMPLOYMENT_TYPE":
      return resolveEmploymentType(profile);
    case "AVAILABILITY":
      return pick(profile.preferences?.availabilityDate, MEDIUM, "From your preferences");
    case "COVER_LETTER_TEXT":
      return { value: undefined, source: "verified_profile", confidence: "none", reason: "Requires generation" };
    default:
      return { value: undefined, source: "verified_profile", confidence: "none", reason: "No direct profile field" };
  }
}

const MEDIUM = "medium" as const;

function resolveSensitive(
  profile: CareerProfile,
  fieldId: NormalizedFieldId,
  category: QuestionCategory | undefined,
): FieldResolution {
  switch (fieldId) {
    case "WORK_AUTHORIZATION": {
      const status = profile.preferences?.workAuthorization?.status;
      if (!status) {
        return { value: undefined, source: "verified_profile", confidence: "none", reason: "Not in your profile" };
      }
      return { value: authorizationLabel(status), source: "preference", confidence: MEDIUM, reason: "From your work authorization preference" };
    }
    case "SPONSORSHIP_REQUIRED": {
      const required = profile.preferences?.sponsorshipRequired;
      if (required === undefined) {
        return { value: undefined, source: "verified_profile", confidence: "none", reason: "Not in your profile" };
      }
      return { value: required ? "yes" : "no", source: "preference", confidence: MEDIUM, reason: "From your sponsorship preference" };
    }
    case "SALARY_EXPECTATION": {
      const minimum = profile.preferences?.salary?.minimum;
      if (minimum === undefined) {
        return { value: undefined, source: "verified_profile", confidence: "none", reason: "Not in your profile" };
      }
      return { value: String(minimum), source: "preference", confidence: MEDIUM, reason: "From your salary preference" };
    }
    case "RELOCATION_WILLING": {
      const willing = profile.preferences?.relocation?.willing;
      if (willing === undefined) {
        return { value: undefined, source: "verified_profile", confidence: "none", reason: "Not in your profile" };
      }
      return { value: willing ? "yes" : "no", source: "preference", confidence: MEDIUM, reason: "From your relocation preference" };
    }
    case "LOCATION_PREFERENCE": {
      const arrangement = profile.preferences?.workArrangement;
      if (!arrangement) {
        return { value: undefined, source: "verified_profile", confidence: "none", reason: "Not in your profile" };
      }
      return { value: arrangement, source: "preference", confidence: MEDIUM, reason: "From your work arrangement preference" };
    }
    default: {
      void category;
      return { value: undefined, source: "verified_profile", confidence: "none", reason: "Sensitive — needs your input" };
    }
  }
}

function resolveEmploymentType(profile: CareerProfile): FieldResolution {
  const types = profile.preferences?.employmentTypes ?? [];
  if (types.length === 0) {
    return { value: undefined, source: "verified_profile", confidence: "none", reason: "Not in your profile" };
  }
  return { value: types[0], source: "preference", confidence: MEDIUM, reason: "From your employment preferences" };
}

function currentRole(profile: CareerProfile) {
  const current = profile.experience.find((e) => e.current);
  if (current) return current;
  const sorted = [...profile.experience].sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
  return sorted[sorted.length - 1];
}

function pick(value: string | undefined, confidence: "high" | "medium" | "low", reason: string): FieldResolution {
  if (value === undefined || value === "") {
    return { value: undefined, source: "verified_profile", confidence: "none", reason: `Not set — ${reason.toLowerCase()}` };
  }
  return { value, source: "verified_profile", confidence, reason };
}

type WorkAuthStatus = NonNullable<NonNullable<NonNullable<CareerProfile["preferences"]>["workAuthorization"]>["status"]>;

const AUTHORIZATION_LABELS: Record<WorkAuthStatus, string> = {
  citizen: "I am a citizen of this country",
  "permanent-resident": "I am a permanent resident",
  "authorized-to-work": "I am legally authorized to work",
  "needs-sponsorship": "I require sponsorship",
  other: "Other",
};

export function authorizationLabel(status: WorkAuthStatus): string {
  return AUTHORIZATION_LABELS[status] ?? "Other";
}