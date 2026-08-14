/**
 * Light entry — text parsing + resume→profile mapping only.
 *
 * No `pdf-parse`, no `pdf-lib`, no cover-letter codegen. Safe for browser
 * bundles (the extension side panel) where the heavy PDF tooling is never used.
 */

export {
  parseResumeText,
  type ResumeContact,
  type ResumeSection,
  type ResumeExperienceBlock,
  type ParsedResume,
} from "./text-parser.js";
export {
  parseDates,
  resumeToProfile,
  experienceToProfileEntry,
} from "./resume-to-profile.js";
