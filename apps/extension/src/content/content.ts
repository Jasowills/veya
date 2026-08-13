/**
 * Veya content script — runs in the page's isolated world.
 *
 * Responsibilities:
 *  - Scan the visible application form with the form engine.
 *  - Apply values to fields on instruction from the service worker.
 *  - Watch for dynamic form changes and re-scan.
 *
 * Never holds API keys or profile data longer than a message turn, and never
 * forwards secrets to the page.
 */

import { FormScanner, setFieldValue } from "@veya/form-engine";
import type { DetectedField } from "@veya/core";
import type { B2C, C2B } from "../shared/messages.js";

let scanner = new FormScanner();

function currentRoot(): HTMLElement | undefined {
  const forms = Array.from(document.querySelectorAll<HTMLFormElement>("form")).filter(
    (f) => f.offsetParent !== null || f.getClientRects().length > 0,
  );
  const target = forms.reduce<HTMLFormElement | null>(
    (best, f) => {
      const count = f.querySelectorAll("input, select, textarea").length;
      return count > (best?.querySelectorAll("input, select, textarea").length ?? 0) ? f : best;
    },
    null,
  );
  return target ?? document.body;
}

function scan(): DetectedField[] {
  const root = currentRoot();
  return root ? scanner.scan(root) : [];
}

function send(msg: C2B): void {
  try {
    void chrome.runtime.sendMessage(msg);
  } catch {
    // Background not reachable; ignore.
  }
}

function trySetValue(elementId: string, value: string): boolean {
  const el = scanner.elementFor(elementId);
  if (!el) return false;
  try {
    setFieldValue(el, value);
    return true;
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((msg: B2C, _sender, sendResponse) => {
  if (msg.kind === "ping") {
    sendResponse({ ok: true });
    return;
  }
  if (msg.kind === "scanRequest") {
    const fields = scan();
    send({ kind: "scanResult", fields, url: location.href, title: document.title });
    sendResponse({ ok: true, fields, url: location.href, title: document.title });
    return;
  }
  if (msg.kind === "fillRequest") {
    const values = msg.answers ?? [];
    const results = values.map((v) => ({ elementId: v.elementId, ok: trySetValue(v.elementId, v.value) }));
    send({ kind: "fillResult", results });
    sendResponse({ ok: true, results });
    return;
  }
  sendResponse({ ok: true });
});

void scan();