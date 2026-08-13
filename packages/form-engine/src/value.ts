/**
 * Deterministic value setting compatible with React-controlled forms.
 *
 * Uses native prototype setters and bubbles real `input`/`change` events so
 * React (and most custom frameworks) see the update. Realm-agnostic: works
 * across iframe and shadow-DOM realms (no `instanceof` on global constructors).
 */

export interface SetValueResult {
  ok: boolean;
  reason?: string;
}

export function setFieldValue(el: HTMLElement, value: string): SetValueResult {
  const tag = el.tagName.toUpperCase();
  if (tag === "INPUT") return setInputValue(el as HTMLInputElement, value);
  if (tag === "TEXTAREA") return setTextLike(el as HTMLTextAreaElement, value);
  if (tag === "SELECT") return setSelectValue(el as HTMLSelectElement, value);
  if (el.getAttribute("contenteditable") === "true") {
    el.textContent = value;
    dispatchInputChange(el);
    return { ok: true };
  }
  return { ok: false, reason: "unsupported_element" };
}

function setInputValue(input: HTMLInputElement, value: string): SetValueResult {
  switch (input.type) {
    case "radio": {
      const doc = input.ownerDocument;
      const radios = doc.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${cssEscape(input.name)}"]`);
      const normalized = value.toLowerCase().trim();
      let chosen: HTMLInputElement | null = null;
      for (const r of radios) {
        const label = r.id ? doc.querySelector(`label[for="${cssEscape(r.id)}"]`)?.textContent?.trim().toLowerCase() ?? "" : "";
        if (r.value.toLowerCase() === normalized || label === normalized || label.includes(normalized)) {
          chosen = r;
          break;
        }
      }
      if (!chosen) {
        const options = Array.from(radios).map((r) => {
          const label = r.id ? doc.querySelector(`label[for="${cssEscape(r.id)}"]`)?.textContent?.trim().toLowerCase() ?? "" : "";
          return label || r.value.toLowerCase();
        });
        const idx = options.findIndex((o) => o.includes(normalized) || normalized.includes(o));
        if (idx >= 0) chosen = radios[idx] ?? null;
      }
      if (!chosen) return { ok: false, reason: "no_matching_radio" };
      if (!chosen.checked) {
        chosen.checked = true;
        chosen.dispatchEvent(new Event("change", { bubbles: true }));
        dispatchInput(chosen);
      }
      return { ok: true };
    }
    case "checkbox": {
      const checked = value.toLowerCase() === "true" || value.toLowerCase() === "yes" || value.toLowerCase() === "1";
      if (input.checked !== checked) {
        input.checked = checked;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        dispatchInput(input);
      }
      return { ok: true };
    }
    case "file":
      return { ok: false, reason: "file_input" };
    default:
      return setTextLike(input, value);
  }
}

function setTextLike(el: HTMLInputElement | HTMLTextAreaElement, value: string): SetValueResult {
  const setter = nativeValueSetter(el);
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
  dispatchInputChange(el);
  return { ok: true };
}

function setSelectValue(select: HTMLSelectElement, value: string): SetValueResult {
  const normalized = value.trim().toLowerCase();
  const options = Array.from(select.options);
  const match = options.find(
    (o) =>
      (o.label || o.text).trim().toLowerCase() === normalized ||
      o.value.trim().toLowerCase() === normalized ||
      (o.label || o.text).toLowerCase().includes(normalized) ||
      o.value.toLowerCase().includes(normalized),
  );
  if (!match) return { ok: false, reason: "no_matching_option" };
  select.value = match.value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  dispatchInput(select);
  return { ok: true };
}

/** Find the native `value` setter on the element's own prototype chain. */
function nativeValueSetter(el: HTMLElement): ((value: string) => void) | undefined {
  let proto = Object.getPrototypeOf(el);
  while (proto && proto !== Object.prototype) {
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && typeof desc.set === "function") return desc.set as (value: string) => void;
    proto = Object.getPrototypeOf(proto);
  }
  return undefined;
}

function dispatchInputChange(el: HTMLElement): void {
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: false }));
}

function dispatchInput(el: HTMLElement): void {
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && "escape" in CSS) return CSS.escape(value);
  return value.replace(/["\\]/g, "\\$&");
}