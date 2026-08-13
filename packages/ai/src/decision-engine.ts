/**
 * Question decision engine.
 *
 * Runs BEFORE any LLM call. Given a field/question and the verified profile,
 * it decides deterministically:
 *
 *   known verified fact      → fill
 *   known preference         → fill (sensitive categories only via preference)
 *   saved answer match       → fill
 *   derive safely            → fill
 *   open-ended contextual    → generate
 *   sensitive / ambiguous    → ask
 *   unknown                  → ask
 */

import type { AnswerSource, NormalizedFieldId, QuestionCategory } from "@veya/core";
import { SENSITIVE_CATEGORIES, GENERATIVE_CATEGORIES } from "@veya/core";
import type { CareerProfile, SavedAnswer } from "@veya/profile";
import { resolveField } from "@veya/profile";

export type DecisionAction = "fill" | "generate" | "ask";

export interface Decision {
  action: DecisionAction;
  value?: string;
  source: AnswerSource;
  confidence: "high" | "medium" | "low" | "none";
  reason: string;
  /** A resolved saved answer when matched. */
  savedAnswerId?: string;
}

export interface DecideInput {
  profile: CareerProfile;
  /** Direct field match, when the form engine found one. */
  fieldId?: NormalizedFieldId;
  category: QuestionCategory;
  /** The raw question/field text, used for saved-answer matching. */
  text: string;
  sensitive?: boolean;
}

export class DecisionEngine {
  constructor(
    private readonly opts: {
      /** Saved-answer match threshold (0..1 token overlap). */
      answerMatchThreshold?: number;
    } = {},
  ) {
    this.opts.answerMatchThreshold ??= 0.5;
  }

  decide(input: DecideInput): Decision {
    // 1. Direct deterministic field resolution.
    if (input.fieldId) {
      const resolved = resolveField(input.profile, input.fieldId);
      if (resolved.value !== undefined) {
        return {
          action: "fill",
          value: resolved.value,
          source: resolved.source,
          confidence: resolved.confidence,
          reason: resolved.reason,
        };
      }
      // A known field with no resolved value is a gap — ask or generate.
      const gap = this.gapDecision(input);
      return gap;
    }

    // 2. Saved answer match.
    const saved = this.matchSavedAnswer(input);
    if (saved) {
      return {
        action: "fill",
        value: saved.answer,
        source: "saved_answer",
        confidence: "high",
        reason: "Matched your saved answer",
        savedAnswerId: saved.id,
      };
    }

    // 3. Sensitive categories never auto-inferred.
    if (input.sensitive || SENSITIVE_CATEGORIES.has(input.category)) {
      return {
        action: "ask",
        source: "verified_profile",
        confidence: "none",
        reason: "This touches information you control. Veya won't guess.",
      };
    }

    // 4. Open-ended contextual questions → generate.
    if (GENERATIVE_CATEGORIES.has(input.category) || input.category === "CUSTOM_TEXT") {
      return { action: "generate", source: "verified_profile", confidence: "none", reason: "Open-ended question — generating a draft." };
    }

    // 5. Unknown.
    return { action: "ask", source: "verified_profile", confidence: "none", reason: "Veya isn't sure what this field needs." };
  }

  private gapDecision(input: DecideInput): Decision {
    if (input.sensitive || SENSITIVE_CATEGORIES.has(input.category)) {
      return {
        action: "ask",
        source: "verified_profile",
        confidence: "none",
        reason: "No verified value exists in your profile. Veya won't guess sensitive answers.",
      };
    }
    if (GENERATIVE_CATEGORIES.has(input.category) || input.category === "CUSTOM_TEXT") {
      return { action: "generate", source: "verified_profile", confidence: "none", reason: "Drafting from your experience." };
    }
    return { action: "ask", source: "verified_profile", confidence: "none", reason: "Missing from your profile." };
  }

  private matchSavedAnswer(input: DecideInput): SavedAnswer | undefined {
    const candidates = input.profile.savedAnswers;
    if (candidates.length === 0) return undefined;
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    const target = norm(input.text);
    if (!target) return undefined;
    const targetTokens = new Set(target.split(" "));
    const threshold = this.opts.answerMatchThreshold ?? 0.5;

    let best: SavedAnswer | undefined;
    let bestScore = threshold;
    for (const a of candidates) {
      const qTokens = norm(a.question).split(" ");
      if (qTokens.length === 0) continue;
      let hits = 0;
      for (const t of qTokens) if (t && targetTokens.has(t)) hits += 1;
      const score = hits / Math.max(qTokens.length, targetTokens.size);
      if (score > bestScore) {
        bestScore = score;
        best = a;
      }
    }
    return best;
  }
}