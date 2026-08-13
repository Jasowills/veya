import { describe, it, expect, beforeEach } from "vitest";
import { FormScanner } from "../src/dom.js";
import { setFieldValue } from "../src/value.js";
import { JSDOM } from "jsdom";

let dom: JSDOM;
let doc: Document;

beforeEach(() => {
  dom = new JSDOM(`<!DOCTYPE html><body></body>`);
  doc = dom.window.document;
});

function loadForm(html: string): HTMLElement {
  const container = doc.createElement("div");
  container.innerHTML = html;
  doc.body.appendChild(container);
  return container;
}

describe("FormScanner", () => {
  it("detects labeled input fields with hints", () => {
    loadForm(`
      <label for="fname">First name</label>
      <input id="fname" name="firstName" required />
      <label for="email">Email address</label>
      <input id="email" type="email" name="email" />
    `);
    const scanner = new FormScanner();
    const fields = scanner.scan(doc);
    expect(fields).toHaveLength(2);
    const firstName = fields.find((f) => f.normalized === "FIRST_NAME");
    expect(firstName?.required).toBe(true);
    expect(firstName?.category).toBe("PERSONAL_INFORMATION");
    expect(fields.find((f) => f.normalized === "EMAIL")?.type).toBe("email");
  });

  it("skips hidden and submit inputs", () => {
    loadForm(`
      <input type="hidden" name="csrf" value="x" />
      <input type="submit" value="Apply" />
      <label>Name <input name="name" /></label>
    `);
    const fields = new FormScanner().scan(doc);
    expect(fields).toHaveLength(1);
  });

  it("treats a radio group as a single field with options", () => {
    loadForm(`
      <fieldset>
        <legend>Are you authorized to work in this country?</legend>
        <label><input type="radio" name="auth" value="yes" /> Yes</label>
        <label><input type="radio" name="auth" value="no" /> No</label>
      </fieldset>
    `);
    const fields = new FormScanner().scan(doc);
    expect(fields).toHaveLength(1);
    expect(fields[0]?.normalized).toBe("WORK_AUTHORIZATION");
    expect(fields[0]?.options).toContain("Yes");
    expect(fields[0]?.options).toContain("No");
  });

  it("collects select options", () => {
    loadForm(`
      <label for="type">Employment type</label>
      <select id="type">
        <option value="">Select</option>
        <option value="ft">Full-time</option>
        <option value="pt">Part-time</option>
      </select>
    `);
    const fields = new FormScanner().scan(doc);
    expect(fields[0]?.normalized).toBe("EMPLOYMENT_TYPE");
    expect(fields[0]?.options).toEqual(["Full-time", "Part-time"]);
  });

  it("retains element references for later fills", () => {
    loadForm(`<label for="n">Name</label><input id="n" />`);
    const scanner = new FormScanner();
    const fields = scanner.scan(doc);
    const id = fields[0]?.elementId;
    expect(id).toBeDefined();
    expect(scanner.elementFor(id as string)).toBeDefined();
  });

  it("handles textareas and contenteditable fields", () => {
    loadForm(`
      <label for="sum">Professional summary</label>
      <textarea id="sum"></textarea>
      <label for="bio">Bio</label>
      <div id="bio" contenteditable="true"></div>
    `);
    const fields = new FormScanner().scan(doc);
    expect(fields.find((f) => f.normalized === "SUMMARY")).toBeDefined();
    expect(fields.find((f) => f.type === "contenteditable")).toBeDefined();
  });
});

describe("setFieldValue", () => {
  it("sets text inputs and fires input+change", () => {
    loadForm(`<input id="n" />`);
    const input = doc.getElementById("n") as HTMLInputElement;
    let inputFired = 0;
    let changeFired = 0;
    input.addEventListener("input", () => (inputFired += 1));
    input.addEventListener("change", () => (changeFired += 1));
    expect(setFieldValue(input, "Ada").ok).toBe(true);
    expect(input.value).toBe("Ada");
    expect(inputFired).toBeGreaterThan(0);
    expect(changeFired).toBeGreaterThan(0);
  });

  it("selects radio options by label", () => {
    loadForm(`
      <label><input type="radio" name="auth" value="yes" /> Yes</label>
      <label><input type="radio" name="auth" value="no" /> No</label>
    `);
    const radios = doc.querySelectorAll<HTMLInputElement>('input[name="auth"]');
    const result = setFieldValue(radios[0] as HTMLInputElement, "yes");
    expect(result.ok).toBe(true);
    expect((radios[0] as HTMLInputElement).checked).toBe(true);
  });

  it("sets selects by option label", () => {
    loadForm(`<select id="s"><option value="ft">Full-time</option><option value="pt">Part-time</option></select>`);
    const select = doc.getElementById("s") as HTMLSelectElement;
    expect(setFieldValue(select, "Part-time").ok).toBe(true);
    expect(select.value).toBe("pt");
  });

  it("refuses unknown options", () => {
    loadForm(`<select id="s"><option value="ft">Full-time</option></select>`);
    const select = doc.getElementById("s") as HTMLSelectElement;
    expect(setFieldValue(select, "Night shift").ok).toBe(false);
  });
});