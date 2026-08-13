/**
 * Message protocol between the Veya extension surfaces
 * (content script ↔ service worker ↔ UI).
 *
 * All messages are JSON-serializable. No DOM references cross boundaries —
 * the content script owns the DOM and exposes only stable element ids.
 */

import type { DetectedField } from "@veya/core";

/** Runtime config the user has set in options. */
export interface RuntimeConfig {
  provider: "ollama" | "openai" | "anthropic" | "gemini" | "openrouter" | "groq" | "lmstudio";
  baseUrl?: string;
  model?: string;
  /** Wired via chrome.storage.local; never exposed to page contexts. */
  apiKey?: string;
}

/** Messages from the UI → background. */
export type Request =
  | { kind: "scan" }
  | { kind: "setValue"; elementId: string; value: string }
  | { kind: "fill"; answers: Array<{ elementId: string; value: string }> }
  | { kind: "context" }
  | { kind: "decide"; field: DetectedField }
  | { kind: "status" }
  | { kind: "openOptions" };

export type Response =
  | { ok: true; result: unknown }
  | { ok: false; error: string };

/** Content script ⇄ background handshake. */
export type C2B =
  | { kind: "scanResult"; fields: DetectedField[]; url: string; title: string }
  | { kind: "fillResult"; results: Array<{ elementId: string; ok: boolean }> };

export type B2C =
  | { kind: "ping" }
  | { kind: "scanRequest" }
  | { kind: "fillRequest"; answers: Array<{ elementId: string; value: string }> };
