/**
 * Sensitive-value detection for labeling content and guarding decisions.
 * Used to flag fields/answers that should require explicit user confirmation.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const API_KEY_RE = /\b(sk-[A-Za-z0-9_-]{16,}|api[_-]?key[=:]\s*["']?[A-Za-z0-9_-]{16,})\b/i;

export type SensitiveKind = "email" | "phone" | "apiKey" | "none";

export function classifySensitiveValue(value: string): SensitiveKind {
  if (API_KEY_RE.test(value)) return "apiKey";
  if (EMAIL_RE.test(value)) return "email";
  if (PHONE_RE.test(value) && value.replace(/[^0-9]/g, "").length >= 7) return "phone";
  return "none";
}

export function isSensitiveValue(value: string): boolean {
  return classifySensitiveValue(value) !== "none";
}

/** Smallest regex-safe redaction that preserves shape for log messages. */
export function maskValue(value: string): string {
  const kind = classifySensitiveValue(value);
  if (kind === "none") return value;
  const head = value.slice(0, Math.min(3, value.length));
  const tail = value.slice(-2);
  return `${head}…${tail} [${kind}]`;
}