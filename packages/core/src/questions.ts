/**
 * Question/field categorization.
 *
 * Shared between the form engine (classification) and the profile engine
 * (saved answers, preferences). A `QuestionCategory` drives the decision
 * engine: auto-fill from verified facts, use preferences, derive, generate,
 * or ask the user.
 */

export const QUESTION_CATEGORIES = [
  "PERSONAL_INFORMATION",
  "CONTACT",
  "EMPLOYMENT",
  "EDUCATION",
  "SKILLS",
  "WORK_AUTHORIZATION",
  "SPONSORSHIP",
  "SALARY",
  "RELOCATION",
  "DEMOGRAPHIC",
  "LEGAL",
  "CUSTOM_TEXT",
  "TECHNICAL",
  "BEHAVIORAL",
  "COVER_LETTER",
  "DOCUMENT_UPLOAD",
  "UNKNOWN",
] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

/** Categories that must never be auto-inferred from profile data. */
export const SENSITIVE_CATEGORIES: ReadonlySet<QuestionCategory> = new Set([
  "WORK_AUTHORIZATION",
  "SPONSORSHIP",
  "DEMOGRAPHIC",
  "LEGAL",
  "SALARY",
  "RELOCATION",
]);

/** Open-ended categories that benefit from AI-generated answers. */
export const GENERATIVE_CATEGORIES: ReadonlySet<QuestionCategory> = new Set([
  "TECHNICAL",
  "BEHAVIORAL",
  "CUSTOM_TEXT",
  "COVER_LETTER",
]);

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  PERSONAL_INFORMATION: "Personal information",
  CONTACT: "Contact",
  EMPLOYMENT: "Employment",
  EDUCATION: "Education",
  SKILLS: "Skills",
  WORK_AUTHORIZATION: "Work authorization",
  SPONSORSHIP: "Sponsorship",
  SALARY: "Salary",
  RELOCATION: "Relocation",
  DEMOGRAPHIC: "Demographic",
  LEGAL: "Legal",
  CUSTOM_TEXT: "Custom text",
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral",
  COVER_LETTER: "Cover letter",
  DOCUMENT_UPLOAD: "Document upload",
  UNKNOWN: "Unknown",
};

export const NORMALIZED_FIELD_IDS = [
  "FIRST_NAME",
  "LAST_NAME",
  "PREFERRED_NAME",
  "EMAIL",
  "PHONE",
  "ADDRESS_LINE1",
  "ADDRESS_LINE2",
  "CITY",
  "STATE",
  "POSTAL_CODE",
  "COUNTRY",
  "LINKEDIN_URL",
  "GITHUB_URL",
  "PORTFOLIO_URL",
  "WEBSITE_URL",
  "CURRENT_TITLE",
  "CURRENT_COMPANY",
  "SUMMARY",
  "WORK_AUTHORIZATION",
  "SPONSORSHIP_REQUIRED",
  "SALARY_EXPECTATION",
  "RELOCATION_WILLING",
  "LOCATION_PREFERENCE",
  "EMPLOYMENT_TYPE",
  "AVAILABILITY",
  "GENDER",
  "DISABILITY",
  "VETERAN_STATUS",
  "RACE_ETHNICITY",
  "RESUME_UPLOAD",
  "COVER_LETTER_UPLOAD",
  "COVER_LETTER_TEXT",
  "PORTFOLIO_UPLOAD",
  "TRANSCRIPT_UPLOAD",
  "PORTFOLIO_URL_2",
  "REFERENCE",
  "UNKNOWN",
] as const;

export type NormalizedFieldId = (typeof NORMALIZED_FIELD_IDS)[number];

export const FIELD_TO_CATEGORY: Record<NormalizedFieldId, QuestionCategory> = {
  FIRST_NAME: "PERSONAL_INFORMATION",
  LAST_NAME: "PERSONAL_INFORMATION",
  PREFERRED_NAME: "PERSONAL_INFORMATION",
  EMAIL: "CONTACT",
  PHONE: "CONTACT",
  ADDRESS_LINE1: "CONTACT",
  ADDRESS_LINE2: "CONTACT",
  CITY: "CONTACT",
  STATE: "CONTACT",
  POSTAL_CODE: "CONTACT",
  COUNTRY: "CONTACT",
  LINKEDIN_URL: "CONTACT",
  GITHUB_URL: "CONTACT",
  PORTFOLIO_URL: "CONTACT",
  WEBSITE_URL: "CONTACT",
  CURRENT_TITLE: "EMPLOYMENT",
  CURRENT_COMPANY: "EMPLOYMENT",
  SUMMARY: "CUSTOM_TEXT",
  WORK_AUTHORIZATION: "WORK_AUTHORIZATION",
  SPONSORSHIP_REQUIRED: "SPONSORSHIP",
  SALARY_EXPECTATION: "SALARY",
  RELOCATION_WILLING: "RELOCATION",
  LOCATION_PREFERENCE: "RELOCATION",
  EMPLOYMENT_TYPE: "EMPLOYMENT",
  AVAILABILITY: "EMPLOYMENT",
  GENDER: "DEMOGRAPHIC",
  DISABILITY: "DEMOGRAPHIC",
  VETERAN_STATUS: "DEMOGRAPHIC",
  RACE_ETHNICITY: "DEMOGRAPHIC",
  RESUME_UPLOAD: "DOCUMENT_UPLOAD",
  COVER_LETTER_UPLOAD: "DOCUMENT_UPLOAD",
  COVER_LETTER_TEXT: "COVER_LETTER",
  PORTFOLIO_UPLOAD: "DOCUMENT_UPLOAD",
  TRANSCRIPT_UPLOAD: "DOCUMENT_UPLOAD",
  PORTFOLIO_URL_2: "CONTACT",
  REFERENCE: "CUSTOM_TEXT",
  UNKNOWN: "UNKNOWN",
};