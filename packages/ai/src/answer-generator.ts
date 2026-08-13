/**
 * Answer generator — orchestrates provider + prompt system for one question.
 *
 * The decision engine decides whether to generate; this class only executes
 * generation when the decision says so. Question classification (fallback for
 * unknown fields) is also provided here.
 */

import type { AIProvider, GenerateRequest, QuestionCategory } from "@veya/core";
import type { CareerProfile } from "@veya/profile";
import {
  buildAnswerPrompt,
  buildQuestionClassificationPrompt,
  buildFactVerificationPrompt,
  buildJobAnalysisPrompt,
} from "@veya/prompts";
import { scanForInjection } from "@veya/security";
import { VeyaError } from "@veya/shared";
import { extractJsonBlock, extractJsonString } from "./json.js";
import { selectContext } from "./context-selector.js";

export interface GeneratedAnswer {
  text: string;
  /** Set when the model reports it cannot answer from the profile. */
  needsInput?: boolean;
  reason?: string;
}

export interface AnswerGeneratorOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export class AnswerGenerator {
  constructor(
    private readonly provider: AIProvider,
    private readonly profile: CareerProfile,
    private readonly opts: AnswerGeneratorOptions,
  ) {}

  private requestBase(signal?: AbortSignal): Omit<GenerateRequest, "system" | "user"> {
    return {
      model: this.opts.model,
      temperature: this.opts.temperature ?? 0.6,
      maxTokens: this.opts.maxTokens ?? 1024,
      signal,
    };
  }

  async generateAnswer(args: {
    question: string;
    category: QuestionCategory;
    application?: { company?: string; role?: string; location?: string; description?: string };
    tone?: string;
    signal?: AbortSignal;
  }): Promise<GeneratedAnswer> {
    const injection = scanForInjection(args.question);
    if (!injection.clean) {
      throw new VeyaError({
        code: "internal",
        userMessage: "Veya detected suspicious instructions in this question and refused to process it.",
        detail: `Injection signals: ${injection.matches.join(", ")}`,
      });
    }

    const prompt = buildAnswerPrompt({
      profile: this.profile,
      application: args.application,
      question: args.question,
      tone: args.tone,
    });

    const request: GenerateRequest = {
      system: prompt.system,
      user: prompt.user,
      ...this.requestBase(args.signal),
    };

    const response = await this.provider.generate(request);

    // First try structured {"answer":...}; fall back to plain text.
    try {
      const answer = extractJsonString(response.text);
      if (answer && !answer.startsWith("{")) return { text: answer };
    } catch {
      // fall through to plain text
    }

    if (response.text.trim().length === 0) {
      throw new VeyaError({ code: "internal", userMessage: "Veya got an empty draft from the model." });
    }
    return { text: response.text.trim() };
  }

  async classifyQuestion(args: {
    question: string;
    knownFields?: string[];
    signal?: AbortSignal;
  }): Promise<{ category: QuestionCategory; sensitive: boolean; needsUserInput: boolean; reason?: string }> {
    const prompt = buildQuestionClassificationPrompt({
      profile: this.profile,
      question: args.question,
      knownFields: args.knownFields,
    });
    const response = await this.provider.generate({
      system: prompt.system,
      user: prompt.user,
      ...this.requestBase(args.signal),
      maxTokens: 300,
    });
    const parsed = extractJsonBlock(response.text) as {
      category?: string;
      sensitive?: boolean;
      needsUserInput?: boolean;
      reason?: string;
    };
    return {
      category: (parsed.category as QuestionCategory) ?? "UNKNOWN",
      sensitive: parsed.sensitive === true,
      needsUserInput: parsed.needsUserInput === true,
      reason: parsed.reason,
    };
  }

  async verifyClaim(args: { claim: string; signal?: AbortSignal }): Promise<{ supported: boolean; uncertain: boolean; basis?: string }> {
    const prompt = buildFactVerificationPrompt({ profile: this.profile, claim: args.claim });
    const response = await this.provider.generate({
      system: prompt.system,
      user: prompt.user,
      ...this.requestBase(args.signal),
      temperature: 0,
      maxTokens: 300,
    });
    const parsed = extractJsonBlock(response.text) as { supported?: boolean; uncertain?: boolean; basis?: string };
    return { supported: parsed.supported === true, uncertain: parsed.uncertain === true, basis: parsed.basis };
  }

  async analyzeJob(pageText: string, signal?: AbortSignal): Promise<Record<string, unknown>> {
    const prompt = buildJobAnalysisPrompt({ pageText });
    const response = await this.provider.generate({
      system: prompt.system,
      user: prompt.user,
      ...this.requestBase(signal),
      temperature: 0,
      maxTokens: 600,
    });
    return extractJsonBlock(response.text) as Record<string, unknown>;
  }

  /** Context for a category (exposed so the extension can show what's included). */
  contextFor(category: QuestionCategory): string {
    return selectContext(this.profile, category);
  }
}