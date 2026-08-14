/**
 * PDF compositing — render plain text (e.g. a cover letter) into a clean PDF.
 *
 * Uses pdf-lib (pure JS, no native deps). Text is greedy-wrapped and paginated.
 */

import type { PDFPage } from "pdf-lib";

export interface PdfComposeOptions {
  /** Bold heading drawn at the top of the first page. */
  heading?: string;
  fontSize?: number;
  headingFontSize?: number;
  lineHeight?: number;
  /** Page margins in points (1pt = 1/72 inch). */
  margins?: { top: number; right: number; bottom: number; left: number };
  /** Page size in points. Defaults to US Letter (612 × 792). */
  pageSize?: { width: number; height: number };
}

const US_LETTER = { width: 612, height: 792 };

export async function composeTextPdf(text: string, opts: PdfComposeOptions = {}): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = opts.fontSize ?? 11;
  const headingFontSize = opts.headingFontSize ?? 16;
  const lineHeight = opts.lineHeight ?? fontSize * 1.45;
  const margins = { top: 72, right: 72, bottom: 72, left: 72, ...opts.margins };
  const pageSize = opts.pageSize ?? US_LETTER;
  const maxWidth = pageSize.width - margins.left - margins.right;

  const wrap = (paragraph: string, width: number): string[] => {
    const lines: string[] = [];
    let current = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= width) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  };

  // Logical output lines (blank lines preserved) with hard breaks at single \n.
  const rendered: string[] = [];
  for (const rawLine of text.split("\n")) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      rendered.push("");
      continue;
    }
    for (const line of wrap(trimmed, maxWidth)) rendered.push(line);
  }

  // Paginate greedily. A blank line costs half a line height.
  const pageBody = pageSize.height - margins.top - margins.bottom;
  const headingHeight = opts.heading ? headingFontSize * 1.5 + lineHeight * 0.5 : 0;
  const pages: string[][] = [];
  let pageLines: string[] = [];
  let used = 0;
  for (const line of rendered) {
    const cost = line === "" ? lineHeight * 0.5 : lineHeight;
    const budget = pages.length === 0 ? pageBody - headingHeight : pageBody;
    if (line !== "" && used + cost > budget) {
      pages.push(pageLines);
      pageLines = [];
      used = 0;
    }
    if (line === "") {
      if (pageLines.length > 0) pageLines.push("");
    } else {
      pageLines.push(line);
      used += cost;
    }
  }
  if (pageLines.length > 0) pages.push(pageLines);

  const drawBody = (page: PDFPage, lines: string[]) => {
    const y = pageSize.height - margins.top - headingHeight;
    page.drawText(lines.join("\n"), { x: margins.left, y, size: fontSize, font, lineHeight });
  };

  if (pages.length === 0) pages.push([]);
  pages.forEach((lines, i) => {
    const page = doc.addPage([pageSize.width, pageSize.height]);
    if (i === 0 && opts.heading) {
      page.drawText(opts.heading, { x: margins.left, y: pageSize.height - margins.top, size: headingFontSize, font: bold });
    }
    drawBody(page, lines);
  });

  return doc.save();
}

/** Convenience: render a generated cover letter straight to a PDF. */
export async function composeCoverLetterPdf(text: string, opts: Omit<PdfComposeOptions, "heading"> = {}): Promise<Uint8Array> {
  return composeTextPdf(text, { ...opts });
}
