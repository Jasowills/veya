/**
 * Resume text parsing — heuristic section detection, no dependencies.
 *
 * Pure text → sections (contact, skills, experience, education). Kept free of
 * any imports so browser bundles (the extension side panel) never pull in
 * Node-only PDF tooling.
 */

export interface ResumeContact {
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

export interface ResumeSection {
  heading: string;
  lines: string[];
}

export interface ResumeExperienceBlock {
  company?: string;
  title?: string;
  location?: string;
  dates?: string;
  bullets: string[];
}

export interface ParsedResume {
  text: string;
  contact: ResumeContact;
  skills: string[];
  experience: ResumeExperienceBlock[];
  education: string[];
  sections: ResumeSection[];
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/;
const LINKEDIN_RE = /linkedin\.com\/[\w/\-]+/i;
const WEBSITE_RE = /(?<![\w@])(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|io|dev|org|net|me|co|app)(?:\/[^\s]*)?/i;
const PAGE_FOOTER_RE = /^\s*(?:[-–—./]{2,}|\d+\s*(?:of|\/)\s*\d+|page\s+\d+)/i;

const SKILL_HEADINGS: RegExp[] = [/skills?$/i, /technical skills?$/i, /core competencies$/i, /technologies$/i, /tools$/i, /expertise$/i, /^languages$/i];
const EXPERIENCE_HEADINGS: RegExp[] = [/experience$/i, /work experience$/i, /professional experience$/i, /employment(?: history)?$/i, /work history$/i, /^projects$/i, /^key projects$/i];
const EDUCATION_HEADINGS: RegExp[] = [/education$/i, /education.*certs?/i, /academic background$/i, /schooling$/i];
const CONTACT_HEADINGS: RegExp[] = [/^contact$/i, /^contact details$/i, /^personal (?:details|info)$/i];

const ALL_HEADINGS: RegExp[] = [
  ...SKILL_HEADINGS,
  ...EXPERIENCE_HEADINGS,
  ...EDUCATION_HEADINGS,
  ...CONTACT_HEADINGS,
  /^summary$/i,
  /^profile$/i,
  /^professional summary$/i,
  /^objective$/i,
  /^certifications?$/i,
  /^interests$/i,
  /^awards?$/i,
  /^publications$/i,
  /^references$/i,
  /^leadership$/i,
  /^volunteer(?:ing)?$/i,
];

const BULLET_START = /^\s*(?:[-•*·◦▪])[\s]*/;

/** Common location patterns: "City, Country", "City, State", "Remote", etc. */
const LOCATION_RE = /^(?:remote|onsite|on-site|hybrid|work from home|Remote|Onsite|On-site|Hybrid|Work from home)$/i;
const CITY_COUNTRY_RE = /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z][a-z]+(?:\s[A-Z][a-z]+)*$/;

/** Lines that look like they contain dates. */
const DATE_LINE_RE = /(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4})|(\b\d{4}\b\s*(?:[-–—]\s*\d{4}|[-–—]\s*present)|(\b\d{4}\b[-–—]\b\d{4}\b))|(\d{2}\/\d{4}\s*[-–—])/i;

function headingOf(line: string): string | undefined {
  const t = line.trim().replace(/:$/, "");
  for (const re of ALL_HEADINGS) {
    if (re.test(t)) return line.trim();
  }
  return undefined;
}

function detectContact(lines: string[]): ResumeContact {
  const contact: ResumeContact = {};
  const joined = lines.join("\n");
  const email = joined.match(EMAIL_RE);
  if (email) contact.email = email[0];
  const phone = joined.match(PHONE_RE);
  if (phone) contact.phone = phone[0].replace(/[^+\d]/g, "");
  const linkedin = joined.match(LINKEDIN_RE);
  if (linkedin) contact.linkedin = linkedin[0];
  const website = joined.match(WEBSITE_RE);
  if (website) {
    const value = website[0];
    if (!linkedin || !value.toLowerCase().includes("linkedin")) contact.website = value;
  }
  return contact;
}

function isDateLine(line: string): boolean {
  return DATE_LINE_RE.test(line);
}

/** Check if a line looks like a location (short, no digits, matches known patterns). */
function isLocationLine(line: string): boolean {
  const t = line.trim();
  if (t.length > 40) return false;
  if (/\d/.test(t)) return false;
  if (LOCATION_RE.test(t)) return true;
  if (CITY_COUNTRY_RE.test(t)) return true;
  // Simple city name: "Lagos" or "New York"
  const parts = t.split(",").map((s) => s.trim());
  if (parts.length <= 2 && parts.every((p) => /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*$/.test(p))) return true;
  return false;
}

/** Check if a line is a category prefix like "Languages:", "Frontend:", "Backend:". */
function isCategoryPrefix(line: string): boolean {
  return /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*:\s*$/.test(line.trim());
}

