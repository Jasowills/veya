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

import { AnswerGenerator } from "@veya/ai";
import type { DetectedField } from "@veya/core";
import type { CareerProfile } from "@veya/profile";
import { ProfileRepository } from "@veya/profile";
import { buildProvider, providerMeta } from "@veya/providers";
import { ChromeKVStorage } from "../shared/chrome-storage.js";
import type {
  GenerateOutcome,
  JobContext,
  Request,
  Response,
  RuntimeConfig,
  ScanState,
} from "../shared/messages.js";
import { buildPlan, fillableAnswers, jobFromHeuristics } from "./logic.js";

const storage = new ChromeKVStorage();
const profileRepo = new ProfileRepository(storage);

const DEFAULT_CONFIG: RuntimeConfig = { provider: "ollama", model: "qwen2.5:7b" };

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

async function contentScan(
  tabId: number,
): Promise<{ url: string; title: string; fields: DetectedField[]; pageText: string }> {
  await ensureContentScript(tabId);
  const res = (await chrome.tabs.sendMessage(tabId, { kind: "scanRequest" })) as {
    ok: boolean;
    fields?: DetectedField[];
    url?: string;
    title?: string;
    pageText?: string;
  };
  if (!res?.ok) throw new Error("Content script did not respond.");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return {
    url: res.url ?? tab?.url ?? "about:blank",
    title: res.title ?? tab?.title ?? "",
    fields: res.fields ?? [],
    pageText: res.pageText ?? "",
  };
}

async function analyzeJob(pageText: string, heuristic: JobContext): Promise<JobContext> {
  const job: JobContext = { ...heuristic, description: pageText.slice(0, 4000) };
  const { provider, config } = await buildSettings();
  if (!config.model) return job;
  const profile = await profileRepo.loadProfile();
  const generator = new AnswerGenerator(provider, profile, { model: config.model });
  try {
    const parsed = (await generator.analyzeJob(pageText)) as Partial<JobContext>;
    return { ...job, ...parsed, description: pageText.slice(0, 4000) };
  } catch {
    return job;
  }
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
    case "generate":
      return generateAnswer(req.field, req.tone);
    case "status":
      return getStatus();
    case "openOptions":
      await chrome.runtime.openOptionsPage();
      return "ok";
    case "getProfile":
      return profileRepo.loadProfile();
    case "saveProfile":
      await profileRepo.saveProfile(req.profile);
      return "ok";
    case "exportProfile":
      return profileRepo.exportProfile();
    case "importProfile":
      await profileRepo.importProfile(req.json);
      return "ok";
  }
}

async function getProfile(): Promise<CareerProfile> {
  return profileRepo.loadProfile();
}

async function scanApplication(): Promise<ScanState> {
  const tabId = await activeTabId();
  const { url, title, fields, pageText } = await contentScan(tabId);
  const heuristic = jobFromHeuristics(url, title);
  const job = await analyzeJob(pageText, heuristic);
  const profile = await getProfile();
  const plan = buildPlan(profile, fields);
  scanState = { url, title, job, fields, plan };
  return scanState;
}

async function decideField(field: DetectedField): Promise<{ action: string }> {
  const profile = await getProfile();
  return buildPlan(profile, [field])[0]?.decision.action
    ? { action: buildPlan(profile, [field])[0]!.decision.action }
    : { action: "ask" };
}

async function setFieldValue(elementId: string, value: string): Promise<string> {
  if (!scanState) throw new Error("No active application. Scan first.");
  const entry = scanState.plan.find((p) => p.field.elementId === elementId);
  if (entry) entry.edited = value;
  return "ok";
}

async function generateAnswer(field: DetectedField, tone?: string): Promise<GenerateOutcome> {
  const { provider, config } = await buildSettings();
  if (!config.model) throw new Error("No model configured. Open settings and pick a model.");
  const profile = await getProfile();
  const decision = buildPlan(profile, [field])[0]?.decision;
  if (!decision || decision.action !== "generate") {
    throw new Error(`This field is not AI-generatable (${decision?.action ?? "unknown"}: ${decision?.reason ?? "no decision"}).`);
  }
  const generator = new AnswerGenerator(provider, profile, { model: config.model });
  const { job } = scanState ?? { job: undefined };
  const generated = await generator.generateAnswer({
    question: field.label,
    category: field.category,
    application: job ? { company: job.company, role: job.role, location: job.location, description: job.description } : undefined,
    tone,
  });
  return { text: generated.text, needsInput: generated.needsInput };
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
