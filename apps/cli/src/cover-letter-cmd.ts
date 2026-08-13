/**
 * `veya cover-letter` — generate a cover letter from the profile + job context.
 */

import { writeFileSync } from "node:fs";
import { composeCoverLetterPdf, generateCoverLetter } from "@veya/document-engine";
import { OllamaProvider, OLLAMA_DEFAULT_URL } from "@veya/providers";
import { openStore } from "./store.js";

export interface CoverLetterOptions {
  company?: string;
  role?: string;
  location?: string;
  description?: string;
  model: string;
  baseUrl?: string;
  out?: string;
  companyContext?: string;
}

export async function coverLetterCommand(storeDir: string, opts: CoverLetterOptions): Promise<void> {
  const { repo } = openStore(storeDir);
  const profile = await repo.loadProfile();

  if (!profile.identity?.firstName) {
    throw new Error("profile is empty — run `veya resume parse <file.pdf>` or `veya profile import` first.");
  }

  const provider = new OllamaProvider(opts.baseUrl ?? OLLAMA_DEFAULT_URL);
  const health = await provider.healthCheck();
  if (!health.ok) {
    throw new Error(`Ollama isn't reachable (${OLLAMA_DEFAULT_URL}). Start it, or check --base-url.`);
  }

  const letter = await generateCoverLetter({
    provider,
    model: opts.model,
    profile,
    application: {
      company: opts.company,
      role: opts.role,
      location: opts.location,
      description: opts.description,
    },
    companyContext: opts.companyContext,
  });

  if (opts.out) {
    if (opts.out.toLowerCase().endsWith(".pdf")) {
      const pdf = await composeCoverLetterPdf(letter.text);
      writeFileSync(opts.out, pdf);
      console.log(`cover letter written to ${opts.out}`);
    } else {
      writeFileSync(opts.out, letter.text);
      console.log(`cover letter written to ${opts.out}`);
    }
  } else {
    console.log(letter.text);
  }
}
