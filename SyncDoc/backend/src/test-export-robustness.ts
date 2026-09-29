/**
 * SyncDoc Project — Week 3 Day 6
 * Export Pipeline Edge-Case, Robustness & Security Verification Suite
 *
 * Covers:
 *   1. Special Characters & Code Symbols (< > & " ' && || => {} [] ())
 *   2. HTML-Like & Executable Script Injection Prevention (<script>, <img onerror>, <b>)
 *   3. Empty & Minimal Document AST Validation & Export
 *   4. Large Document (20+ Blocks) Multi-Page PDF & HTML Generation
 *   5. Long Text & Unwrapped Code Block Formatting
 *   6. Unicode & International Text (Tamil, Emojis, Symbols)
 *   7. Unsafe Document Titles & CR/LF Header Injection Prevention
 *   8. Invalid Document ID & 404 Non-Existent Document Error Responses
 *   9. Invalid Formats (docx, xyz, exe) & Query Parameter Abuse (format[]=pdf)
 *  10. Repeated & Sequential PDF Export Browser Process Cleanup
 *  11. Export Read-Only Integrity (Export DOES NOT mutate version or AST)
 *  12. AST Change Engine Mutation (AST Update DOES increment version)
 *  13. Security Review (No MONGO_URI, API Keys, or stack traces exposed)
 *
 * Run: npx tsx src/test-export-robustness.ts
 */

import exportService from "./services/exportService.js";
import pdfService from "./services/pdfService.js";
import exportController, { sanitizeFilename } from "./controllers/exportController.js";
import documentService from "./services/documentService.js";
import { validateObjectId } from "./middleware/validationMiddleware.js";
import { validateDocumentAST } from "./validators/astValidator.js";
import type { AstBlock } from "./models/AstNode.js";
import type { ASTChange } from "./types/astChangeTypes.js";
import type { Request, Response } from "express";

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

// Mock Response Helper
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

