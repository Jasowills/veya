/**
 * Shared HTTP utilities for providers.
 *
 * Runs in extension service workers (Chrome) and Node (CLI). Uses fetch +
 * AbortSignal so it is environment-agnostic.
 */

import { VeyaError } from "@veya/shared";

export interface HttpOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function requestJson(
  url: string,
  init: RequestInit,
  opts: HttpOptions = {},
): Promise<unknown> {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onOuterAbort = () => controller.abort();
  opts.signal?.addEventListener("abort", onOuterAbort, { once: true });

  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    throw new VeyaError({
      code: "provider_connection",
      userMessage: "Couldn't reach the AI provider.",
      detail: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      retryable: true,
      cause: err,
    });
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onOuterAbort);
  }

  if (!res.ok) {
    const body = await safeText(res);
    throw new VeyaError({
      code: classifyStatus(res.status),
      userMessage: httpMessage(res.status),
      detail: `HTTP ${res.status}: ${body.slice(0, 300)}`,
      retryable: res.status >= 500 || res.status === 429,
    });
  }

  try {
    return (await res.json()) as unknown;
  } catch (err) {
    throw new VeyaError({
      code: "internal",
      userMessage: "The provider returned an unreadable response.",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function requestText(
  url: string,
  init: RequestInit,
  opts: HttpOptions = {},
): Promise<string> {
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onOuterAbort = () => controller.abort();
  opts.signal?.addEventListener("abort", onOuterAbort, { once: true });

  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    throw new VeyaError({
      code: "provider_connection",
      userMessage: "Couldn't reach the AI provider.",
      detail: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      retryable: true,
      cause: err,
    });
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onOuterAbort);
  }

  if (!res.ok) {
    const body = await safeText(res);
    throw new VeyaError({
      code: classifyStatus(res.status),
      userMessage: httpMessage(res.status),
      detail: `HTTP ${res.status}: ${body.slice(0, 300)}`,
      retryable: res.status >= 500 || res.status === 429,
    });
  }
  return res.text();
}

function safeText(res: Response): Promise<string> {
  return res.text().catch(() => "");
}

function classifyStatus(status: number): "provider_authentication" | "provider_rate_limit" | "provider_connection" | "internal" {
  if (status === 401 || status === 403) return "provider_authentication";
  if (status === 429) return "provider_rate_limit";
  if (status >= 500) return "provider_connection";
  return "internal";
}

function httpMessage(status: number): string {
  if (status === 401 || status === 403) return "The provider rejected the API key.";
  if (status === 429) return "The provider is rate-limiting requests. Try again shortly.";
  if (status >= 500) return "The provider is having trouble. Try again.";
  return "The provider returned an unexpected response.";
}