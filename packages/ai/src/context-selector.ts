/**
 * Context selection.
 *
 * The LLM never receives the whole profile. A question category selects the
 * minimal verified subset that could answer it — improving privacy, token
 * usage, latency, and relevance. Demographic and legal categories deliberately
 * receive no profile data (those answers must come from the user).
 */

import type { QuestionCategory } from "@veya/core";
import type { CareerProfile } from "@veya/profile";
import { serializeProfileForContext } from "@veya/prompts";

export function selectContext(profile: CareerProfile, category: QuestionCategory): string {
  const filtered = filterProfileForCategory(profile, category);
  return serializeProfileForContext(filtered);
}

export function filterProfileForCategory(profile: CareerProfile, category: QuestionCategory): CareerProfile {
  switch (category) {
    case "PERSONAL_INFORMATION":
      return { ...profile, identity: profile.identity };
    case "CONTACT":
      return { ...profile, identity: profile.identity, contact: profile.contact };
    case "EMPLOYMENT":
      return { ...profile, experience: profile.experience, preferences: profile.preferences };
    case "EDUCATION":
      return { ...profile, education: profile.education, certifications: profile.certifications };
    case "SKILLS":
      return { ...profile, skills: profile.skills, experience: profile.experience };
    case "TECHNICAL":
      return { ...profile, skills: profile.skills, projects: profile.projects, experience: profile.experience };
    case "BEHAVIORAL":
      return { ...profile, experience: profile.experience, projects: profile.projects, savedAnswers: profile.savedAnswers, writingStyle: profile.writingStyle };
    case "CUSTOM_TEXT":
      return { ...profile, savedAnswers: profile.savedAnswers, writingStyle: profile.writingStyle };
    case "COVER_LETTER":
      return profile;
    case "WORK_AUTHORIZATION":
    case "SPONSORSHIP":
    case "SALARY":
    case "RELOCATION":
      return { ...profile, preferences: profile.preferences };
    case "DEMOGRAPHIC":
    case "LEGAL":
      // These must come from the user, never the profile.
      return { ...emptyMinimal(profile) };
    case "DOCUMENT_UPLOAD":
      return { ...emptyMinimal(profile) };
    case "UNKNOWN":
    default:
      return profile;
  }
}

/** Minimal profile carrying no personal data — used for categories we must not auto-answer. */
function emptyMinimal(profile: CareerProfile): CareerProfile {
  return {
    ...profile,
    identity: undefined,
    contact: undefined,
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    preferences: undefined,
    savedAnswers: [],
    writingStyle: undefined,
  };
}