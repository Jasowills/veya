/**
 * Ollama provider.
 *
 * Communicates with a locally running Ollama instance over HTTP
 * (default http://localhost:11434). Tested against Ollama 0.32.5.
 *
 * Endpoints used:
 *   GET  /api/version   — server presence + version
 *   GET  /api/tags      — installed models
 *   POST /api/generate  — non-streaming completion
 */

import type { AIProvider, GenerateRequest, GenerateResponse, ModelInfo, ProviderHealth } from "@veya/core";
import { VeyaError } from "@veya/shared";
import { requestJson } from "./http.js";

export const OLLAMA_DEFAULT_URL = "http://localhost:11434";

interface OllamaTag {
  name: string;
  model?: string;
  size?: number;
  capabilities?: string[];
}

interface OllamaGenerateBody {
  model: string;
  system?: string;
  prompt: string;
  stream: false;
  format?: string;
  options?: { temperature?: number; num_predict?: number };
}

interface OllamaGenerateResponse {
  response?: string;
  error?: string;
}

export class OllamaProvider implements AIProvider {
  id = "ollama" as const;
  name = "Ollama";
  kind = "local" as const;

  constructor(
    private readonly baseUrl: string = OLLAMA_DEFAULT_URL,
    private readonly opts: { timeoutMs?: number } = {},
  ) {}

  private endpoint(path: string): string {
    return `${this.baseUrl.replace(/\/$/, "")}${path}`;
  }

  async listModels(): Promise<ModelInfo[]> {
    const data = (await requestJson(this.endpoint("/api/tags"), { method: "GET" }, this.opts)) as {
      models?: OllamaTag[];
    };
    const models = data.models ?? [];
    return models.map((m) => ({
      id: m.name,
      name: m.model ?? m.name,
      local: true,
      supportsThinking: (m.capabilities ?? []).includes("thinking"),
    }));
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const body: OllamaGenerateBody = {
      model: request.model,
      system: request.system || undefined,
      prompt: request.user,
      stream: false,
      format: request.jsonSchema ? "json" : undefined,
      options: {
        temperature: request.temperature,
        num_predict: request.maxTokens,
      },
    };
    const data = (await requestJson(
      this.endpoint("/api/generate"),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
      // Cold model loads can take well over 30s; allow up to 120s.
      { ...this.opts, timeoutMs: this.opts.timeoutMs ?? 120_000, signal: request.signal },
    )) as OllamaGenerateResponse;

    if (data.error) {
      throw new VeyaError({
        code: data.error.toLowerCase().includes("not found") ? "provider_model_unavailable" : "internal",
        userMessage: data.error.toLowerCase().includes("not found")
          ? "That model isn't available in Ollama. Install it and try again."
          : "Ollama returned an error while generating.",
        detail: data.error,
      });
    }
    if (!data.response) {
      throw new VeyaError({ code: "internal", userMessage: "Ollama returned an empty response." });
    }
    return { text: data.response };
  }

  async healthCheck(): Promise<ProviderHealth> {
    try {
      const version = (await requestJson(
        this.endpoint("/api/version"),
        { method: "GET" },
        { ...this.opts, timeoutMs: 5000 },
      )) as { version?: string };
      return { ok: true, message: `Connected${version.version ? ` (Ollama ${version.version})` : ""}` };
    } catch (err) {
      if (err instanceof VeyaError) {
        return { ok: false, message: "Ollama isn't running.", latencyMs: undefined };
      }
      return { ok: false, message: "Ollama isn't running." };
    }
  }
}