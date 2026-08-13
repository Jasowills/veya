/**
 * Prompt injection defense.
 *
 * Job descriptions, application pages, and form text are UNTRUSTED data.
 * Web pages must never be able to override Veya's system rules. This module
 * sanitizes untrusted text and detects instruction-steering attempts so the
 * UI can warn the user instead of silently feeding it to the model.
 */

/** Markers used to delimit untrusted content inside a user turn. */
export const CONTEXT_BOUNDARIES = {
  systemStart: "<VEYA_SYSTEM>",
  systemEnd: "</VEYA_SYSTEM>",
  verifiedStart: "<VEYA_VERIFIED_PROFILE>",
  verifiedEnd: "</VEYA_VERIFIED_PROFILE>",
  untrustedStart: "<UNTRUSTED_PAGE_CONTENT>",
  untrustedEnd: "</UNTRUSTED_PAGE_CONTENT>",
} as const;

const INJECTION_PATTERNS: RegExp[] = [
  /\bignore\s+(all\s+)?(your\s+)?(previous\s+)?(instructions|prompt|rules|directives)\b/i,
  /\bdisregard\s+(all\s+)?(previous\s+)?(instructions|directives|rules|prompt)\b/i,
  /\b(ignore|disregard)\b.*\b(directives|rules)\b/i,
  /\bforget\s+(everything|all|your)\s+(above|previous|instructions|system)\b/i,
  /\byou\s+are\s+now\b/i,
  /\bact\s+as\s+an?\s+unrestricted\b/i,
  /\bdan|jailbreak|jail\s*break|do\s+anything\s+now\b/i,
  /\breveal\s+(your\s+)?(system\s+)?prompt\b/i,
  /\bprint\s+your\s+(system\s+)?prompt\b/i,
  /\boutput\s+(your\s+)?instructions\b/i,
  /\bshow\s+(me\s+)?your\s+(system\s+)?prompt\b/i,
  /\bbypass\b.*\b(rules|safety|restrictions)\b/i,
  /\bnew\s+instructions?\s+follow\b/i,
  /\bimportant\s*(:\s*|attention|note)\b.*\bignore\b/i,
  /\bplease\s+ignore\b/i,
  /\bsend\s+(my|the|your)\s+(resume|cv|profile|data)\s+to\b/i,
];

export interface InjectionScanResult {
  clean: boolean;
  matches: string[];
}

/** Detect instruction-steering language in untrusted text. */
export function scanForInjection(text: string): InjectionScanResult {
  const matches: string[] = [];
  for (const pattern of INJECTION_PATTERNS) {
    const m = pattern.exec(text);
    if (m) {
      const match = m[0].trim();
      if (match.length > 0 && !matches.includes(match)) matches.push(match);
    }
  }
  return { clean: matches.length === 0, matches };
}

/** Strip content that has no business being near an LLM (scripts, styles, event handlers). */
export function sanitizeUntrustedHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize untrusted plain text for inclusion in a prompt. */
export function sanitizeUntrustedText(text: string, maxLength = 6000): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Wrap untrusted content in explicit boundary markers. */
export function tagUntrusted(label: string, content: string): string {
  return `${CONTEXT_BOUNDARIES.untrustedStart}[${label}]\n${content}\n${CONTEXT_BOUNDARIES.untrustedEnd}`;
}

/**
 * Assemble a user turn from verified + untrusted parts with hard boundaries.
 * Verified profile data is inside its own block; page content is clearly marked
 * as untrusted. Never place untrusted content in a system message.
 */
export function assembleUserTurn(parts: {
  verified?: string;
  untrusted?: Array<{ label: string; content: string }>;
  task?: string;
}): string {
  const blocks: string[] = [];
  if (parts.verified) {
    blocks.push(`${CONTEXT_BOUNDARIES.verifiedStart}\n${parts.verified}\n${CONTEXT_BOUNDARIES.verifiedEnd}`);
  }
  for (const u of parts.untrusted ?? []) {
    blocks.push(tagUntrusted(u.label, sanitizeUntrustedText(u.content)));
  }
  if (parts.task) blocks.push(`\n${parts.task}`);
  return blocks.join("\n\n");
}