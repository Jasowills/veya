/**
 * Application session model.
 *
 * Captures everything Veya understands about the job the user is applying to
 * and the state of the interaction, so the UI and engines share one model.
 */

import type { QuestionCategory } from "./questions.js";

export interface ApplicationContext {
  company?: string;
  role?: string;
  location?: string;
  description?: string;
  employmentType?: string;
  salary?: string;
  url: string;
  questions: ApplicationQuestion[];
  requiredDocuments: DocumentRequirement[];
}

export type FieldElementType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "file"
  | "url"
  | "contenteditable"
  | "custom"
  | "hidden";

export interface DetectedField {
  /** DOM element reference as tracked by the form engine. */
  elementId: string;
  /** Normalized semantic id, e.g. FIRST_NAME. */
  normalized: string;
  category: QuestionCategory;
  /** Human label, e.g. "First name". */
  label: string;
  type: FieldElementType;
  /** True when the field carries an application requirement rather than data. */
  sensitive: boolean;
  required: boolean;
  /** Raw hints found in the DOM (labels, aria, name, id, placeholder). */
  hints: string[];
  options?: string[];
}

export type AnswerSource =
  | "verified_profile"
  | "preference"
  | "saved_answer"
  | "derived"
  | "ai_generated"
  | "user_edited"
  | "user_provided";

export interface Answer {
  elementId: string;
  normalized: string;
  value: string;
  source: AnswerSource;
  needsReview: boolean;
  confidence: "high" | "medium" | "low" | "none";
  reason?: string;
}

export interface ApplicationQuestion {
  id: string;
  text: string;
  category: QuestionCategory;
  sensitivity: "normal" | "sensitive" | "ambiguous";
  /** Field this question maps to when a direct match exists. */
  fieldId?: string;
}

export type DocumentKind = "resume" | "cover-letter" | "portfolio" | "transcript" | "other";

export interface DocumentRequirement {
  kind: DocumentKind;
  label: string;
  required: boolean;
}

export type GeneratedDocumentKind = "cover-letter" | "combined";

export interface GeneratedDocument {
  id: string;
  kind: GeneratedDocumentKind;
  name: string;
  mimeType: string;
  /** In-memory or temp-path reference. */
  blob?: Blob;
  path?: string;
  bytes?: Uint8Array;
  createdAt: number;
}

export type ApplicationStatus =
  | "DETECTED"
  | "ANALYZING"
  | "READY"
  | "FILLING"
  | "REVIEW"
  | "WAITING_FOR_USER"
  | "COMPLETED"
  | "ERROR";

export interface ApplicationSession {
  id: string;
  application: ApplicationContext;
  detectedFields: DetectedField[];
  answers: Answer[];
  generatedDocuments: GeneratedDocument[];
  pendingQuestions: ApplicationQuestion[];
  status: ApplicationStatus;
  startedAt: number;
  updatedAt: number;
}