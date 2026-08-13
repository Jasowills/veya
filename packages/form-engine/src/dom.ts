/**
 * DOM scanning + element registry for the content script.
 *
 * One FormScanner lives per document (content script). It discovers form
 * fields, extracts deterministic hints, and retains element references keyed
 * by a stable `elementId` that can travel across extension contexts.
 */

import type { DetectedField, FieldElementType } from "@veya/core";
import { FIELD_TO_CATEGORY } from "@veya/core";
import { type FieldHintSet, normalizedFieldId } from "./normalize.js";

const FIELD_SELECTOR = 'input, select, textarea, [contenteditable="true"], [role="textbox"]';
const SKIPPED_INPUT_TYPES = new Set(["hidden", "submit", "button", "reset", "image"]);
const SENSITIVE_ALWAYS = new Set(["password"]);

export class FormScanner {
  private registry = new Map<string, HTMLElement>();
  private nextId = 0;

  scan(root: ParentNode): DetectedField[] {
    this.registry.clear();
    const elements = Array.from(root.querySelectorAll<HTMLElement>(FIELD_SELECTOR));
    const seenRadioNames = new Set<string>();
    const fields: DetectedField[] = [];

    for (const el of elements) {
      if (!this.isVisible(el)) continue;
      if (tag(el) === "INPUT") {
        const inputType = (el as HTMLInputElement).type;
        if (SKIPPED_INPUT_TYPES.has(inputType)) continue;
        if (SENSITIVE_ALWAYS.has(inputType)) continue;
        if (inputType === "radio") {
          const name = (el as HTMLInputElement).name;
          if (seenRadioNames.has(name)) continue;
          seenRadioNames.add(name);
        }
      }
      const elementId = `f${this.nextId++}`;
      this.registry.set(elementId, el);

      const hints = this.extractHints(el);
      const options = this.collectOptions(el);
      const type = this.elementType(el);
      const normalized = normalizedFieldId({ ...hints, options });
      const category = FIELD_TO_CATEGORY[normalized] ?? "UNKNOWN";
      const sensitive = category === "UNKNOWN" && type !== "text" ? false : this.isSensitive(el);

      fields.push({
        elementId,
        normalized,
        category,
        label:
          hints.labels[0] ??
          el.getAttribute("aria-label") ??
          ((el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).name || el.id || "Field"),
        type,
        sensitive,
        required: el.matches("[required], [aria-required=true]"),
        hints: this.flattenHints(hints),
        options,
      });
    }
    return fields;
  }

  elementFor(elementId: string): HTMLElement | undefined {
    return this.registry.get(elementId);
  }

  /** Resolve a set of ids back to live elements (for batch fills). */
  elementsFor(ids: string[]): Array<{ elementId: string; element: HTMLElement }> {
    return ids.flatMap((id) => {
      const element = this.registry.get(id);
      return element ? [{ elementId: id, element }] : [];
    });
  }

  private extractHints(el: HTMLElement): FieldHintSet {
    const labels: string[] = [];
    const surrounding: string[] = [];

    // label[for=id]
    const doc = el.ownerDocument;
    if (el.id && doc) {
      const label = doc.querySelector<HTMLLabelElement>(`label[for="${cssEscape(el.id)}"]`);
      if (label?.textContent) labels.push(label.textContent.trim());
    }
    // wrapping label
    const wrapping = el.closest("label");
    if (wrapping?.textContent) labels.push(wrapping.textContent.trim());
    // aria-label
    const aria = el.getAttribute("aria-label");
    if (aria) labels.push(aria);
    // aria-labelledby
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const doc = el.ownerDocument;
      for (const id of labelledBy.split(/\s+/)) {
        const node = doc.getElementById(id);
        if (node?.textContent) labels.push(node.textContent.trim());
      }
    }
    // fieldset legend
    const fieldset = el.closest("fieldset");
    const legend = fieldset?.querySelector("legend");
    if (legend?.textContent) surrounding.push(legend.textContent.trim());
    // nearest heading as group context
    const heading = nearestHeading(el);
    if (heading?.textContent) surrounding.push(heading.textContent.trim());

    const name = el.getAttribute("name") ?? undefined;
    const id = el.getAttribute("id") ?? undefined;
    const placeholder = el.getAttribute("placeholder") ?? undefined;

    return { labels, name, id, placeholder, surrounding };
  }

  private elementType(el: HTMLElement): FieldElementType {
    const t = tag(el);
    if (t === "TEXTAREA") return "textarea";
    if (t === "SELECT") return "select";
    if (t === "INPUT") {
      const type = (el as HTMLInputElement).type as string;
      if (["email", "tel", "url", "number", "date"].includes(type)) return type as FieldElementType;
      if (type === "checkbox") return "checkbox";
      if (type === "radio") return "radio";
      if (type === "file") return "file";
      return "text";
    }
    if (el.getAttribute("contenteditable") === "true" || el.getAttribute("role") === "textbox") return "contenteditable";
    if (el.getAttribute("role") === "combobox") return "custom";
    return "custom";
  }

  private isSensitive(el: HTMLElement): boolean {
    const corpus = this.flattenHints(this.extractHints(el)).join(" ").toLowerCase();
    return /authoriz|sponsor|visa|salary|compensat|gender|disabil|veteran|race|ethnic|legal history|convict|age|birth|social security/i.test(corpus);
  }

  private collectOptions(el: HTMLElement): string[] | undefined {
    if (tag(el) === "SELECT") {
      const select = el as HTMLSelectElement;
      return Array.from(select.options)
        .filter((o) => o.value && o.value !== "")
        .map((o) => o.label || o.value);
    }
    if (tag(el) === "INPUT" && (el as HTMLInputElement).type === "radio") {
      const doc = el.ownerDocument;
      const name = (el as HTMLInputElement).name;
      const radios = doc.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${cssEscape(name)}"]`);
      return Array.from(radios)
        .map((r) => {
          const label =
            (r.id && doc.querySelector(`label[for="${cssEscape(r.id)}"]`)?.textContent?.trim()) ||
            r.closest("label")?.textContent?.trim() ||
            r.value ||
            "";
          return label;
        })
        .filter(Boolean);
    }
    return undefined;
  }

  private flattenHints(hints: FieldHintSet): string[] {
    return [...hints.labels, hints.name ?? "", hints.id ?? "", hints.placeholder ?? "", ...hints.surrounding].filter(Boolean);
  }

  private isVisible(el: HTMLElement): boolean {
    if (tag(el) === "INPUT" && (el as HTMLInputElement).type === "hidden") return false;
    if (el.hasAttribute("aria-hidden") && el.getAttribute("aria-hidden") === "true") return false;
    const style = el.ownerDocument.defaultView?.getComputedStyle(el);
    if (style && (style.display === "none" || style.visibility === "hidden")) return false;
    return true;
  }
}

function tag(el: HTMLElement): string {
  return el.tagName.toUpperCase();
}

function nearestHeading(el: HTMLElement): HTMLElement | null {
  const headings = "h1,h2,h3,h4,h5,h6";
  let current: HTMLElement | null = el;
  const maxUp = 6;
  let up = 0;
  while (current && up < maxUp) {
    current = current.parentElement;
    if (!current) break;
    const heading = current.querySelector<HTMLElement>(`${headings}:last-of-type`);
    if (heading) return heading;
    up += 1;
  }
  return null;
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && "escape" in CSS) return CSS.escape(value);
  return value.replace(/["\\]/g, "\\$&");
}