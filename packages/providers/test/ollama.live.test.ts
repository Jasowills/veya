import { describe, it, expect } from "vitest";
import { OllamaProvider, OLLAMA_DEFAULT_URL } from "../src/ollama.js";

const live = process.env.VEYA_OLLAMA_TEST === "1";

describe.skipIf(!live)("OllamaProvider (live)", () => {
  const provider = new OllamaProvider(OLLAMA_DEFAULT_URL);

  it("reports healthy against the running instance", async () => {
    const health = await provider.healthCheck();
    expect(health.ok).toBe(true);
  });

  it("lists installed models", async () => {
    const models = await provider.listModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models.some((m) => m.local)).toBe(true);
  });

  it("generates text with a local model", async () => {
    const res = await provider.generate({
      model: "qwen2.5:7b",
      system: "Reply with exactly: PONG",
      user: "ping",
      maxTokens: 8,
    });
    expect(res.text.toLowerCase()).toContain("pong");
  }, 120_000);
});