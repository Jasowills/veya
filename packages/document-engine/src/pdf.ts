/**
 * PDF compositing — render plain text (e.g. a cover letter) into a clean PDF.
 *
 * Uses pdf-lib (pure JS, no native deps). Text is greedy-wrapped and paginated.
 */

import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

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
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = opts.fontSize ?? 11;
  const headingFontSize = opts.headingFontSize ?? 16;
  const lineHeight = opts.lineHeight ?? fontSize * 1.45;
  const margins = { top: 72, right: 72, bottom: 72, left: 72, ...opts.margins };
  const pageSize = opts.pageSize ?? US_LETTER;
  const maxWidth = pageSize.width - margins.left - margins.right;

  let page = doc.addPage([pageSize.width, pageSize.height]);
  let y = pageSize.height - margins.top;

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

  const ensureRoom = (needed: number) => {
    if (y - needed < margins.bottom) {
      page = doc.addPage([pageSize.width, pageSize.height]);
      y = pageSize.height - margins.top;
    }
  };

  const drawLine = (content: string, font: PDFFont, size: number, height: number) => {
    ensureRoom(height);
    page.drawText(content, { x: margins.left, y, size, font });
    y -= height;
  };

  if (opts.heading) {
    drawLine(opts.heading, bold, headingFontSize, headingFontSize * 1.5);
    y -= lineHeight * 0.5;
  }

  for (const rawParagraph of text.split(/\n{2,}/)) {
    const paragraph = rawParagraph.trim();
    if (!paragraph) continue;
    for (const line of wrap(paragraph, maxWidth)) {
      drawLine(line, font, fontSize, lineHeight);
    }
    y -= lineHeight * 0.5;
  }

  return doc.save();
}

/** Convenience: render a generated cover letter straight to a PDF. */
export async function composeCoverLetterPdf(text: string, opts: Omit<PdfComposeOptions, "heading"> = {}): Promise<Uint8Array> {
  return composeTextPdf(text, { ...opts });
}
