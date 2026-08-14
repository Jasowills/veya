/**
 * Ambient types for `pdfjs-dist` (v6). The package ships no package-level
 * types (`main` → `build/pdf.mjs`, no `exports` map), so we declare the small
 * subset the side panel uses for resume text extraction.
 */
declare module "pdfjs-dist" {
  export const GlobalWorkerOptions: { workerSrc: string };
  export function getDocument(params: { data: ArrayBuffer }): PDFDocumentLoadingTask;

  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    destroy(): Promise<void>;
  }
  export interface PDFPageProxy {
    getTextContent(): Promise<PDFTextContent>;
    cleanup(): void;
  }
  export interface PDFTextContent {
    items: Array<{ str: string; hasEOL: boolean } | { type: string }>;
  }
}
