/**
 * Google Gemini provider adapter (docs-based contract, NOT yet live-tested —
 * requires an API key; see progress.md).
 */

import type { AIProvider, GenerateRequest, GenerateResponse, ModelInfo, ProviderHealth } from "@veya/core";
import { requestJson } from "./http.js";

export class GeminiProvider implements AIProvider {
  id = "gemini" as const;
  name = "Gemini";
  kind = "cloud" as const;

  constructor(
    private readonly apiKey: string,
    private readonly defaultModel = "gemini-2.5-flash",
  ) {}

  private endpoint(model: string): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
  }

  async listModels(): Promise<ModelInfo[]> {
    return [{ id: this.defaultModel, name: this.defaultModel, local: false }];
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const body: Record<string, unknown> = {
      system_instruction: { parts: [{ text: request.system }] },
      contents: [{ role: "user", parts: [{ text: request.user }] }],
      generationConfig: {
        temperature: request.temperature ?? 0.6,
        maxOutputTokens: request.maxTokens,
      },
    };

    const data = (await requestJson(
      this.endpoint(request.model),
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      { signal: request.signal },
    )) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    if (!text) throw new Error("gemini_empty_candidates");
    return { text };
  }

  async healthCheck(): Promise<ProviderHealth> {
    const started = Date.now();
    try {
      await requestJson(
        this.endpoint(this.defaultModel),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "ping" }] }] }),
        },
        { timeoutMs: 5000 },
      );
      return { ok: true, message: "Gemini connected", latencyMs: Date.now() - started };
    } catch {
      return { ok: false, message: "Couldn't connect to Gemini.", latencyMs: Date.now() - started };
    }
  }
}