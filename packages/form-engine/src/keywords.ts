/**
 * Keyword mapping for field normalization.
 *
 * Hints (labels, aria, placeholder, name, id, surrounding text) are matched
 * deterministically against this table. Specific multi-word phrases are
 * checked before generic keywords. Never relies on an LLM.
 */

import type { NormalizedFieldId } from "@veya/core";

export interface KeywordEntry {
  field: NormalizedFieldId;
  /** Lowercased keywords; matched as substrings with word boundaries. */
  keywords: string[];
}

export const FIELD_KEYWORDS: KeywordEntry[] = [
  { field: "PREFERRED_NAME", keywords: ["preferred name", "preferred first name", "nickname"] },
  { field: "FIRST_NAME", keywords: ["first name", "firstname", "fname", "given name", "given names", "legal first name", "forename"] },
  { field: "LAST_NAME", keywords: ["last name", "lastname", "lname", "family name", "surname", "legal last name", "last (family) name"] },
  { field: "EMAIL", keywords: ["email", "e-mail", "email address", "e-mail address"] },
  { field: "PHONE", keywords: ["phone number", "telephone number", "phone", "telephone", "mobile number", "mobile", "contact number", "daytime phone"] },
  { field: "ADDRESS_LINE1", keywords: ["address line 1", "address line1", "street address", "address 1", "street", "home address", "mailing address"] },
  { field: "ADDRESS_LINE2", keywords: ["address line 2", "address line2", "address 2", "apartment", "apt", "suite", "unit number", "unit"] },
  { field: "CITY", keywords: ["city", "town", "city/town"] },
  { field: "STATE", keywords: ["state", "province", "region", "county"] },
  { field: "POSTAL_CODE", keywords: ["postal code", "zip code", "zip", "postcode", "postal"] },
  { field: "COUNTRY", keywords: ["country", "country of residence", "residence country"] },
  { field: "LINKEDIN_URL", keywords: ["linkedin", "linkedin profile", "linkedin url", "linkedin username"] },
  { field: "GITHUB_URL", keywords: ["github", "github profile", "github url", "github username"] },
  { field: "PORTFOLIO_URL", keywords: ["portfolio url", "portfolio link", "portfolio website"] },
  { field: "WEBSITE_URL", keywords: ["website", "personal website", "website url", "personal site"] },
  { field: "CURRENT_TITLE", keywords: ["current job title", "current title", "job title", "position title", "title", "current position", "desired title"] },
  { field: "CURRENT_COMPANY", keywords: ["current employer", "current company", "company", "employer", "organization", "company name"] },
  { field: "SUMMARY", keywords: ["professional summary", "about yourself", "about you", "summary", "bio", "personal statement", "profile summary"] },
  { field: "WORK_AUTHORIZATION", keywords: ["authorized to work", "work authorization", "legally authorized", "right to work", "eligible to work"] },
  { field: "SPONSORSHIP_REQUIRED", keywords: ["require sponsorship", "sponsorship", "visa sponsorship", "sponsor", "sponsorship required"] },
  { field: "SALARY_EXPECTATION", keywords: ["salary expectation", "expected salary", "desired salary", "salary requirements", "salary range", "compensation", "annual salary", "salary"] },
  { field: "RELOCATION_WILLING", keywords: ["willing to relocate", "relocation", "relocate"] },
  { field: "LOCATION_PREFERENCE", keywords: ["location preference", "work location", "preferred location"] },
  { field: "EMPLOYMENT_TYPE", keywords: ["employment type", "job type", "work type", "employment status"] },
  { field: "AVAILABILITY", keywords: ["start date", "availability", "available to start", "when can you start", "notice period", "earliest start"] },
  { field: "GENDER", keywords: ["gender", "gender identity", "sex"] },
  { field: "DISABILITY", keywords: ["disability", "disabled", "disabilities"] },
  { field: "VETERAN_STATUS", keywords: ["veteran", "military service", "armed forces", "veteran status"] },
  { field: "RACE_ETHNICITY", keywords: ["race", "ethnicity", "ethnic origin", "hispanic", "latinx"] },
  { field: "RESUME_UPLOAD", keywords: ["resume", "cv", "curriculum vitae", "résumé", "resume/cv"] },
  { field: "COVER_LETTER_UPLOAD", keywords: ["cover letter", "covering letter", "letter of introduction"] },
  { field: "PORTFOLIO_UPLOAD", keywords: ["portfolio upload", "upload portfolio", "work sample", "samples"] },
  { field: "TRANSCRIPT_UPLOAD", keywords: ["transcript", "academic transcript", "school transcript"] },
  { field: "REFERENCE", keywords: ["reference", "references", "referee"] },
  { field: "UNKNOWN", keywords: [] },
];

export const EMPLOYMENT_TYPE_OPTIONS: Array<{ field: NormalizedFieldId; keywords: string[] }> = [
  { field: "EMPLOYMENT_TYPE", keywords: ["full-time", "full time", "part-time", "part time", "contract", "freelance", "internship", "temporary", "permanent", "temporary contract"] },
];

/** Field ids whose values are file uploads. */
export const UPLOAD_FIELDS: ReadonlySet<NormalizedFieldId> = new Set([
  "RESUME_UPLOAD",
  "COVER_LETTER_UPLOAD",
  "PORTFOLIO_UPLOAD",
  "TRANSCRIPT_UPLOAD",
]);