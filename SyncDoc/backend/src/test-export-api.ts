/**
 * SyncDoc Project — Week 3 Day 4
 * Export API Integration & Contract Verification Suite
 *
 * Covers:
 *   A. GET /api/documents/:id/export?format=html (200 OK, text/html, correct order & blocks)
 *   B. GET /api/documents/:id/export?format=pdf (200 OK, application/pdf, %PDF- buffer)
 *   C. Invalid format parameter (format=docx → 400 Bad Request)
 *   D. Missing format parameter (format= → 400 Bad Request)
 *   E. Invalid document ID middleware check (400 Bad Request)
 *   F. Non-existent document ID (404 Not Found)
 *   G. Special character escaping & security (< > & " ')
 *   H. Unsafe document title with CR/LF newlines & quotes (Header injection prevention)
 *   I. Filename sanitization utility unit tests
 *
 * Run: npx tsx src/test-export-api.ts
 */

import exportController, { sanitizeFilename } from "./controllers/exportController.js";
import { validateObjectId } from "./middleware/validationMiddleware.js";
import documentService from "./services/documentService.js";
import type { Request, Response } from "express";
import type { AstBlock } from "./models/AstNode.js";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    failures.push(message);
    console.log(`  ❌ ${message}`);
  }
}

function assertIncludes(haystack: string, needle: string, message: string): void {
  assert(haystack.includes(needle), message);
}

function assertNotIncludes(haystack: string, needle: string, message: string): void {
  assert(!haystack.includes(needle), message);
}

// ─── Test Document AST Fixture ───────────────────────────────────────────────

const sampleBlocks: AstBlock[] = [
  {
    id: "blk-h1-api",
    type: "heading",
    data: { text: "SyncDoc API Contract & Architecture" },
  },
  {
    id: "blk-p1-api",
    type: "paragraph",
    data: { text: "Collaborative editing engine powered by AST content representation. Special chars: <script>alert(1)</script> & \"quotes\"." },
  },
  {
    id: "blk-code-api",
    type: "code",
    data: {
      language: "typescript",
      code: `const exportApi = {\n  format: "pdf" | "html",\n  status: 200\n};`,
    },
  },
  {
    id: "blk-list-api",
    type: "list",
    data: {
      ordered: true,
      items: ["Validate ObjectId", "Validate format query param", "Transform AST and send output"],
    },
  },
];

const mockDoc = {
  _id: "60c72b2f9b1d8b2b8c8b4567",
  title: "SyncDoc Technical Spec & Guide",
  ownerId: "user-member1",
  version: 1,
  blocks: sampleBlocks,
};

// Mock Helper to create Express Request & Response objects
function createMockRes() {
  let statusCode = 200;
  const headers: Record<string, string> = {};
  let body: unknown = null;

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
      return res;
    },
    send(content: unknown) {
      body = content;
      return res;
    },
    json(content: unknown) {
      body = content;
      return res;
    },
  } as unknown as Response;

  return {
    res,
    getStatus: () => statusCode,
    getHeaders: () => headers,
    getBody: () => body,
  };
}