function splitHeader(line: string): { company?: string; title?: string } {
  // Try "Company — Title" or "Company | Title"
  const m = line.split(/\s+[–—|-]\s+|\s+\|\s+/);
  if (m.length === 2 && m[0] && m[1]) {
    return { company: m[0]!.trim(), title: m[1]!.trim() };
  }
  // Try "Title at Company" or "Title @ Company"
  const atMatch = line.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
  if (atMatch && atMatch[1] && atMatch[2]) {
    return { title: atMatch[1]!.trim(), company: atMatch[2]!.trim() };
  }
  return { title: line.trim() };
}

/** Group the EXPERIENCE section lines into blocks. */
function parseExperience(lines: string[]): ResumeExperienceBlock[] {
  const blocks: ResumeExperienceBlock[] = [];
  let current: ResumeExperienceBlock | undefined;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const bullet = line.match(BULLET_START);
    if (bullet) {
      current ??= { bullets: [] };
      current.bullets.push(line.replace(BULLET_START, "").trim());
      continue;
    }

    if (isDateLine(line)) {
      current ??= { bullets: [] };
      current.dates = line;
      continue;
    }

    // Location line: attach to current block, don't start a new one
    if (current && isLocationLine(line) && !current.location) {
      current.location = line;
      continue;
    }

    // Non-bullet, non-date, non-location line: could be a header.
    // Start a new block when the current one already has a header and some content.
    if (current && (current.company || current.title)) {
      blocks.push(current);
      current = undefined;
    }
    current ??= { bullets: [] };
    const { company, title } = splitHeader(line);
    if (company && !current.company) current.company = company;
    if (title && !current.title) current.title = title;
  }
  if (current) blocks.push(current);
  return blocks;
}

/** Parse skills from the skills section, handling category prefixes and multiple formats. */
function parseSkills(lines: string[]): string[] {
  const skills: string[] = [];
  let currentCategory = "";

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Check for category prefix line like "Languages:" or "Frontend:"
    if (isCategoryPrefix(line)) {
      currentCategory = line.replace(/:$/, "").trim();
      continue;
    }

    // Check if line starts with a category prefix inline: "Languages: JavaScript, TypeScript"
    const inlineCategoryMatch = line.match(/^([A-Z][a-z]+(?:\s[A-Z][a-z]+)*):\s*(.+)$/);
    if (inlineCategoryMatch && inlineCategoryMatch[1] && inlineCategoryMatch[2]) {
      currentCategory = inlineCategoryMatch[1];
      const skillsPart = inlineCategoryMatch[2];
      // Split the skills part on delimiters
      const items = skillsPart.split(/[|,;·]/).map((s) => s.replace(BULLET_START, "").trim()).filter((s) => s.length > 0 && s.split(/\s+/).length <= 6);
      skills.push(...items);
      continue;
    }

    // Regular skill line: split on delimiters
    const items = line.split(/[|,;·]/).map((s) => s.replace(BULLET_START, "").trim()).filter((s) => s.length > 0 && s.split(/\s+/).length <= 6);
    skills.push(...items);
  }

  return skills;
}

export function parseResumeText(text: string): ParsedResume {
  const sections: ResumeSection[] = [];
  let current: ResumeSection | undefined;
  const lines = text.replace(/\r\n/g, "\n").split("\n").map((l) => l.trim());

  for (const line of lines) {
    if (!line) continue;
    if (PAGE_FOOTER_RE.test(line)) continue;
    const h = headingOf(line);
    if (h) {
      current = { heading: h, lines: [] };
      sections.push(current);
    } else {
      if (!current) {
        current = { heading: "preamble", lines: [] };
        sections.push(current);
      }
      current.lines.push(line);
    }
  }

  const isHeading = (section: ResumeSection, re: RegExp) => re.test(section.heading.replace(/:$/, ""));
  const sectionBy = (pred: (s: ResumeSection) => boolean) => sections.find(pred);

  const preamble = sectionBy((s) => s.heading === "preamble")?.lines ?? [];
  const contactSection = sectionBy((s) => CONTACT_HEADINGS.some((h) => isHeading(s, h)));
  const contactLines = [...preamble, ...(contactSection?.lines ?? [])];

  const skillsSection = sectionBy((s) => SKILL_HEADINGS.some((h) => isHeading(s, h)));
  const skills = parseSkills(skillsSection?.lines ?? []);

  const experienceSection = sectionBy((s) => EXPERIENCE_HEADINGS.some((h) => isHeading(s, h)));
  const experience = experienceSection ? parseExperience(experienceSection.lines) : [];

  const educationSection = sectionBy((s) => EDUCATION_HEADINGS.some((h) => isHeading(s, h)));
  const education = (educationSection?.lines ?? [])
    .map((l) => l.replace(BULLET_START, "").trim())
    .filter((l) => l.length > 0);

  return {
    text,
    contact: detectContact(contactLines),
    skills,
    experience,
    education,
    sections,
  };
}
