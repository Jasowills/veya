import { useCallback, useEffect, useRef, useState } from "react";
import { Wordmark } from "@veya/shared";
import type { CareerProfile } from "@veya/profile";
import type { Request, Response, RuntimeConfig } from "../shared/messages.js";
import { Button } from "../ui/components.js";
import { ProfileSection } from "./ProfileSection.js";

const PROVIDERS: Array<{ id: RuntimeConfig["provider"]; name: string; needsKey: boolean; defaultBase?: string }> = [
  { id: "ollama", name: "Ollama (local)", needsKey: false, defaultBase: "http://localhost:11434" },
  { id: "openai", name: "OpenAI", needsKey: true },
  { id: "anthropic", name: "Anthropic", needsKey: true },
  { id: "gemini", name: "Google Gemini", needsKey: true },
  { id: "openrouter", name: "OpenRouter", needsKey: true },
  { id: "groq", name: "Groq", needsKey: true },
  { id: "lmstudio", name: "LM Studio (local)", needsKey: false, defaultBase: "http://localhost:1234/v1" },
];

function send<T>(msg: Request): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (res: Response | undefined) => {
      const err = chrome.runtime.lastError;
      if (err) return reject(new Error(err.message));
      if (!res?.ok) return reject(new Error(res?.error ?? "Veya failed to respond."));
      resolve(res.result as T);
    });
  });
}

type Status = { provider: string; model?: string; healthy: boolean; configured: boolean } | null;

export function Options() {
  const [config, setConfig] = useState<RuntimeConfig>({ provider: "ollama", model: "" });
  const [status, setStatus] = useState<Status>(null);
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [wasConfigured, setWasConfigured] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [resumeBusy, setResumeBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await chrome.storage.local.get("veya.config.v1");
      const c = (stored["veya.config.v1"] as RuntimeConfig) ?? { provider: "ollama", model: "" };
      setConfig({ ...c });
      setWasConfigured(!!stored["veya.config.v1"]);
      setLoading(false);
      void refreshStatus();
      void loadProfile();
    })();
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const s = await send<Status>({ kind: "status" });
      setStatus(s);
    } catch {
      setStatus(null);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const p = await send<CareerProfile>({ kind: "getProfile" });
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  const save = useCallback(async () => {
    setSaved(false);
    await chrome.storage.local.set({ "veya.config.v1": config });
    setSaved(true);
    setWasConfigured(true);
    await refreshStatus();
    setTimeout(() => setSaved(false), 1500);
  }, [config, refreshStatus]);

  const saveProfile = useCallback(async () => {
    if (!profile) return;
    try {
      await send({ kind: "saveProfile", profile });
      setNotice("Profile saved to this browser.");
    } catch (e) {
      setNotice(`Could not save: ${(e as Error).message}`);
    }
    setTimeout(() => setNotice(null), 3000);
  }, [profile]);

  const exportProfile = useCallback(async () => {
    try {
      const json = await send<string>({ kind: "exportProfile" });
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "veya-profile.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setNotice(`Export failed: ${(e as Error).message}`);
    }
  }, []);

  const importProfile = useCallback(
    async (file: File) => {
      const json = await file.text();
      try {
        await send({ kind: "importProfile", json });
        await loadProfile();
        setNotice("Profile imported.");
      } catch (e) {
        setNotice(`Import failed: ${(e as Error).message}`);
      }
      setTimeout(() => setNotice(null), 3000);
    },
    [loadProfile],
  );

  const provider = PROVIDERS.find((pr) => pr.id === config.provider);
  const isFirstTime = !wasConfigured;

  return (
    <div className="op-root">
      <header className="op-header">
        <Wordmark size={16} />
        {!isFirstTime ? (
          <Button variant="ghost" size="sm" onClick={save} loading={loading}>
            {saved ? "Saved" : "Save settings"}
          </Button>
        ) : null}
      </header>

      {notice ? <div className="op-status">{notice}</div> : null}

      {status?.configured ? (
        <div className={`op-status ${status.healthy ? "op-healthy" : "op-down"}`}>
          {status.healthy ? `Connected to ${status.provider}${status.model ? ` · ${status.model}` : ""}` : `${status.provider} is unreachable`}
        </div>
      ) : null}

      {/* ── Provider section — always visible ─────────────────────── */}
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
            {PROVIDERS.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.name}
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
              Stored locally in your browser. Veya never transmits it anywhere except the provider's own API.
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

        {isFirstTime ? (
          <Button variant="primary" full onClick={save} loading={loading}>
            {saved ? "Saved — go back to Veya" : "Save provider"}
          </Button>
        ) : null}
      </section>

      {/* ── Profile section — only after provider is saved ──────── */}
      {wasConfigured ? (
        <ProfileSection
          profile={profile}
          onChange={setProfile}
          onSave={saveProfile}
          onNotice={setNotice}
        />
      ) : null}
    </div>
  );
}
