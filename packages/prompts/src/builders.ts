/**
 * Prompt builders.
 *
 * Every build returns { system, user } ready for an AIProvider. Untrusted page
 * content is always placed inside explicit boundaries by @veya/security.
 */

import type { CareerProfile } from "@veya/profile";
import { assembleUserTurn } from "@veya/security";
import {
  ANSWER_GENERATION_INSTRUCTIONS,
  COVER_LETTER_INSTRUCTIONS,
  FACT_VERIFICATION_INSTRUCTIONS,
  JOB_ANALYSIS_INSTRUCTIONS,
  PROFILE_EXTRACTION_INSTRUCTIONS,
  QUESTION_CLASSIFICATION_INSTRUCTIONS,
} from "./system.js";
import { serializeApplicationForContext, serializeProfileForContext } from "./context.js";

export interface PromptResult {
  system: string;
  user: string;
}

export interface AnswerPromptArgs {
  profile: CareerProfile;
  application?: { company?: string; role?: string; location?: string; description?: string };
  question: string;
  /** Response length/tone hint, e.g. "concise". */
  tone?: string;
}

export function buildAnswerPrompt(args: AnswerPromptArgs): PromptResult {
  const verified = serializeProfileForContext(args.profile);
  const application = args.application ? serializeApplicationForContext(args.application) : undefined;
  const task = [
    `Write a personalized answer to this application question:`,
    `QUESTION: ${args.question}`,
    args.tone ? `Preferred tone: ${args.tone}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return {
    system: ANSWER_GENERATION_INSTRUCTIONS,
    user: assembleUserTurn({
      verified,
      untrusted: application ? [{ label: "JOB DESCRIPTION", content: application }] : undefined,
      task,
    }),
  };
}

export interface ClassificationPromptArgs {
  profile: CareerProfile;
  question: string;
  /** Candidate field ids already matched in the DOM, if any. */
  knownFields?: string[];
}

export function buildQuestionClassificationPrompt(args: ClassificationPromptArgs): PromptResult {
  const verified = serializeProfileForContext(args.profile);
  const task = [
    `Classify this application question.`,
    `QUESTION: ${args.question}`,
    args.knownFields?.length ? `DOM-matched fields: ${args.knownFields.join(", ")}` : "",
    `If the answer is deterministically present in the VERIFIED PROFILE, provide it in "answer". Otherwise set "needsUserInput":true.`,
  ]
    .filter(Boolean)
    .join("\n");
  return {
    system: QUESTION_CLASSIFICATION_INSTRUCTIONS,
    user: assembleUserTurn({ verified, task }),
  };
}

export interface CoverLetterPromptArgs {
  profile: CareerProfile;
  application?: { company?: string; role?: string; location?: string; description?: string };
  companyContext?: string;
}

export function buildCoverLetterPrompt(args: CoverLetterPromptArgs): PromptResult {
  const verified = serializeProfileForContext(args.profile);
  const application = args.application ? serializeApplicationForContext(args.application) : undefined;
  const task = [
    "Write a cover letter for this application.",
    args.companyContext ? `Company context (unverified): ${args.companyContext}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return {
    system: COVER_LETTER_INSTRUCTIONS,
    user: assembleUserTurn({
      verified,
      untrusted: application ? [{ label: "JOB DESCRIPTION", content: application }] : undefined,
      task,
    }),
  };
}

export interface JobAnalysisPromptArgs {
  pageText: string;
}

export function buildJobAnalysisPrompt(args: JobAnalysisPromptArgs): PromptResult {
  return {
    system: JOB_ANALYSIS_INSTRUCTIONS,
    user: assembleUserTurn({
      untrusted: [{ label: "JOB DESCRIPTION", content: args.pageText }],
      task: "Analyze the job description above and return the JSON.",
    }),
  };
}

export interface ProfileExtractionPromptArgs {
  documentText: string;
  kind: "resume" | "cover-letter" | "other";
}

export function buildProfileExtractionPrompt(args: ProfileExtractionPromptArgs): PromptResult {
  return {
    system: PROFILE_EXTRACTION_INSTRUCTIONS,
    user: assembleUserTurn({
      untrusted: [{ label: `USER DOCUMENT (${args.kind})`, content: args.documentText }],
      task: "Extract the career profile from the document above into the requested structured JSON.",
    }),
  };
}

export interface FactVerificationPromptArgs {
  profile: CareerProfile;
  claim: string;
}

export function buildFactVerificationPrompt(args: FactVerificationPromptArgs): PromptResult {
  const verified = serializeProfileForContext(args.profile);
  return {
    system: FACT_VERIFICATION_INSTRUCTIONS,
    user: assembleUserTurn({
      verified,
      task: `Is this claim supported by the VERIFIED PROFILE?\nCLAIM: ${args.claim}`,
    }),
  };
}