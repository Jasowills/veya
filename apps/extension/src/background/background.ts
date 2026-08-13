/**
 * Veya background service worker.
 *
 * Orchestrates the extension: owns the profile + settings stores, builds the
 * AI provider, and routes messages between the content script and UI.
 *
 * The service worker never touches the page DOM and never exposes secrets to
 * page contexts. API keys live in chrome.storage.local and are only used to
 * configure the provider inside this worker.
 */

import { AnswerGenerator, DecisionEngine } from "@veya/ai";
import type { DetectedField } from "@veya/core";
import type { CareerProfile } from "@veya/profile";
import { ProfileRepository } from "@veya/profile";
import { buildProvider, providerMeta } from "@veya/providers";
import { ChromeKVStorage } from "../shared/chrome-storage.js";
import type { Request, Response, RuntimeConfig } from "../shared/messages.js";

const storage = new ChromeKVStorage();
const profileRepo = new ProfileRepository(storage);

const DEFAULT_CONFIG: RuntimeConfig = { provider: "ollama", model: "qwen2.5:7b" };

interface PlanEntry {
  field: DetectedField;
  decision: { action: string; value?: string; source: string; confidence: string; reason: string };
  edited?: string;
}

interface ScanState {
  url: string;
  title: string;
  fields: DetectedField[];
  plan: PlanEntry[];
}

let scanState: ScanState | null = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
});

chrome.runtime.onStartup.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
});

chrome.runtime.onMessage.addListener((msg: Request, _sender, sendResponse) => {
  void handle(msg)
    .then((result) => sendResponse({ ok: true, result } satisfies Response))
    .catch((e) => sendResponse({ ok: false, error: String((e as Error)?.message ?? e) } satisfies Response));
  return true;
});

async function activeTabId(): Promise<number> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab.");
  return tab.id;
}

async function ensureContentScript(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { kind: "ping" });
  } catch {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
  }
}

async function contentScan(tabId: number): Promise<{ url: string; title: string; fields: DetectedField[] }> {
  await ensureContentScript(tabId);
  const res = (await chrome.tabs.sendMessage(tabId, { kind: "scanRequest" })) as {
    ok: boolean;
    fields?: DetectedField[];
    url?: string;
    title?: string;
  };
  if (!res?.ok) throw new Error("Content script did not respond.");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return {
    url: res.url ?? tab?.url ?? location.origin,
    title: res.title ?? tab?.title ?? "",
    fields: res.fields ?? [],
  };
}

async function handle(req: Request): Promise<unknown> {
  switch (req.kind) {
    case "scan":
      return scanApplication();
    case "setValue":
      return setFieldValue(req.elementId, req.value);
    case "fill":
      return fillFields(req.answers);
    case "context":
      return getContext();
    case "decide":
      return decideField(req.field);
    case "status":
      return getStatus();
    case "openOptions":
      await chrome.runtime.openOptionsPage();
      return "ok";
  }
}

async function getProfile(): Promise<CareerProfile> {
  return profileRepo.loadProfile();
}

async function scanApplication(): Promise<ScanState> {
  const tabId = await activeTabId();
  const { url, title, fields } = await contentScan(tabId);
  const profile = await getProfile();
  const engine = new DecisionEngine();
  const plan: PlanEntry[] = fields.map((field) => {
    const decision = engine.decide({
      profile,
      fieldId: field.normalized as never,
      category: field.category,
      text: field.label,
      sensitive: field.sensitive,
    });
    return { field, decision };
  });
  scanState = { url, title, fields, plan };
  return scanState;
}

async function decideField(field: DetectedField): Promise<{ action: string }> {
  const profile = await getProfile();
  const decision = new DecisionEngine().decide({
    profile,
    fieldId: field.normalized as never,
    category: field.category,
    text: field.label,
    sensitive: field.sensitive,
  });
  return { action: decision.action };
}

async function setFieldValue(elementId: string, value: string): Promise<string> {
  if (!scanState) throw new Error("No active application. Scan first.");
  const entry = scanState.plan.find((p) => p.field.elementId === elementId);
  if (entry) entry.edited = value;
  return "ok";
}

async function fillFields(
  answers: Array<{ elementId: string; value: string }>,
): Promise<Array<{ elementId: string; ok: boolean; error?: string }>> {
  const tabId = await activeTabId();
  await ensureContentScript(tabId);
  const res = (await chrome.tabs.sendMessage(tabId, { kind: "fillRequest", answers })) as {
    ok: boolean;
    results?: Array<{ elementId: string; ok: boolean }>;
  };
  if (!res?.ok || !res.results) throw new Error("Fill failed in the content script.");
  return res.results;
}

async function getContext(): Promise<{ hasProfile: boolean; profileFields: string[] }> {
  const profile = await getProfile();
  const names = Object.keys(profile).filter((k) => !["savedAnswers", "preferences"].includes(k));
  return { hasProfile: Object.keys(profile).length > 0, profileFields: names };
}

async function buildSettings(): Promise<{ config: RuntimeConfig; provider: ReturnType<typeof buildProvider> }> {
  const stored = await storage.get<RuntimeConfig>("veya.config.v1");
  const config: RuntimeConfig = { ...DEFAULT_CONFIG, ...(stored ?? {}) };
  const provider = buildProvider({ id: config.provider } as never);
  return { config, provider };
}

async function getStatus(): Promise<{ provider: string; model: string | undefined; healthy: boolean }> {
  const { config, provider } = await buildSettings();
  let healthy = false;
  try {
    const models = await provider.listModels();
    healthy = models.length > 0;
  } catch {
    healthy = false;
  }
  return { provider: providerMeta(config.provider as never)?.name ?? config.provider, model: config.model, healthy };
}