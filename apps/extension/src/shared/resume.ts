import { parseResumeText, resumeToProfile } from "@veya/document-engine/light";
import type { CareerProfile } from "@veya/profile";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

/** Extract plain text from a PDF locally, in the panel. Never leaves the device. */
async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = workerUrl;
  const task = getDocument({ data });
  const doc = await task.promise;
  try {
    const parts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      try {
        const content = await page.getTextContent();
        let line = "";
        for (const it of content.items) {
          if ("str" in it) {
            line += it.str;
            line += it.hasEOL ? "\n" : " ";
          }
        }
        parts.push(line);
      } finally {
        page.cleanup();
      }
    }
    return parts.join("\n");
  } finally {
    await doc.destroy();
  }
}

/** Parse an uploaded resume file into a CareerProfile seed for review. */
export async function resumeFileToProfile(file: File): Promise<CareerProfile> {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const text = isPdf ? await extractPdfText(await file.arrayBuffer()) : await file.text();
  return resumeToProfile(parseResumeText(text));
}

/** A profile counts as "set up" once it carries any verified career content. */
export function isProfileSet(p: CareerProfile): boolean {
  return (
    !!p.identity ||
    !!p.contact?.email ||
    p.experience.length > 0 ||
    p.skills.length > 0 ||
    p.education.length > 0
  );
}

/**
 * Apply a resume-extracted seed on top of an existing profile. The resume
 * owns the career sections (identity, contact, skills, experience, education);
 * everything else (preferences, saved answers, writing style, projects, …) is
 * preserved. A section is only replaced when the resume actually produced one.
 */
export function mergeResumeIntoProfile(current: CareerProfile, seed: CareerProfile): CareerProfile {
  return {
    ...current,
    identity: seed.identity ?? current.identity,
    contact: seed.contact?.email ? seed.contact : current.contact,
    skills: seed.skills.length > 0 ? seed.skills : current.skills,
    experience: seed.experience.length > 0 ? seed.experience : current.experience,
    education: seed.education.length > 0 ? seed.education : current.education,
  };
}
