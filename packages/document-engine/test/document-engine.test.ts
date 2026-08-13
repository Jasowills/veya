import { describe, it, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import type { AIProvider } from "@veya/core";
import { emptyProfile, type CareerProfile } from "@veya/profile";
import { composeCoverLetterPdf, composeTextPdf, generateCoverLetter, parseResumePdf, parseResumeText } from "../src/index.js";

const SAMPLE_RESUME = `Ada Lovelace
ada@example.com | +1 (555) 010-0200 | linkedin.com/in/adalovelace | London, UK

SUMMARY
Mathematician and engineer with a passion for machines.

TECHNICAL SKILLS
TypeScript, Rust, React, Distributed Systems, PostgreSQL

EXPERIENCE
Analytical Engine Co — Senior Engineer
Jan 2020 – Present
- Designed the difference engine API used by 40 teams.
- Cut cold-start latency by 60%.

Babbage Machines — Engineer
2017 - 2019
- Shipped the analytical engine v2.

EDUCATION
University of London, BSc Mathematics (2015 - 2017)
`;

describe("parseResumeText", () => {
  it("detects contact from the preamble", () => {
    const r = parseResumeText(SAMPLE_RESUME);
    expect(r.contact.email).toBe("ada@example.com");
    expect(r.contact.phone).toBe("+15550100200");
    expect(r.contact.linkedin).toBe("linkedin.com/in/adalovelace");
  });

  it("extracts skills", () => {
    const r = parseResumeText(SAMPLE_RESUME);
    expect(r.skills).toContain("TypeScript");
    expect(r.skills).toContain("Distributed Systems");
  });

  it("groups experience blocks with company, title, dates and bullets", () => {
    const r = parseResumeText(SAMPLE_RESUME);
    expect(r.experience).toHaveLength(2);
    const first = r.experience[0]!;
    expect(first.company).toBe("Analytical Engine Co");
    expect(first.title).toBe("Senior Engineer");
    expect(first.dates).toContain("2020");
    expect(first.bullets).toHaveLength(2);
  });

  it("collects education lines", () => {
    const r = parseResumeText(SAMPLE_RESUME);
    expect(r.education.join(" ")).toContain("University of London");
  });

  it("lists parsed sections in order", () => {
    const r = parseResumeText(SAMPLE_RESUME);
    expect(r.sections.map((s) => s.heading)).toEqual(["preamble", "SUMMARY", "TECHNICAL SKILLS", "EXPERIENCE", "EDUCATION"]);
  });
});

async function buildSamplePdfBytes(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage([612, 792]).drawText("Ada Lovelace — Software Engineer\n\nSKILLS\nTypeScript, Rust\n\nEXPERIENCE\nAcme — Engineer\n2020 - 2023\n- Built things.", {
    x: 50,
    y: 700,
    size: 11,
    font,
    lineHeight: 16,
    maxWidth: 500,
  });
  return doc.save();
}

describe("parseResumePdf (pdf-parse@2 roundtrip)", () => {
  it("extracts text from a generated PDF and parses it", async () => {
    const bytes = await buildSamplePdfBytes();
    const r = await parseResumePdf(bytes);
    expect(r.text).toContain("Ada Lovelace");
    expect(r.skills).toContain("TypeScript");
    expect(r.experience[0]?.company).toBe("Acme");
  });
});

describe("composeTextPdf", () => {
  it("produces a valid PDF that pdf-parse can read back", async () => {
    const bytes = await composeTextPdf("Dear Hiring Team,\n\nI am excited to apply.", { heading: "Cover Letter" });
    expect(bytes[0]).toBe(0x25); // '%'
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const parsed = await parseResumePdf(bytes);
    expect(parsed.text).toContain("excited to apply");
  });

  it("paginates long text across multiple pages", async () => {
    const paragraph = "lorem ipsum ".repeat(60);
    const bytes = await composeTextPdf(paragraph.repeat(40));
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(1);
  });
});

describe("generateCoverLetter", () => {
  const profile: CareerProfile = {
    ...emptyProfile(),
    identity: { firstName: "Ada", lastName: "Lovelace" },
  };

  function fakeProvider(text: string): AIProvider {
    return {
      id: "ollama",
      name: "Fake",
      kind: "local",
      async listModels() {
        return [];
      },
      async generate() {
        return { text };
      },
      async healthCheck() {
        return { ok: true, message: "ok" };
      },
    };
  }

  it("returns the trimmed generated letter", async () => {
    const letter = await generateCoverLetter({
      provider: fakeProvider("  Dear Acme,\n\nI am Ada.  "),
      model: "test",
      profile,
      application: { company: "Acme", role: "Engineer" },
    });
    expect(letter.text).toBe("Dear Acme,\n\nI am Ada.");
    expect(letter.createdAt).toBeGreaterThan(0);
  });

  it("renders a generated letter to a PDF", async () => {
    const bytes = await composeCoverLetterPdf("Dear Acme,\n\nI would love to join.");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });
});
