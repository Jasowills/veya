/**
 * Resume parsing — best-effort, deterministic.
 *
 * Two layers:
 *   1. `parseResumePdf` — extract plain text from a PDF via `pdf-parse`.
 *   2. `parseResumeText` — split that text into sections (contact, skills,
 *      experience, education) with simple heuristics.
 *
 * `parseResumeText` and the section types live in `text-parser.ts` (import-free
 * so browser bundles can use them); only `parseResumePdf` pulls in `pdf-parse`.
 */

import { parseResumeText, type ParsedResume } from "./text-parser.js";

export {
  parseResumeText,
  type ResumeContact,
  type ResumeSection,
  type ResumeExperienceBlock,
  type ParsedResume,
} from "./text-parser.js";

/** Extract text from a PDF and run the heuristic parse. */
export async function parseResumePdf(data: Uint8Array): Promise<ParsedResume> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return parseResumeText(result.text);
  } finally {
    await parser.destroy();
  }
}
