import { describe, it, expect } from "vitest";
import { OllamaProvider, OLLAMA_DEFAULT_URL } from "@veya/providers";
import { emptyProfile, type CareerProfile } from "@veya/profile";
import { composeCoverLetterPdf, generateCoverLetter } from "../src/index.js";

const live = process.env.VEYA_OLLAMA_TEST === "1";

describe.skipIf(!live)("document-engine (live Ollama)", () => {
  const provider = new OllamaProvider(OLLAMA_DEFAULT_URL);

  const profile: CareerProfile = {
    ...emptyProfile(),
    identity: { firstName: "Ada", lastName: "Lovelace" },
    experience: [
      { id: "e1", company: "Analytical Engine Co", title: "Senior Engineer", current: true, bullets: ["Built the difference engine API."], technologies: ["TypeScript"] },
    ],
    skills: [{ name: "TypeScript", level: "expert" }],
  };

  it("generates a cover letter and renders it to a PDF", async () => {
    const letter = await generateCoverLetter({
      provider,
      model: "llama3.2:1b",
      profile,
      application: { company: "Babbage Machines", role: "Staff Engineer", description: "Build analytical engines for our financial platform." },
    });
    expect(letter.text.length).toBeGreaterThan(40);
    const pdf = await composeCoverLetterPdf(letter.text);
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");
  }, 180_000);
});
