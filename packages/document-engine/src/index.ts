/**
 * Document engine — resume parsing, cover-letter generation, PDF compositing.
 */

export {
  parseResumePdf,
  parseResumeText,
  type ParsedResume,
  type ResumeContact,
  type ResumeExperienceBlock,
  type ResumeSection,
} from "./resume-parser.js";
export {
  generateCoverLetter,
  type ApplicationSnapshot,
  type CoverLetterInput,
  type CoverLetterResult,
} from "./cover-letter.js";
export {
  composeCoverLetterPdf,
  composeTextPdf,
  type PdfComposeOptions,
} from "./pdf.js";
export {
  parseDates,
  resumeToProfile,
  experienceToProfileEntry,
} from "./resume-to-profile.js";
