/**
 * AI provider contract.
 *
 * Veya is model-agnostic. The extension never assumes a single vendor. Each
 * provider adapter implements this interface; the extension selects a provider
 * and model through settings.
 */

export interface ModelInfo {
  id: string;
  name: string;
  /** Capabilities advertised by the provider. */
  supportsThinking?: boolean;
  /** Local (Ollama, LM Studio) vs cloud. */
  local: boolean;
  contextWindow?: number;
}

export interface GenerateRequest {
  /** System-level instructions, already assembled by the prompt engine. */
  system: string;
  /** User turn content. */
  user: string;
  model: string;
  /** Warmth of generation. */
  temperature?: number;
  maxTokens?: number;
  /** Optional structured schema request. */
  jsonSchema?: unknown;
  signal?: AbortSignal;
}

export interface GenerateResponse {
  text: string;
  /** Provider-specific metadata. */
  raw?: Record<string, unknown>;
  /** Latency in ms when measured. */
  latencyMs?: number;
}

export interface ProviderHealth {
  ok: boolean;
  /** Human-readable status, e.g. "Connected" or "Ollama isn't running." */
  message: string;
  /** Detected model count when available. */
  modelCount?: number;
  latencyMs?: number;
}

export interface AIProvider {
  id: string;
  name: string;
  /** Local vs cloud classification for the settings UI. */
  kind: "local" | "cloud";
  listModels(): Promise<ModelInfo[]>;
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  healthCheck(): Promise<ProviderHealth>;
}

export type ProviderId = "ollama" | "openai" | "anthropic" | "gemini" | "openrouter" | "openai-compatible";

export interface ProviderConfig {
  id: ProviderId;
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  /** Extra headers for OpenAI-compatible endpoints (LM Studio etc.). */
  extraHeaders?: Record<string, string>;
}

export interface ProviderSelection {
  providerId: ProviderId;
  model: string;
}