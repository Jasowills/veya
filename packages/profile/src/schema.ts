/**
 * CareerProfile — the structured, user-owned career context that powers Veya.
 *
 * Designed as a maintainable schema (not an unstructured JSON blob). Every
 * field is user-verifiable; nothing is silently assumed.
 */

import { z } from "zod";
import type { DocumentKind, QuestionCategory } from "@veya/core";

export const IdentitySchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  preferredName: z.string().optional(),
});

export const ContactInformationSchema = z.object({
  email: z.string().min(1),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
});

export const ExperienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1),
  title: z.string().min(1),
  location: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  current: z.boolean().default(false),
  summary: z.string().optional(),
  bullets: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
});

export const EducationSchema = z.object({
  id: z.string(),
  institution: z.string().min(1),
  degree: z.string().optional(),
  field: z.string().optional(),
  startYear: z.string().optional(),
  endYear: z.string().optional(),
  gpa: z.string().optional(),
  honors: z.array(z.string()).default([]),
});

export const SkillSchema = z.object({
  name: z.string().min(1),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  years: z.number().nonnegative().optional(),
});

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  role: z.string().optional(),
  technologies: z.array(z.string()).default([]),
  url: z.string().optional(),
  highlights: z.array(z.string()).default([]),
});

export const CertificationSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  issuer: z.string().optional(),
  year: z.string().optional(),
  url: z.string().optional(),
});

export const WorkArrangementSchema = z.enum(["on-site", "hybrid", "remote", "any"]);
export const EmploymentTypeSchema = z.enum(["full-time", "part-time", "contract", "internship", "freelance"]);
export const WorkAuthorizationStatusSchema = z.enum([
  "citizen",
  "permanent-resident",
  "authorized-to-work",
  "needs-sponsorship",
  "other",
]);

export const CareerPreferencesSchema = z.object({
  desiredRoles: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
  workArrangement: WorkArrangementSchema.optional(),
  salary: z
    .object({
      minimum: z.number().nonnegative().optional(),
      currency: z.string().default("USD"),
      note: z.string().optional(),
    })
    .optional(),
  relocation: z
    .object({
      willing: z.boolean(),
      regions: z.array(z.string()).default([]),
    })
    .optional(),
  workAuthorization: z
    .object({
      status: WorkAuthorizationStatusSchema.optional(),
      note: z.string().optional(),
    })
    .optional(),
  sponsorshipRequired: z.boolean().default(false),
  employmentTypes: z.array(EmploymentTypeSchema).default(["full-time"]),
  availabilityDate: z.string().optional(),
  noticePeriod: z.string().optional(),
});

export const SavedAnswerSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  category: z.custom<QuestionCategory>(),
  answer: z.string().min(1),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const WritingStyleSchema = z.object({
  tone: z.array(z.string()).default([]),
  lengthPreference: z.enum(["concise", "balanced", "detailed"]).default("balanced"),
  avoid: z.array(z.string()).default([]),
  sample: z.string().optional(),
});

export const DocumentReferenceSchema = z.object({
  id: z.string(),
  kind: z.custom<DocumentKind>(),
  name: z.string().min(1),
  sizeBytes: z.number().nonnegative().optional(),
  storedAt: z.string().optional(),
  updatedAt: z.number(),
});

export const CareerProfileSchema = z.object({
  version: z.literal(1).default(1),
  identity: IdentitySchema.optional(),
  contact: ContactInformationSchema.optional(),
  experience: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  preferences: CareerPreferencesSchema.optional(),
  savedAnswers: z.array(SavedAnswerSchema).default([]),
  writingStyle: WritingStyleSchema.optional(),
  documents: z.array(DocumentReferenceSchema).default([]),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Identity = z.infer<typeof IdentitySchema>;
export type ContactInformation = z.infer<typeof ContactInformationSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type CareerPreferences = z.infer<typeof CareerPreferencesSchema>;
export type SavedAnswer = z.infer<typeof SavedAnswerSchema>;
export type WritingStyle = z.infer<typeof WritingStyleSchema>;
export type DocumentReference = z.infer<typeof DocumentReferenceSchema>;
export type WorkArrangement = z.infer<typeof WorkArrangementSchema>;
export type EmploymentType = z.infer<typeof EmploymentTypeSchema>;
export type WorkAuthorizationStatus = z.infer<typeof WorkAuthorizationStatusSchema>;

export function emptyProfile(): CareerProfile {
  const now = Date.now();
  return {
    version: 1,
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
    documents: [],
    createdAt: now,
    updatedAt: now,
  };
}

export type CareerProfile = z.infer<typeof CareerProfileSchema>;