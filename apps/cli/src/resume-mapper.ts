/**
 * Map a parsed resume onto a CareerProfile. Best-effort seeding — the user
 * reviews and corrects in the editor. Nothing here is treated as verified.
 */

import { randomUUID } from "node:crypto";
import type { ParsedResume, ResumeExperienceBlock } from "@veya/document-engine";
import { emptyProfile, type CareerProfile, type Education } from "@veya/profile";

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] ?? name, lastName: parts[0] ?? name };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1]! };
}

/** "Jan 2020 – Present" → { start: "2020-01", end: undefined, current: true }. */
export function parseDates(dates: string | undefined): { start?: string; end?: string; current: boolean } {
  if (!dates) return { current: false };
  const m = dates.match(/(\w{3,9})\s+(\d{4})\s*[-–]\s*(.+)/i);
  if (m) {
    const month = MONTHS[m[1]!.slice(0, 3).toLowerCase()];
    const start = month ? `${m[2]}-${String(month).padStart(2, "0")}` : m[2];
    const endRaw = m[3]!.trim();
    const current = /present|now|current/i.test(endRaw);
    if (current) return { start, end: undefined, current: true };
    const em = endRaw.match(/(\w{3,9})\s+(\d{4})/i);
    const end = em ? (MONTHS[em[1]!.slice(0, 3).toLowerCase()] ? `${em[2]}-${String(MONTHS[em[1]!.slice(0, 3).toLowerCase()]).padStart(2, "0")}` : em[2]) : endRaw;
    return { start, end, current: false };
  }
  const y = dates.match(/(\d{4})\s*[-–]\s*(\d{4}|present)/i);
  if (y) {
    const current = /present/i.test(y[2]!);
    return { start: y[1], end: current ? undefined : y[2], current };
  }
  return { current: false };
}

function educationFromLine(line: string): Education {
  const id = randomUUID();
  const years = line.match(/\((\d{4})\s*[-–]\s*(\d{4})\)/);
  const rest = line.replace(/\(.*\)$/, "").trim();
  const parts = rest.split(/[|,]\s*| – /);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return {
      id,
      institution: parts[0],
      degree: parts.slice(1).join(", "),
      startYear: years?.[1],
      endYear: years?.[2],
      honors: [],
    };
  }
  return { id, institution: rest, startYear: years?.[1], endYear: years?.[2], honors: [] };
}

export function experienceToProfileEntry(e: ResumeExperienceBlock): CareerProfile["experience"][number] {
  const { start, end, current } = parseDates(e.dates);
  return {
    id: randomUUID(),
    company: e.company ?? "Unknown company",
    title: e.title ?? "Position",
    start,
    end,
    current,
    bullets: e.bullets,
    technologies: [],
  };
}

export function resumeToProfile(resume: ParsedResume): CareerProfile {
  const profile = emptyProfile();
  const preamble = resume.sections.find((s) => s.heading === "preamble")?.lines ?? [];
  const nameLine = preamble.find((l) => !/@/.test(l) && !/linkedin|github/i.test(l) && /\w/.test(l));
  if (nameLine) {
    const { firstName, lastName } = splitName(nameLine);
    profile.identity = { firstName, lastName };
  }
  profile.contact = {
    email: resume.contact.email ?? "",
    phone: resume.contact.phone,
    linkedinUrl: resume.contact.linkedin,
    websiteUrl: resume.contact.website,
    city: resume.contact.location,
  };
  profile.skills = resume.skills.map((name) => ({ name }));
  profile.experience = resume.experience.map(experienceToProfileEntry);
  profile.education = resume.education.map(educationFromLine);
  return profile;
}