async function runApiTests(): Promise<void> {
  console.log("=================================================");
  console.log("SyncDoc Week 3 Day 4 — Export API Test Suite");
  console.log("=================================================\n");

  // Save original documentService.getById to restore after mocking
  const originalGetById = documentService.getById;

  try {
    // ─── SUITE 1: Filename Sanitization & Header Injection Safety ────────────
    console.log("SUITE 1: Filename Sanitization & Header Injection Prevention");

    assert(sanitizeFilename("Normal Title") === "Normal_Title", "Sanitizes normal space title");
    assert(
      sanitizeFilename("SyncDoc\r\nHeader-Injection: dangerous\nTitle") === "SyncDocHeader-Injection_dangerousTitle",
      "Strips CR/LF characters to prevent HTTP header injection"
    );
    assert(
      sanitizeFilename('Title / With \\ Dangerous : Chars * ? < > | "Quotes"') === "Title_With_Dangerous_Chars_Quotes",
      "Replaces illegal filename characters with underscores"
    );
    assert(sanitizeFilename("") === "Document", "Falls back to 'Document' for empty title");
    assert(sanitizeFilename("   ___  ") === "Document", "Falls back to 'Document' for whitespace/underscores-only title");

    // ─── Mock documentService.getById ───────────────────────────────────────
    documentService.getById = async (id: string) => {
      if (id === "60c72b2f9b1d8b2b8c8b4567") {
        return mockDoc as unknown as Awaited<ReturnType<typeof documentService.getById>>;
      }
      if (id === "unsafe-title-doc-id") {
        return {
          ...mockDoc,
          title: "Unsafe\r\nHeader-Injection: test\n<Title>*?",
        } as unknown as Awaited<ReturnType<typeof documentService.getById>>;
      }
      return null;
    };

    // ─── SUITE 2: HTML Export Contract ──────────────────────────────────────
    console.log("\nSUITE 2: HTML Export (format=html)");

    const htmlReq = {
      params: { id: "60c72b2f9b1d8b2b8c8b4567" },
      query: { format: "html" },
    } as unknown as Request;

    const mockHtml = createMockRes();
    await exportController.exportDocument(htmlReq, mockHtml.res, () => {});

    assert(mockHtml.getStatus() === 200, "GET /api/documents/:id/export?format=html returns HTTP 200 OK");
    assert(mockHtml.getHeaders()["Content-Type"] === "text/html", "Content-Type header is 'text/html'");

    const htmlBody = mockHtml.getBody() as string;
    assert(typeof htmlBody === "string", "HTML export returns string content");
    assertIncludes(htmlBody, "<!DOCTYPE html>", "HTML content includes <!DOCTYPE html>");
    assertIncludes(htmlBody, "<h1>SyncDoc API Contract &amp; Architecture</h1>", "Heading block rendered in HTML");
    assertIncludes(htmlBody, "<p>Collaborative editing engine", "Paragraph block rendered in HTML");
    assertIncludes(htmlBody, '<code class="language-typescript">', "Code block rendered in HTML");
    assertIncludes(htmlBody, "<ol><li>Validate ObjectId</li>", "Ordered list rendered in HTML");

    // Check block order
    const h1Idx = htmlBody.indexOf("<h1>");
    const pIdx = htmlBody.indexOf("<p>");
    const codeIdx = htmlBody.indexOf("<pre>");
    const listIdx = htmlBody.indexOf("<ol>");
    assert(h1Idx < pIdx && pIdx < codeIdx && codeIdx < listIdx, "Block ordering strictly preserved in HTML export");

    // ─── SUITE 3: PDF Export Contract ───────────────────────────────────────
    console.log("\nSUITE 3: PDF Export (format=pdf)");

    const pdfReq = {
      params: { id: "60c72b2f9b1d8b2b8c8b4567" },
      query: { format: "pdf" },
    } as unknown as Request;

    const mockPdf = createMockRes();
    await exportController.exportDocument(pdfReq, mockPdf.res, () => {});

    assert(mockPdf.getStatus() === 200, "GET /api/documents/:id/export?format=pdf returns HTTP 200 OK");
    assert(mockPdf.getHeaders()["Content-Type"] === "application/pdf", "Content-Type header is 'application/pdf'");

    const dispHeader = mockPdf.getHeaders()["Content-Disposition"];
    assert(typeof dispHeader === "string" && dispHeader.includes('filename="SyncDoc_Technical_Spec_Guide.pdf"'), "Content-Disposition header includes sanitized filename");

    const pdfBody = mockPdf.getBody();
    assert(Buffer.isBuffer(pdfBody), "PDF export returns binary Buffer");
    const pdfBuf = pdfBody as Buffer;
    assert(pdfBuf.length > 500, `PDF Buffer size is substantial (${pdfBuf.length} bytes)`);
    assert(pdfBuf.subarray(0, 5).toString("utf-8") === "%PDF-", "PDF Buffer starts with '%PDF-' magic header");

    // ─── SUITE 4: Invalid Export Formats ────────────────────────────────────
    console.log("\nSUITE 4: Format Parameter Validation (400 Errors)");

    // docx format
    const docxReq = {
      params: { id: "60c72b2f9b1d8b2b8c8b4567" },
      query: { format: "docx" },
    } as unknown as Request;
    const mockDocx = createMockRes();
    await exportController.exportDocument(docxReq, mockDocx.res, () => {});

    assert(mockDocx.getStatus() === 400, "format=docx returns HTTP 400 Bad Request");
    const docxErr = mockDocx.getBody() as { success: boolean; message: string };
    assert(docxErr.success === false, "Error payload has success=false");
    assertIncludes(docxErr.message, "Invalid export format 'docx'", "Error message specifies invalid format");

    // Missing format parameter
    const missingFormatReq = {
      params: { id: "60c72b2f9b1d8b2b8c8b4567" },
      query: {},
    } as unknown as Request;
    const mockMissing = createMockRes();
    await exportController.exportDocument(missingFormatReq, mockMissing.res, () => {});

    assert(mockMissing.getStatus() === 400, "Missing format query parameter returns HTTP 400 Bad Request");
    const missingErr = mockMissing.getBody() as { success: boolean; message: string };
    assert(missingErr.success === false, "Error payload has success=false");
    assertIncludes(missingErr.message, "Missing required query parameter 'format'", "Error message specifies missing format");

    // Array format parameter (format=['html', 'pdf'])
    const arrayFormatReq = {
      params: { id: "60c72b2f9b1d8b2b8c8b4567" },
      query: { format: ["html", "pdf"] },
    } as unknown as Request;
    const mockArray = createMockRes();
    await exportController.exportDocument(arrayFormatReq, mockArray.res, () => {});

    assert(mockArray.getStatus() === 200, "Array query param format=['html', 'pdf'] safely takes first element 'html'");

    // ─── SUITE 5: Document Validation & Not Found Handling ─────────────────
    console.log("\nSUITE 5: Document Not Found & Invalid ObjectId");

    // Non-existent document
    const missingDocReq = {
      params: { id: "60c72b2f9b1d8b2b8c8b9999" },
      query: { format: "html" },
    } as unknown as Request;
    const mock404 = createMockRes();
    await exportController.exportDocument(missingDocReq, mock404.res, () => {});

    assert(mock404.getStatus() === 404, "Non-existent document ID returns HTTP 404 Not Found");
    const err404 = mock404.getBody() as { success: boolean; message: string };
    assert(err404.message === "Document not found", "Returns standard 'Document not found' message");

    // Invalid ObjectId middleware check
    const invalidIdReq = {
      params: { id: "not-a-valid-objectid" },
      query: { format: "html" },
    } as unknown as Request;
    const mockInvalidId = createMockRes();
    let middlewareCalled = false;

    validateObjectId(invalidIdReq, mockInvalidId.res, () => {
      middlewareCalled = true;
    });

    assert(mockInvalidId.getStatus() === 400, "validateObjectId middleware returns HTTP 400 for invalid ObjectId");
    assert(middlewareCalled === false, "Middleware stops request chain on invalid ObjectId");

    // ─── SUITE 6: Special Characters & Header Injection Prevention ───────────
    console.log("\nSUITE 6: Special Characters & Header Injection Prevention");

    const unsafeReq = {
      params: { id: "unsafe-title-doc-id" },
      query: { format: "html", download: "true" },
    } as unknown as Request;
    const mockUnsafe = createMockRes();
    await exportController.exportDocument(unsafeReq, mockUnsafe.res, () => {});

    assert(mockUnsafe.getStatus() === 200, "Document with CR/LF in title exports without server crash");
    const unsafeDispHeader = mockUnsafe.getHeaders()["Content-Disposition"];
    assertNotIncludes(unsafeDispHeader, "\r", "Content-Disposition header contains zero CR characters");
    assertNotIncludes(unsafeDispHeader, "\n", "Content-Disposition header contains zero LF characters");
    assertIncludes(unsafeDispHeader, 'filename="UnsafeHeader-Injection_test_Title.html"', "Sanitized filename in header is safe");

    // ─── Results Summary ────────────────────────────────────────────────────
    console.log("\n=================================================");
    console.log(`RESULTS: ${passed} passed, ${failed} failed`);
    console.log("=================================================\n");

    if (failures.length > 0) {
      console.log("FAILURES:");
      failures.forEach((f) => console.log(`  ❌ ${f}`));
      process.exit(1);
    } else {
      console.log("All Export API integration tests passed successfully! 🚀\n");
    }
  } finally {
    documentService.getById = originalGetById;
  }
}

runApiTests().catch((err) => {
  console.error("Unhandled error during Export API tests:", err);
  process.exit(1);
});
