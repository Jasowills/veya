/**
 * Cover letter generation.
 *
 * Builds a cover letter from the verified profile + application context using
 * @veya/prompts. The job description travels as untrusted content inside hard
 * boundaries; the profile is the only trusted input.
 */

import { buildCoverLetterPrompt } from "@veya/prompts";
import type { AIProvider } from "@veya/core";
import type { CareerProfile } from "@veya/profile";

export interface ApplicationSnapshot {
  company?: string;
  role?: string;
  location?: string;
  description?: string;
}

export interface CoverLetterInput {
  provider: AIProvider;
  model: string;
  profile: CareerProfile;
  application?: ApplicationSnapshot;
  /** Extra company context (e.g. from a website). Treated as untrusted. */
  companyContext?: string;
  maxTokens?: number;
}

export interface CoverLetterResult {
  text: string;
  createdAt: number;
}

export async function generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterResult> {
  const { system, user } = buildCoverLetterPrompt({
    profile: input.profile,
    application: input.application,
    companyContext: input.companyContext,
  });
  const response = await input.provider.generate({
    system,
    user,
    model: input.model,
    temperature: 0.7,
    maxTokens: input.maxTokens ?? 700,
  });
  return { text: response.text.trim(), createdAt: Date.now() };
}
