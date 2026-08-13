/**
 * OpenAI-compatible provider adapter.
 *
 * Covers OpenAI, OpenRouter, Groq, LM Studio, and other endpoints that speak
 * the OpenAI /chat/completions protocol. The exact same wire contract is used
 * across them; only base URL, auth header, and capability flags differ.
 */

import type { AIProvider, GenerateRequest, GenerateResponse, ModelInfo, ProviderHealth } from "@veya/core";
import { requestJson } from "./http.js";

export interface OpenAICompatibleOptions {
  id?: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  /** Extra headers merged into every request (e.g. OpenRouter app headers). */
  extraHeaders?: Record<string, string>;
  /** Some local endpoints (LM Studio) don't implement GET /models. */
  supportsModelListing?: boolean;
  kind?: "local" | "cloud";
  defaultModel?: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class OpenAICompatibleProvider implements AIProvider {
  id: string;
  name: string;
  kind: "local" | "cloud";

  constructor(private readonly opts: OpenAICompatibleOptions) {
    this.id = opts.id ?? "openai-compatible";
    this.name = opts.name;
    this.kind = opts.kind ?? "cloud";
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (this.opts.apiKey) headers.authorization = `Bearer ${this.opts.apiKey}`;
    return { ...headers, ...this.opts.extraHeaders };
  }

  private endpoint(path: string): string {
    return `${this.opts.baseUrl.replace(/\/$/, "")}${path}`;
  }

  async listModels(): Promise<ModelInfo[]> {
    if (this.opts.supportsModelListing === false) {
      const fallback = this.opts.defaultModel;
      return fallback ? [{ id: fallback, name: fallback, local: this.kind === "local" }] : [];
    }
    try {
      const data = (await requestJson(this.endpoint("/models"), { method: "GET", headers: this.headers() })) as {
        data?: Array<{ id: string }>;
      };
      return (data.data ?? []).map((m) => ({ id: m.id, name: m.id, local: this.kind === "local" }));
    } catch {
      // Some providers don't expose model listing; degrade gracefully.
      return this.opts.defaultModel ? [{ id: this.opts.defaultModel, name: this.opts.defaultModel, local: this.kind === "local" }] : [];
    }
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const messages: ChatMessage[] = [{ role: "system", content: request.system }, { role: "user", content: request.user }];
    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      temperature: request.temperature ?? 0.6,
    };
    if (request.maxTokens) body.max_tokens = request.maxTokens;
    if (request.jsonSchema) body.response_format = { type: "json_object" };

    const data = (await requestJson(
      this.endpoint("/chat/completions"),
      { method: "POST", headers: this.headers(), body: JSON.stringify(body) },
      { signal: request.signal },
    )) as { choices?: Array<{ message?: ChatMessage }> };

    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("provider_empty_choice");
    return { text };
  }

  async healthCheck(): Promise<ProviderHealth> {
    const started = Date.now();
    try {
      await requestJson(this.endpoint("/models"), { method: "GET", headers: this.headers() }, { timeoutMs: 5000 });
      return { ok: true, message: `${this.name} connected`, latencyMs: Date.now() - started };
    } catch {
      return { ok: false, message: `Couldn't connect to ${this.name}.`, latencyMs: Date.now() - started };
    }
  }
}

export const OpenAIProvider = (apiKey: string) =>
  new OpenAICompatibleProvider({
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiKey,
    kind: "cloud",
  });

export const OpenRouterProvider = (apiKey: string) =>
  new OpenAICompatibleProvider({
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey,
    kind: "cloud",
  });

export const GroqProvider = (apiKey: string) =>
  new OpenAICompatibleProvider({
    id: "openai-compatible",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey,
    kind: "cloud",
  });

export const LMStudioProvider = (baseUrl = "http://localhost:1234/v1", defaultModel?: string) =>
  new OpenAICompatibleProvider({
    id: "openai-compatible",
    name: "LM Studio",
    baseUrl,
    kind: "local",
    supportsModelListing: false,
    defaultModel,
  });