/**
 * `veya resume` — parse a résumé PDF into a profile.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { parseResumePdf } from "@veya/document-engine";
import { resumeToProfile } from "./resume-mapper.js";

export async function resumeParse(file: string, out?: string): Promise<void> {
  const bytes = readFileSync(file);
  const resume = await parseResumePdf(new Uint8Array(bytes));
  const profile = resumeToProfile(resume);

  const lines: string[] = [];
  lines.push(`parsed ${file}`);
  lines.push(`  contact:  ${resume.contact.email ?? "?"} · ${resume.contact.phone ?? "?"}`);
  lines.push(`  skills:   ${profile.skills.map((s) => s.name).join(", ") || "none detected"}`);
  lines.push(`  jobs:     ${profile.experience.length}`);
  lines.push(`  schools:  ${profile.education.length}`);
  lines.push("");
  lines.push("review and correct the result before importing:");
  lines.push(`    veya profile import <saved-json>`);

  const json = JSON.stringify(profile, null, 2);
  if (out) {
    writeFileSync(out, json);
    lines.push(`wrote profile seed to ${out}`);
  } else {
    lines.push("");
    lines.push(json);
  }
  console.log(lines.join("\n"));
}
