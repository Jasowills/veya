/**
 * Anthropic provider adapter (docs-based contract, NOT yet live-tested —
 * requires an API key; see progress.md).
 */

import type { AIProvider, GenerateRequest, GenerateResponse, ModelInfo, ProviderHealth } from "@veya/core";
import { requestJson } from "./http.js";

export class AnthropicProvider implements AIProvider {
  id = "anthropic" as const;
  name = "Anthropic";
  kind = "cloud" as const;

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://api.anthropic.com/v1",
    private readonly defaultModel = "claude-sonnet-4-5",
  ) {}

  private headers(): Record<string, string> {
    return {
      "content-type": "application/json",
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
    };
  }

  async listModels(): Promise<ModelInfo[]> {
    // Anthropic does not expose a public model list via REST; fall back to known default.
    return [{ id: this.defaultModel, name: this.defaultModel, local: false }];
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const body: Record<string, unknown> = {
      model: request.model,
      max_tokens: request.maxTokens ?? 2048,
      system: request.system,
      messages: [{ role: "user", content: request.user }],
    };
    if (request.temperature !== undefined) body.temperature = request.temperature;

    const data = (await requestJson(
      `${this.baseUrl.replace(/\/$/, "")}/messages`,
      { method: "POST", headers: this.headers(), body: JSON.stringify(body) },
      { signal: request.signal },
    )) as { content?: Array<{ type: string; text?: string }> };

    const text = (data.content ?? []).map((c) => c.text ?? "").join("");
    if (!text) throw new Error("anthropic_empty_content");
    return { text };
  }

  async healthCheck(): Promise<ProviderHealth> {
    const started = Date.now();
    try {
      await requestJson(
        `${this.baseUrl.replace(/\/$/, "")}/messages`,
        {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({ model: this.defaultModel, max_tokens: 1, messages: [{ role: "user", content: "ping" }] }),
        },
        { timeoutMs: 5000 },
      );
      return { ok: true, message: "Anthropic connected", latencyMs: Date.now() - started };
    } catch {
      return { ok: false, message: "Couldn't connect to Anthropic.", latencyMs: Date.now() - started };
    }
  }
}