/**
 * Provider registry — turns persisted settings into a concrete AIProvider.
 */

import type { AIProvider, ProviderConfig, ProviderId } from "@veya/core";
import { AnthropicProvider } from "./anthropic.js";
import { GeminiProvider } from "./gemini.js";
import { LMStudioProvider, OpenAICompatibleProvider, OpenAIProvider, OpenRouterProvider } from "./openai-compatible.js";
import { OLLAMA_DEFAULT_URL, OllamaProvider } from "./ollama.js";

export interface ProviderBuildOptions {
  ollamaBaseUrl?: string;
}

export function buildProvider(config: ProviderConfig, opts: ProviderBuildOptions = {}): AIProvider {
  switch (config.id) {
    case "ollama": {
      const baseUrl = config.baseUrl?.trim() || opts.ollamaBaseUrl?.trim() || OLLAMA_DEFAULT_URL;
      const provider = new OllamaProvider(baseUrl);
      if (config.model) {
        const original = provider.listModels.bind(provider);
        provider.listModels = async () => (await original()).filter((m) => m.id === config.model);
      }
      return provider;
    }
    case "openai":
      return OpenAIProvider(config.apiKey ?? "");
    case "openrouter":
      return OpenRouterProvider(config.apiKey ?? "");
    case "anthropic":
      return new AnthropicProvider(config.apiKey ?? "");
    case "gemini":
      return new GeminiProvider(config.apiKey ?? "");
    case "openai-compatible":
      return new OpenAICompatibleProvider({
        name: "OpenAI-compatible",
        baseUrl: config.baseUrl ?? "http://localhost:1234/v1",
        apiKey: config.apiKey,
        extraHeaders: config.extraHeaders,
        kind: "local",
        defaultModel: config.model,
      });
    default:
      return LMStudioProvider(undefined, config.model);
  }
}

export function providerMeta(id: ProviderId) {
  const all: Record<ProviderId, { name: string; kind: "local" | "cloud"; needsKey: boolean }> = {
    ollama: { name: "Ollama", kind: "local", needsKey: false },
    openai: { name: "OpenAI", kind: "cloud", needsKey: true },
    openrouter: { name: "OpenRouter", kind: "cloud", needsKey: true },
    anthropic: { name: "Anthropic", kind: "cloud", needsKey: true },
    gemini: { name: "Gemini", kind: "cloud", needsKey: true },
    "openai-compatible": { name: "OpenAI-compatible", kind: "local", needsKey: false },
  };
  return all[id];
}