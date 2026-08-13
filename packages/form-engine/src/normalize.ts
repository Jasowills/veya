/**
 * Normalization: hint text → NormalizedFieldId, entirely deterministically.
 */

import type { NormalizedFieldId, QuestionCategory } from "@veya/core";
import { FIELD_TO_CATEGORY } from "@veya/core";
import { FIELD_KEYWORDS } from "./keywords.js";

export interface FieldHintSet {
  /** Labels found near the field (label[for], wrapping label, aria-label). */
  labels: string[];
  name?: string;
  id?: string;
  placeholder?: string;
  /** Preceding heading/legend text that describes the group. */
  surrounding: string[];
  /** Option texts for selects, used for employment-type detection. */
  options?: string[];
}

export function normalizeHintText(hint: string): string {
  const camelSplit = hint.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return camelSplit
    .toLowerCase()
    .replace(/[_\-.@:/]/g, " ")
    .replace(/[^\p{L}\p{N}\s'+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizedFieldId(hints: FieldHintSet): NormalizedFieldId {
  const corpus = buildCorpus(hints);

  // Employment-type detection benefits from select option texts.
  if (hints.options && hints.options.length > 0 && corpus.length > 0) {
    const joinedOptions = hints.options.map(normalizeHintText).join(" ");
    if (keywordHit(corpus, EMPLOYMENT_LABEL_KEYWORDS) && optionOverlap(joinedOptions, EMPLOYMENT_OPTION_KEYWORDS)) {
      return "EMPLOYMENT_TYPE";
    }
  }

  // Longest specific match wins, so "authorized to work in this country" beats
  // the generic "country" keyword.
  let bestField: NormalizedFieldId | undefined;
  let bestLength = 0;
  for (const entry of FIELD_KEYWORDS) {
    if (entry.field === "UNKNOWN") continue;
    const hit = longestKeywordHit(corpus, entry.keywords);
    if (hit !== undefined && hit > bestLength) {
      bestField = entry.field;
      bestLength = hit;
    }
  }
  return bestField ?? "UNKNOWN";
}

const EMPLOYMENT_LABEL_KEYWORDS = ["employment type", "job type", "work type", "employment status"];
const EMPLOYMENT_OPTION_KEYWORDS = ["full-time", "full time", "part-time", "part time", "contract", "freelance", "internship", "temporary", "permanent"];

export function categoryOf(fieldId: NormalizedFieldId): QuestionCategory {
  return FIELD_TO_CATEGORY[fieldId];
}

function buildCorpus(hints: FieldHintSet): string {
  const parts: string[] = [...hints.labels];
  if (hints.name) parts.push(hints.name);
  if (hints.id) parts.push(hints.id);
  if (hints.placeholder) parts.push(hints.placeholder);
  parts.push(...hints.surrounding);
  return parts.map(normalizeHintText).join(" ");
}

function keywordHit(corpus: string, keywords: string[]): boolean {
  return longestKeywordHit(corpus, keywords) !== undefined;
}

/** Length of the longest matching keyword, or undefined when none match. */
function longestKeywordHit(corpus: string, keywords: string[]): number | undefined {
  let best: number | undefined;
  for (const kw of keywords) {
    const normalized = normalizeHintText(kw);
    if (normalized.length === 0) continue;
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|\\s)${escaped}($|\\s)`, "i").test(corpus) && (best === undefined || normalized.length > best)) {
      best = normalized.length;
    }
  }
  return best;
}

function optionOverlap(joinedOptions: string, keywords: string[]): boolean {
  for (const kw of keywords) {
    const normalized = normalizeHintText(kw);
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|\\s)${escaped}($|\\s)`, "i").test(joinedOptions)) return true;
  }
  return false;
}