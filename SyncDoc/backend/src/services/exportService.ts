import type { AstBlock } from "../models/AstNode.js";
import { blocksToHtml, blocksToHtmlFragment } from "../utils/astToHtml.js";
import pdfService from "./pdfService.js";

/**
 * Supported export formats.
 * - "html": Complete standalone HTML5 document with embedded styles
 * - "html-fragment": Fragment containing rendered body content only
 * - "pdf": PDF document generated from HTML transformation
 */
export type ExportFormat = "html" | "html-fragment" | "pdf";

export interface ExportResult {
  format: ExportFormat;
  content: string | Buffer;
  contentType: string;
}

/**
 * Export Service — orchestrates AST → output format transformations.
 *
 * Architecture:
 *   Controller → exportService.exportDocument() → astToHtml transformer → output
 *                                                ↘ pdfService → PDF Buffer
 *
 * Supports:
 *   - "html"          → full HTML5 document
 *   - "html-fragment" → body-only HTML (no wrapper)
 *   - "pdf"           → PDF document buffer (reuses HTML pipeline)
 */
const exportService = {
  /**
   * Exports a document's AST blocks to the requested format.
   *
   * @param blocks - Validated AST blocks from the document
   * @param title  - Document title (used in HTML <title> tag)
   * @param format - Target export format ("html" | "html-fragment" | "pdf")
   * @returns Promise resolving to ExportResult containing rendered content and MIME type
   */
  async exportDocument(
    blocks: AstBlock[],
    title: string,
    format: ExportFormat = "html"
  ): Promise<ExportResult> {
    switch (format) {
      case "html":
        return {
          format: "html",
          content: blocksToHtml(blocks, title),
          contentType: "text/html",
        };

      case "html-fragment":
        return {
          format: "html-fragment",
          content: blocksToHtmlFragment(blocks),
          contentType: "text/html",
        };

      case "pdf": {
        // Reuse Day 2 AST → HTML transformer
        const html = blocksToHtml(blocks, title);
        // Pass generated HTML to PDF renderer
        const pdfBuffer = await pdfService.generatePdf(html);
        return {
          format: "pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        };
      }

      default: {
        const _exhaustive: never = format;
        throw new Error(`Unsupported export format: ${String(_exhaustive)}`);
      }
    }
  },
};

export default exportService;
