/**
 * Message protocol between the Veya extension surfaces
 * (content script ↔ service worker ↔ UI).
 *
 * All messages are JSON-serializable. No DOM references cross boundaries —
 * the content script owns the DOM and exposes only stable element ids.
 */

import type { DetectedField, QuestionCategory } from "@veya/core";
import type { CareerProfile } from "@veya/profile";

/** Runtime config the user has set in options. */
export interface RuntimeConfig {
  provider: "ollama" | "openai" | "anthropic" | "gemini" | "openrouter" | "groq" | "lmstudio";
  baseUrl?: string;
  model?: string;
  /** Wired via chrome.storage.local; never exposed to page contexts. */
  apiKey?: string;
}

export interface FieldDecision {
  action: "fill" | "generate" | "ask";
  value?: string;
  source: string;
  confidence: string;
  reason: string;
}

export interface PlanEntry {
  field: DetectedField;
  decision: FieldDecision;
  edited?: string;
  draft?: string;
}

export interface JobContext {
  company?: string;
  role?: string;
  location?: string;
  description?: string;
  employmentType?: string;
}

export interface ScanState {
  url: string;
  title: string;
  job: JobContext;
  fields: DetectedField[];
  plan: PlanEntry[];
}

/** Messages from the UI → background. */
export type Request =
  | { kind: "scan" }
  | { kind: "setValue"; elementId: string; value: string }
  | { kind: "fill"; answers: Array<{ elementId: string; value: string }> }
  | { kind: "decide"; field: DetectedField }
  | { kind: "generate"; field: DetectedField; tone?: string }
  | { kind: "status" }
  | { kind: "openOptions" }
  | { kind: "getProfile" }
  | { kind: "saveProfile"; profile: CareerProfile }
  | { kind: "exportProfile" }
  | { kind: "importProfile"; json: string };

export type Response =
  | { ok: true; result: unknown }
  | { ok: false; error: string };

/** Content script ⇄ background handshake. */
export type C2B =
  | { kind: "scanResult"; fields: DetectedField[]; url: string; title: string; pageText: string }
  | { kind: "fillResult"; results: Array<{ elementId: string; ok: boolean }> };

export type B2C =
  | { kind: "ping" }
  | { kind: "scanRequest" }
  | { kind: "fillRequest"; answers: Array<{ elementId: string; value: string }> };

export interface GenerateOutcome {
  text: string;
  needsInput?: boolean;
}
