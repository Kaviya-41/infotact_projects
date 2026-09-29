import type { Request, Response, NextFunction } from "express";
import documentService from "../services/documentService.js";
import exportService from "../services/exportService.js";
import type { ExportFormat } from "../services/exportService.js";

/**
 * Extract param ID safely handling potential array inputs
 */
function getParamId(req: Request): string {
  const id = req.params.id;
  if (Array.isArray(id)) return id[0];
  return id ?? "";
}

/**
 * Sanitizes document title to produce a safe filename and prevent HTTP Response Header Injection.
 * Strips CR/LF characters (\r, \n) and replaces unsafe filename symbols with underscores.
 */
export function sanitizeFilename(title: string): string {
  if (typeof title !== "string") {
    return "Document";
  }

  const cleanTitle = title
    .replace(/[\r\n]/g, "") // Prevent CR/LF HTTP header injection
    .replace(/[^a-zA-Z0-9_\- ]/g, "_") // Replace non-alphanumeric (except hyphen, space, underscore)
    .replace(/\s+/g, "_") // Convert spaces to underscores
    .replace(/_+/g, "_") // Collapse multiple consecutive underscores
    .replace(/^_+|_+$/g, "") // Trim leading and trailing underscores
    .substring(0, 100);

  return cleanTitle || "Document";
}

const PUBLIC_SUPPORTED_FORMATS: readonly string[] = ["html", "pdf"];
const INTERNAL_VALID_FORMATS: ExportFormat[] = ["html", "html-fragment", "pdf"];

const exportController = {
  /**
   * GET /api/documents/:id/export?format=html|pdf
   *
   * Exports a document's AST as the requested format.
   * Query parameters:
   *   - format: "html" | "pdf" (required)
   *   - download: "true" (optional) to trigger browser download
   */
  async exportDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const docId = getParamId(req);

      // Extract format parameter safely handling string or array inputs
      const rawFormat = Array.isArray(req.query.format)
        ? req.query.format[0]
        : req.query.format;

      // Extract download parameter safely
      const rawDownload = Array.isArray(req.query.download)
        ? req.query.download[0]
        : req.query.download;

      // 1. Missing format parameter check
      if (!rawFormat || typeof rawFormat !== "string" || rawFormat.trim() === "") {
        res.status(400).json({
          success: false,
          message: `Missing required query parameter 'format'. Supported formats: ${PUBLIC_SUPPORTED_FORMATS.join(", ")}`,
        });
        return;
      }

      const format = rawFormat.trim() as ExportFormat;

      // 2. Unsupported format check
      if (!INTERNAL_VALID_FORMATS.includes(format)) {
        res.status(400).json({
          success: false,
          message: `Invalid export format '${rawFormat}'. Supported formats: ${PUBLIC_SUPPORTED_FORMATS.join(", ")}`,
        });
        return;
      }

      // 3. Fetch document from database using document service
      const doc = await documentService.getById(docId);
      if (!doc) {
        res.status(404).json({
          success: false,
          message: "Document not found",
        });
        return;
      }

      // 4. Transform AST → target format (reusing Day 2 HTML transformer & Day 3 PDF service)
      const result = await exportService.exportDocument(doc.blocks, doc.title, format);

      // 5. Sanitize document title for filename and header safety
      const safeTitle = sanitizeFilename(doc.title);
      const extension = format === "pdf" ? "pdf" : "html";

      // 6. Set Content-Type and Content-Disposition headers
      res.setHeader("Content-Type", result.contentType);

      // Set attachment disposition if download parameter requested or for PDF export
      if (rawDownload === "true" || format === "pdf") {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${safeTitle}.${extension}"`
        );
      }

      // 7. Send raw content (HTML string or binary PDF Buffer)
      res.status(200).send(result.content);
    } catch (error: unknown) {
      next(error);
    }
  },
};

export default exportController;
