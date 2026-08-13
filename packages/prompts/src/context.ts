/**
 * Profile → verified-context serialization.
 *
 * Produces the compact, ground-truth block given to the LLM. Only verified
 * profile fields are included; nothing is derived or implied here.
 */

import type { CareerProfile } from "@veya/profile";

export function serializeProfileForContext(profile: CareerProfile): string {
  const lines: string[] = [];

  if (profile.identity) {
    const { firstName, lastName, preferredName } = profile.identity;
    lines.push(`Name: ${[firstName, lastName].filter(Boolean).join(" ")}${preferredName ? ` (prefers ${preferredName})` : ""}`);
  }
  if (profile.contact) {
    const c = profile.contact;
    lines.push(`Email: ${c.email}`);
    if (c.phone) lines.push(`Phone: ${c.phone}`);
    if (c.city && c.country) lines.push(`Location: ${c.city}, ${c.country}`);
    else if (c.city) lines.push(`Location: ${c.city}`);
    for (const [label, key] of [
      ["LinkedIn", "linkedinUrl"],
      ["GitHub", "githubUrl"],
      ["Portfolio", "portfolioUrl"],
      ["Website", "websiteUrl"],
    ] as const) {
      const v = c[key];
      if (v) lines.push(`${label}: ${v}`);
    }
  }

  if (profile.experience.length > 0) {
    lines.push("", "WORK EXPERIENCE");
    for (const e of profile.experience) {
      const period = [e.start, e.current ? "present" : e.end].filter(Boolean).join(" – ");
      lines.push(`- ${e.title} @ ${e.company}${e.location ? `, ${e.location}` : ""}${period ? ` (${period})` : ""}`);
      if (e.summary) lines.push(`  ${e.summary}`);
      for (const b of e.bullets) lines.push(`  • ${b}`);
      if (e.technologies.length > 0) lines.push(`  Technologies: ${e.technologies.join(", ")}`);
    }
  }

  if (profile.education.length > 0) {
    lines.push("", "EDUCATION");
    for (const edu of profile.education) {
      const parts = [edu.degree, edu.field, edu.institution, [edu.startYear, edu.endYear].filter(Boolean).join("–")].filter(Boolean);
      lines.push(`- ${parts.join(", ")}`);
      if (edu.gpa) lines.push(`  GPA: ${edu.gpa}`);
    }
  }

  if (profile.skills.length > 0) {
    lines.push("", `SKILLS: ${profile.skills.map((s) => (s.level ? `${s.name} (${s.level})` : s.name)).join(", ")}`);
  }

  if (profile.projects.length > 0) {
    lines.push("", "PROJECTS");
    for (const p of profile.projects) {
      lines.push(`- ${p.name}${p.role ? ` — ${p.role}` : ""}${p.url ? ` (${p.url})` : ""}`);
      if (p.description) lines.push(`  ${p.description}`);
    }
  }

  if (profile.certifications.length > 0) {
    lines.push("", `CERTIFICATIONS: ${profile.certifications.map((c) => [c.name, c.issuer].filter(Boolean).join(" — ")).join("; ")}`);
  }

  if (profile.preferences) {
    const p = profile.preferences;
    lines.push("", "PREFERENCES");
    if (p.desiredRoles.length > 0) lines.push(`Desired roles: ${p.desiredRoles.join(", ")}`);
    if (p.industries.length > 0) lines.push(`Industries: ${p.industries.join(", ")}`);
    if (p.workArrangement) lines.push(`Work arrangement: ${p.workArrangement}`);
    if (p.salary?.minimum !== undefined) lines.push(`Salary minimum: ${p.salary.minimum} ${p.salary.currency ?? "USD"}`);
    if (p.relocation) lines.push(`Relocation willing: ${p.relocation.willing ? "yes" : "no"}${p.relocation.regions.length ? ` (${p.relocation.regions.join(", ")})` : ""}`);
    if (p.workAuthorization?.status) lines.push(`Work authorization: ${p.workAuthorization.status}`);
    if (p.sponsorshipRequired !== undefined) lines.push(`Sponsorship required: ${p.sponsorshipRequired ? "yes" : "no"}`);
    if (p.employmentTypes.length > 0) lines.push(`Employment types: ${p.employmentTypes.join(", ")}`);
    if (p.availabilityDate) lines.push(`Available: ${p.availabilityDate}`);
  }

  if (profile.savedAnswers.length > 0) {
    lines.push("", "SAVED ANSWERS");
    for (const a of profile.savedAnswers) {
      lines.push(`Q: ${a.question}\nA: ${a.answer}`);
    }
  }

  if (profile.writingStyle) {
    const w = profile.writingStyle;
    lines.push("", "WRITING STYLE");
    if (w.tone.length > 0) lines.push(`Tone: ${w.tone.join(", ")}`);
    if (w.lengthPreference) lines.push(`Length: ${w.lengthPreference}`);
    if (w.avoid.length > 0) lines.push(`Avoid: ${w.avoid.join(", ")}`);
  }

  return lines.join("\n");
}

export function serializeApplicationForContext(opts: {
  company?: string;
  role?: string;
  location?: string;
  description?: string;
}): string {
  const parts: string[] = [];
  if (opts.role) parts.push(`Role: ${opts.role}`);
  if (opts.company) parts.push(`Company: ${opts.company}`);
  if (opts.location) parts.push(`Location: ${opts.location}`);
  if (opts.description) parts.push(`Job description:\n${opts.description}`);
  return parts.join("\n");
}