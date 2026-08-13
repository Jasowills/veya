import { useCallback, useEffect, useState } from "react";
import { Wordmark } from "@veya/shared";
import type { RuntimeConfig } from "../shared/messages.js";
import { Button, Card } from "../ui/components.js";

const PROVIDERS: Array<{ id: RuntimeConfig["provider"]; name: string; needsKey: boolean; defaultBase?: string }> = [
  { id: "ollama", name: "Ollama (local)", needsKey: false, defaultBase: "http://localhost:11434" },
  { id: "openai", name: "OpenAI", needsKey: true },
  { id: "anthropic", name: "Anthropic", needsKey: true },
  { id: "gemini", name: "Google Gemini", needsKey: true },
  { id: "openrouter", name: "OpenRouter", needsKey: true },
  { id: "groq", name: "Groq", needsKey: true },
  { id: "lmstudio", name: "LM Studio (local)", needsKey: false, defaultBase: "http://localhost:1234/v1" },
];

function send<T>(msg: { kind: "status" }): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (res: { ok: boolean; result?: unknown; error?: string }) => {
      const err = chrome.runtime.lastError;
      if (err) return reject(new Error(err.message));
      if (!res?.ok) return reject(new Error(res?.error ?? "Veya failed to respond."));
      resolve(res.result as T);
    });
  });
}

export function Options() {
  const [config, setConfig] = useState<RuntimeConfig>({ provider: "ollama", model: "" });
  const [status, setStatus] = useState<{ provider: string; model?: string; healthy: boolean } | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const stored = await chrome.storage.local.get("veya.config.v1");
      const c = (stored["veya.config.v1"] as RuntimeConfig) ?? { provider: "ollama", model: "" };
      setConfig({ ...c });
      setLoading(false);
      void refreshStatus();
    })();
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await send<{ provider: string; model?: string; healthy: boolean }>({ kind: "status" });
      setStatus(s);
    } catch {
      setStatus(null);
    }
  }, []);

  const save = useCallback(async () => {
    setSaved(false);
    await chrome.storage.local.set({ "veya.config.v1": config });
    setSaved(true);
    await refreshStatus();
    setTimeout(() => setSaved(false), 1500);
  }, [config, refreshStatus]);

  const provider = PROVIDERS.find((p) => p.id === config.provider);

  return (
    <div className="op-root">
      <header className="op-header">
        <Wordmark size={16} />
        <Button variant="ghost" size="sm" onClick={save} loading={loading}>
          {saved ? "Saved" : "Save settings"}
        </Button>
      </header>

      {status ? (
        <div className={`op-status ${status.healthy ? "op-healthy" : "op-down"}`}>
          {status.healthy ? `Connected to ${status.provider}${status.model ? ` · ${status.model}` : ""}` : `${status.provider} is unreachable`}
        </div>
      ) : (
        <div className="op-status op-down">Checking provider…</div>
      )}

      <section className="op-section">
        <h2 className="op-section-title">Model provider</h2>
        <div className="op-field">
          <label className="op-field-label" htmlFor="provider">
            Provider
          </label>
          <select
            id="provider"
            className="op-select"
            value={config.provider}
            onChange={(e) => setConfig({ ...config, provider: e.target.value as RuntimeConfig["provider"] })}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {provider?.needsKey ? (
          <div className="op-field">
            <label className="op-field-label" htmlFor="apiKey">
              API key
            </label>
            <input
              id="apiKey"
              type="password"
              className="op-input"
              value={config.apiKey ?? ""}
              placeholder="sk-…"
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            />
            <p className="op-note">
              Stored locally in your browser. Veya never transmits it anywhere except the provider's own API — and only
              to the provider you selected.
            </p>
          </div>
        ) : (
          <div className="op-field">
            <label className="op-field-label" htmlFor="baseUrl">
              Base URL
            </label>
            <input
              id="baseUrl"
              className="op-input"
              value={config.baseUrl ?? provider?.defaultBase ?? ""}
              placeholder={provider?.defaultBase}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
            />
          </div>
        )}

        <div className="op-field">
          <label className="op-field-label" htmlFor="model">
            Model
          </label>
          <input
            id="model"
            className="op-input"
            value={config.model ?? ""}
            placeholder={config.provider === "ollama" ? "qwen2.5:7b" : "e.g. gpt-4o-mini"}
            onChange={(e) => setConfig({ ...config, model: e.target.value })}
          />
        </div>
      </section>

      <section className="op-section">
        <h2 className="op-section-title">Privacy</h2>
        <Card>
          <p className="op-note">
            Veya runs locally by default. With a local provider (Ollama, LM Studio) your profile and the pages you fill
            never leave your machine. With a cloud provider, only the prompt needed to answer is sent to that provider —
            no tracking, no Veya backend, no telemetry.
          </p>
        </Card>
      </section>

      <section className="op-section">
        <h2 className="op-section-title">Career profile</h2>
        <div className="op-profile-empty">
          Your career profile powers every fill. Import it here or let Veya guide you through building it — everything
          stays in this browser.
        </div>
      </section>
    </div>
  );
}
