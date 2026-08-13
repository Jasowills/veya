/**
 * Pure application-intelligence logic for the background worker.
 * No chrome.* dependencies — unit-testable.
 */

import { DecisionEngine } from "@veya/ai";
import type { DetectedField, NormalizedFieldId } from "@veya/core";
import type { CareerProfile } from "@veya/profile";
import type { FieldDecision, JobContext, PlanEntry } from "../shared/messages.js";

/** Best-effort company/role extraction from tab title + URL. */
export function jobFromHeuristics(url: string, title: string): JobContext {
  const job: JobContext = {};
  const cleaned = title
    .replace(/\s*\|\s*.+$/, "")
    .replace(/\s*[-\u2013\u2014]\s*.+$/, "")
    .trim();
  if (!cleaned) return job;
  const at = cleaned.match(/^(.*?)\s+at\s+(.+)$/i);
  if (at) {
    job.role = at[1]?.trim();
    job.company = at[2]?.trim();
  } else {
    job.role = cleaned;
  }
  try {
    const host = new URL(url).hostname;
    if (!job.company) {
      let h = host.replace(/^www\./, "");
      h = h.replace(/^(careers|jobs|apply|join|recruiting|hr|hiring|talent|boards|greenhouse|lever|icims|workday|smartrecruiters|bamboo|ashby)\./, "");
      job.company = h.split(".")[0];
    }
  } catch {
    // keep job as-is
  }
  return job;
}

/** Deterministic fill/generate/ask plan for a scanned form, given the profile. */
export function buildPlan(profile: CareerProfile, fields: DetectedField[]): PlanEntry[] {
  const engine = new DecisionEngine();
  return fields.map((field) => {
    const d = engine.decide({
      profile,
      fieldId: field.normalized as NormalizedFieldId,
      category: field.category,
      text: field.label,
      sensitive: field.sensitive,
    });
    const decision: FieldDecision = {
      action: d.action,
      value: d.value,
      source: d.source,
      confidence: d.confidence,
      reason: d.reason,
    };
    return { field, decision };
  });
}

export function fillableAnswers(plan: PlanEntry[]): Array<{ elementId: string; value: string }> {
  return plan
    .map((p) => ({ elementId: p.field.elementId, value: (p.draft ?? p.edited ?? p.decision.value ?? "").toString().trim() }))
    .filter((a) => a.value.length > 0);
}