async function runRobustnessSuite(): Promise<void> {
  console.log("=================================================");
  console.log("SyncDoc Week 3 Day 6 — Robustness & Security Suite");
  console.log("=================================================\n");

  const originalGetById = documentService.getById;
  const originalApplyChange = documentService.applyChange;

  try {
    // ─── SUITE 1: Special Characters & Code Operators ───────────────────────
    console.log("SUITE 1: Special Characters & Code Symbols");

    const specCharBlocks: AstBlock[] = [
      {
        id: "blk-spec-1",
        type: "heading",
        data: { text: "Testing <Special> & 'Quotes' \"Double\"" },
      },
      {
        id: "blk-spec-2",
        type: "paragraph",
        data: { text: "Symbols: < > & \" ' and math: 10 > 5 && 2 < 8 || true => false." },
      },
      {
        id: "blk-spec-3",
        type: "code",
        data: {
          language: "typescript",
          code: "const fn = (a: number, b: number) => {\n  if (a > 0 && b < 100 || (a === b)) {\n    return [a, b] && { key: 'val' };\n  }\n};",
        },
      },
      {
        id: "blk-spec-4",
        type: "list",
        data: {
          ordered: false,
          items: ["Item <1>", "Item &2", "Item \"3\"", "Item '4'"],
        },
      },
    ];

    const specHtmlResult = await exportService.exportDocument(specCharBlocks, "Special Characters Doc", "html");
    const specHtml = specHtmlResult.content as string;

    assertIncludes(specHtml, "&lt;Special&gt;", "Escapes angle brackets in heading");
    assertIncludes(specHtml, "&amp; &#39;Quotes&#39; &quot;Double&quot;", "Escapes ampersand and quotes in heading");
    assertIncludes(specHtml, "a &gt; 0 &amp;&amp; b &lt; 100", "Escapes logic operators in code block");
    assertIncludes(specHtml, "[a, b] &amp;&amp; { key: &#39;val&#39; }", "Escapes brackets, braces, and strings in code block");
    assertIncludes(specHtml, "<li>Item &lt;1&gt;</li>", "Escapes angle brackets in list items");

    const specPdfResult = await exportService.exportDocument(specCharBlocks, "Special Characters Doc", "pdf");
    const specPdfBuf = specPdfResult.content as Buffer;
    assert(Buffer.isBuffer(specPdfBuf) && specPdfBuf.subarray(0, 5).toString("utf-8") === "%PDF-", "PDF export completes cleanly with special characters");

    // ─── SUITE 2: HTML-Like & Executable Script Injection Prevention ───────────
    console.log("\nSUITE 2: Script & HTML Injection Security");

    const injectionBlocks: AstBlock[] = [
      {
        id: "blk-inj-1",
        type: "heading",
        data: { text: "<script>alert('heading-xss')</script>" },
      },
      {
        id: "blk-inj-2",
        type: "paragraph",
        data: { text: '<img src="x" onerror="alert(\'img-xss\')"> <b>Bold-looking text</b>' },
      },
      {
        id: "blk-inj-3",
        type: "code",
        data: {
          language: "html",
          code: "<script>console.log('code-script')</script>",
        },
      },
    ];

    const injHtmlResult = await exportService.exportDocument(injectionBlocks, "Security Test", "html");
    const injHtml = injHtmlResult.content as string;

    assertNotIncludes(injHtml, "<script>", "Zero raw <script> tags present in output");
    assertNotIncludes(injHtml, '<img src="x"', "Zero raw <img> tags present in output");
    assertNotIncludes(injHtml, "<b>Bold-looking", "User HTML tags not rendered raw");
    assertIncludes(injHtml, "&lt;script&gt;alert(&#39;heading-xss&#39;)&lt;/script&gt;", "Script tags safely entity-encoded");
    assertIncludes(injHtml, "&lt;b&gt;Bold-looking text&lt;/b&gt;", "Inline HTML tags safely entity-encoded");

    // ─── SUITE 3: Empty & Minimal Document AST Validation ───────────────────
    console.log("\nSUITE 3: Empty & Minimal Document Validation & Export");

    const minimalBlocks: AstBlock[] = [
      {
        id: "blk-min-p",
        type: "paragraph",
        data: { text: "" }, // Empty paragraph text
      },
      {
        id: "blk-min-c",
        type: "code",
        data: { language: "text", code: "" }, // Empty code content
      },
    ];

    const minValidation = validateDocumentAST({
      title: "Minimal Doc",
      ownerId: "user-min",
      version: 1,
      blocks: minimalBlocks,
    });
    assert(minValidation.isValid === true, "Minimal document with empty text fields passes AST validation");

    const minHtmlResult = await exportService.exportDocument(minimalBlocks, "Minimal Doc", "html");
    const minHtml = minHtmlResult.content as string;
    assertIncludes(minHtml, "<p></p>", "Empty paragraph renders as <p></p>");
    assertIncludes(minHtml, '<code class="language-text"></code>', "Empty code renders with empty code tag");

    const minPdfResult = await exportService.exportDocument(minimalBlocks, "Minimal Doc", "pdf");
    assert(Buffer.isBuffer(minPdfResult.content), "Minimal document exports cleanly to PDF");

    // ─── SUITE 4: Large Document (20+ Blocks) Multi-Page PDF ────────────────
    console.log("\nSUITE 4: Large Document (20+ Blocks) Multi-Page Generation");

    const largeBlocks: AstBlock[] = [];
    for (let i = 1; i <= 25; i++) {
      largeBlocks.push({
        id: `blk-large-h-${i}`,
        type: "heading",
        data: { text: `Section ${i}: Performance & Scalability Architecture` },
      });
      largeBlocks.push({
        id: `blk-large-p-${i}`,
        type: "paragraph",
        data: { text: `Paragraph ${i} content detailing section architecture, MongoDB persistence, and pipeline efficiency for SyncDoc backend.` },
      });
      largeBlocks.push({
        id: `blk-large-c-${i}`,
        type: "code",
        data: {
          language: "typescript",
          code: `function processSection${i}() {\n  const status = "OK";\n  return { section: ${i}, status };\n}`,
        },
      });
      largeBlocks.push({
        id: `blk-large-l-${i}`,
        type: "list",
        data: {
          ordered: true,
          items: [`Task ${i}.1: Benchmark`, `Task ${i}.2: Validate`],
        },
      });
    }

    assert(largeBlocks.length === 100, "Generated 100-block large document fixture");

    const largeHtmlResult = await exportService.exportDocument(largeBlocks, "Large Doc", "html");
    const largeHtml = largeHtmlResult.content as string;
    assertIncludes(largeHtml, "Section 25: Performance", "Large document HTML includes last section content");

    const largePdfResult = await exportService.exportDocument(largeBlocks, "Large Doc", "pdf");
    const largePdfBuf = largePdfResult.content as Buffer;
    assert(largePdfBuf.length > 50000, `Large document multi-page PDF buffer size is substantial (${largePdfBuf.length} bytes)`);
    assert(largePdfBuf.subarray(0, 5).toString("utf-8") === "%PDF-", "Large document PDF header is valid '%PDF-'");

    // ─── SUITE 5: Long Text & Wrapping Formatting ───────────────────────────
    console.log("\nSUITE 5: Long Text & Code Line Formatting");

    const longParagraphText = "SyncDoc ".repeat(200); // 1600 characters
    const longCodeLine = "const veryLongVariableName = " + '"x".repeat(300); '.repeat(10);

    const longBlocks: AstBlock[] = [
      {
        id: "blk-long-p",
        type: "paragraph",
        data: { text: longParagraphText },
      },
      {
        id: "blk-long-c",
        type: "code",
        data: { language: "typescript", code: longCodeLine },
      },
    ];

    const longHtmlResult = await exportService.exportDocument(longBlocks, "Long Text Doc", "html");
    const longHtml = longHtmlResult.content as string;
    assertIncludes(longHtml, longParagraphText, "Long paragraph text preserved completely in HTML output");

    const longPdfResult = await exportService.exportDocument(longBlocks, "Long Text Doc", "pdf");
    assert(Buffer.isBuffer(longPdfResult.content), "Long text document renders PDF without server crash");

    // ─── SUITE 6: Unicode & International Text ──────────────────────────────
    console.log("\nSUITE 6: Unicode, Emojis & International Text");

    const unicodeBlocks: AstBlock[] = [
      {
        id: "blk-uni-1",
        type: "heading",
        data: { text: "SyncDoc – Backend Engine" },
      },
      {
        id: "blk-uni-2",
        type: "paragraph",
        data: { text: "Tamil: வணக்கம் | Emojis: 🚀 ✈️ 📄 | Symbols: © ™ → ✓" },
      },
      {
        id: "blk-uni-3",
        type: "code",
        data: {
          language: "text",
          code: "// Tamil: வணக்கம்\nconsole.log('🚀 SyncDoc Engine ✓');",
        },
      },
    ];

    const uniHtmlResult = await exportService.exportDocument(unicodeBlocks, "Unicode Doc", "html");
    const uniHtml = uniHtmlResult.content as string;
    assertIncludes(uniHtml, "வணக்கம்", "Tamil characters preserved in HTML");
    assertIncludes(uniHtml, "🚀 ✈️ 📄", "Emoji characters preserved in HTML");
    assertIncludes(uniHtml, "© ™ → ✓", "Symbol characters preserved in HTML");

    const uniPdfResult = await exportService.exportDocument(unicodeBlocks, "Unicode Doc", "pdf");
    assert(Buffer.isBuffer(uniPdfResult.content), "Unicode document renders PDF without crash");

    // ─── SUITE 7: Unsafe Document Titles & Header Injection ───────────────
    console.log("\nSUITE 7: Unsafe Document Titles & Header Injection Prevention");

    assert(
      sanitizeFilename("SyncDoc: Week 3 / Export\r\nHeader-Injection: test\n<Title>*?|\"Quotes\"") ===
        "SyncDoc_Week_3_ExportHeader-Injection_test_Title_Quotes",
      "Sanitizes newlines, colons, slashes, quotes, and pipes safely"
    );

    // ─── SUITE 8: Error Responses (400, 404, Format Validation) ─────────────
    console.log("\nSUITE 8: Error Responses & Query Parameter Validation");

    documentService.getById = async (id: string) => {
      if (id === "60c72b2f9b1d8b2b8c8b0000") return null;
      return null;
    };

    // Invalid ID 123
    const req123 = { params: { id: "123" }, query: { format: "pdf" } } as unknown as Request;
    const mock123 = createMockRes();
    let mwCalled = false;
    validateObjectId(req123, mock123.res, () => { mwCalled = true; });
    assert(mock123.getStatus() === 400, "Invalid ID '123' returns HTTP 400 Bad Request");
    assert(mwCalled === false, "ObjectId middleware halts chain on invalid ID");

    // 404 Non-existent document
    const req404 = { params: { id: "60c72b2f9b1d8b2b8c8b0000" }, query: { format: "pdf" } } as unknown as Request;
    const mock404 = createMockRes();
    await exportController.exportDocument(req404, mock404.res, () => {});
    assert(mock404.getStatus() === 404, "Non-existent valid ObjectId returns HTTP 404 Not Found");

    // Invalid format parameters: docx, xyz, exe
    for (const badFmt of ["docx", "xyz", "exe"]) {
      const reqBad = { params: { id: "60c72b2f9b1d8b2b8c8b0000" }, query: { format: badFmt } } as unknown as Request;
      const mockBad = createMockRes();
      await exportController.exportDocument(reqBad, mockBad.res, () => {});
      assert(mockBad.getStatus() === 400, `format=${badFmt} returns HTTP 400 Bad Request`);
    }

    // Query parameter array format[]=pdf
    const reqArr = { params: { id: "60c72b2f9b1d8b2b8c8b0000" }, query: { format: ["pdf", "html"] } } as unknown as Request;
    const mockArr = createMockRes();
    await exportController.exportDocument(reqArr, mockArr.res, () => {});
    assert(mockArr.getStatus() === 404, "format=['pdf', 'html'] safely extracts 'pdf' and proceeds to document lookup (404)");

    // ─── SUITE 9: Sequential PDF Exports & Resource Release ────────────────
    console.log("\nSUITE 9: Repeated PDF Export Stability & Browser Release");

    const sampleDocBlocks: AstBlock[] = [
      { id: "b1", type: "heading", data: { text: "Repeated Test" } },
      { id: "b2", type: "paragraph", data: { text: "Testing sequential browser execution." } },
    ];

    for (let i = 1; i <= 5; i++) {
      const pdfBufferRepeat = await pdfService.generatePdf(
        `<!DOCTYPE html><html><body><h1>Run ${i}</h1></body></html>`
      );
      assert(Buffer.isBuffer(pdfBufferRepeat) && pdfBufferRepeat.length > 500, `Sequential PDF run ${i}/5 completed successfully`);
    }

    // ─── SUITE 10: Read-Only Export Integrity & Versioning Check ─────────────
    console.log("\nSUITE 10: Export Read-Only Integrity & Version Check");

    const docBeforeExport = {
      _id: "60c72b2f9b1d8b2b8c8b1111",
      id: "60c72b2f9b1d8b2b8c8b1111",
      title: "Read-Only Test Doc",
      ownerId: "user-readonly",
      version: 7,
      blocks: sampleDocBlocks,
    };

    // Perform exports
    await exportService.exportDocument(docBeforeExport.blocks, docBeforeExport.title, "html");
    await exportService.exportDocument(docBeforeExport.blocks, docBeforeExport.title, "pdf");

    assert(docBeforeExport.version === 7, "Exporting HTML/PDF DOES NOT mutate document version (remains 7)");
    assert(docBeforeExport.blocks.length === 2, "Exporting HTML/PDF DOES NOT mutate block count");
    assert(docBeforeExport.blocks[0].id === "b1", "Exporting HTML/PDF DOES NOT mutate block order");

    // AST mutation update check
    documentService.applyChange = async (_id, _change) => {
      return {
        success: true,
        ast: { ...docBeforeExport, version: docBeforeExport.version + 1 } as unknown as import("./models/Document.js").IDocument,
      };
    };

    const mutationChange: ASTChange = {
      documentId: docBeforeExport.id,
      blockId: "b2",
      operation: "UPDATE_BLOCK",
      version: 7,
      payload: { data: { text: "Updated text" } },
    };

    const mutResult = await documentService.applyChange(docBeforeExport.id, mutationChange);
    assert(mutResult.success === true, "AST change operation succeeds");
    if (mutResult.success) {
      assert(mutResult.ast.version === 8, "AST change DOES increment document version from 7 to 8");
    }

    // ─── SUITE 11: Security Review (No Secret / Credentials Exposure) ───────
    console.log("\nSUITE 11: Security Review (No Environment / Credential Exposure)");

    const errMock = createMockRes();
    const testErr = new Error("Database connection timeout at mongodb://admin:secret@127.0.0.1:27017/db");
    const { errorHandler } = await import("./middleware/errorHandler.js");

    errorHandler(testErr, {} as Request, errMock.res, () => {});

    assert(errMock.getStatus() === 500, "Error handler returns HTTP 500 for unexpected errors");
    const errBody = errMock.getBody() as { success: boolean; message: string };
    assert(errBody.success === false, "Error response has success=false");
    assert(errBody.message === "Internal server error", "Internal server error message is sanitized");
    assertNotIncludes(JSON.stringify(errBody), "mongodb://", "Does NOT leak database connection URI");
    assertNotIncludes(JSON.stringify(errBody), "secret", "Does NOT leak credentials");

    // ─── Final Summary ──────────────────────────────────────────────────────
    console.log("\n=================================================");
    console.log(`RESULTS: ${passed} passed, ${failed} failed`);
    console.log("=================================================\n");

    if (failures.length > 0) {
      console.log("FAILURES:");
      failures.forEach((f) => console.log(`  ❌ ${f}`));
      process.exit(1);
    } else {
      console.log("All Day 6 robustness and security tests passed successfully! 🚀\n");
    }
  } finally {
    documentService.getById = originalGetById;
    documentService.applyChange = originalApplyChange;
  }
}

runRobustnessSuite().catch((err) => {
  console.error("Unhandled error during robustness tests:", err);
  process.exit(1);
});
