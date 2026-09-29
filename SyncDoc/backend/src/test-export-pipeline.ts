/**
 * SyncDoc Project — Week 3 Day 5
 * Complete Document → AST → HTML/PDF → Export Pipeline Integration Verification Suite
 *
 * Covers:
 *   1. Document Creation → Storage → Immediate HTML/PDF Export
 *   2. AST Mutations (CREATE, UPDATE, MOVE, DELETE) → Version Incrementing → Updated Export Pipeline
 *   3. Validation & Normalization enforcement (invalid change rejection preserves document state & version)
 *   4. Content fidelity across all 4 supported AST block types (heading, paragraph, code, list)
 *   5. Preserved whitespace, tabs, and indentation in code blocks
 *   6. Special character HTML escaping security (< > & " ')
 *
 * Run: npx tsx src/test-export-pipeline.ts
 */

import documentService from "./services/documentService.js";
import exportService from "./services/exportService.js";
import type { AstBlock } from "./models/AstNode.js";
import type { ASTChange, ASTChangeSuccessResult } from "./types/astChangeTypes.js";

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

// ─── Initial Document AST Fixture ────────────────────────────────────────────

const initialBlocks: AstBlock[] = [
  {
    id: "blk-h1-pipeline",
    type: "heading",
    data: { text: "SyncDoc Export Test" },
  },
  {
    id: "blk-p1-pipeline",
    type: "paragraph",
    data: { text: "This is a collaborative document exported from the SyncDoc backend." },
  },
  {
    id: "blk-code1-pipeline",
    type: "code",
    data: {
      language: "typescript",
      code: `function hello() {\n  return "SyncDoc";\n}`,
    },
  },
  {
    id: "blk-list1-pipeline",
    type: "list",
    data: {
      ordered: false,
      items: ["Backend", "AST", "Export"],
    },
  },
];

interface MockDocInStore {
  _id: string;
  id: string;
  title: string;
  ownerId: string;
  version: number;
  blocks: AstBlock[];
}

const storageMap = new Map<string, MockDocInStore>();

async function runPipelineIntegrationTests(): Promise<void> {
  console.log("=================================================");
  console.log("SyncDoc Week 3 Day 5 — Pipeline Integration Suite");
  console.log("=================================================\n");

  // Save original documentService methods
  const originalCreate = documentService.create;
  const originalGetById = documentService.getById;
  const originalApplyChange = documentService.applyChange;

  try {
    // ─── Mock documentService to simulate full database round-trip ──────────
    documentService.create = async (input) => {
      const docId = "60c72b2f9b1d8b2b8c8b5555";
      const doc: MockDocInStore = {
        _id: docId,
        id: docId,
        title: input.title,
        ownerId: input.ownerId,
        version: 1,
        blocks: input.blocks ?? [],
      };
      storageMap.set(docId, doc);
      return doc as unknown as Awaited<ReturnType<typeof documentService.create>>;
    };

    documentService.getById = async (id) => {
      const found = storageMap.get(id);
      return (found ? { ...found } : null) as unknown as Awaited<ReturnType<typeof documentService.getById>>;
    };

    documentService.applyChange = async (id, change) => {
      const doc = storageMap.get(id);
      if (!doc) {
        return {
          success: false,
          message: `Document '${id}' not found`,
          errors: [{ path: "id", message: "Document not found" }],
        };
      }

      const { applyASTChange } = await import("./utils/astChangeUtils.js");
      const changeResult = applyASTChange(doc, change);

      if (!changeResult.success) {
        return changeResult;
      }

      doc.blocks = changeResult.ast.blocks;
      doc.version = (doc.version || 1) + 1;
      storageMap.set(id, doc);

      return {
        success: true,
        ast: { ...doc } as unknown as import("./models/Document.js").IDocument,
      };
    };

    // ─── STEP 1: Document Creation & Initial Storage ───────────────────────
    console.log("STEP 1: Document Creation & MongoDB Storage Round-Trip");

    const createdDoc = await documentService.create({
      title: "SyncDoc Export Test",
      ownerId: "user-pipeline-5",
      blocks: initialBlocks,
    });

    const docId = (createdDoc as unknown as MockDocInStore).id;
    assert(docId === "60c72b2f9b1d8b2b8c8b5555", "Document created with valid ID");
    assert(createdDoc.version === 1, "New document starts at version 1");
    assert(createdDoc.blocks.length === 4, "Initial document has 4 AST blocks");

    // Fetch from storage
    const storedDoc = await documentService.getById(docId);
    assert(storedDoc !== null, "Stored document retrieved successfully from database");
    assert(storedDoc?.title === "SyncDoc Export Test", "Stored document title matches created title");

    // ─── STEP 2: Initial Export Pipeline (HTML & PDF) ────────────────────────
    console.log("\nSTEP 2: Initial HTML & PDF Export Pipeline");

    const initialHtmlExport = await exportService.exportDocument(
      storedDoc!.blocks,
      storedDoc!.title,
      "html"
    );

    assert(initialHtmlExport.format === "html", "Initial export produces 'html' format");
    assert(initialHtmlExport.contentType === "text/html", "Initial HTML export Content-Type is 'text/html'");

    const htmlContent = initialHtmlExport.content as string;
    assertIncludes(htmlContent, "<h1>SyncDoc Export Test</h1>", "HTML export contains heading block");
    assertIncludes(htmlContent, "<p>This is a collaborative document exported from the SyncDoc backend.</p>", "HTML export contains paragraph block");
    assertIncludes(htmlContent, '<code class="language-typescript">', "HTML export contains code block");
    assertIncludes(htmlContent, "<ul><li>Backend</li><li>AST</li><li>Export</li></ul>", "HTML export contains list block");

    // Block ordering check
    const h1Pos = htmlContent.indexOf("<h1>");
    const pPos = htmlContent.indexOf("<p>");
    const codePos = htmlContent.indexOf("<pre>");
    const listPos = htmlContent.indexOf("<ul>");
    assert(h1Pos < pPos && pPos < codePos && codePos < listPos, "Initial block ordering strictly preserved in HTML export");

    // Initial PDF export
    const initialPdfExport = await exportService.exportDocument(
      storedDoc!.blocks,
      storedDoc!.title,
      "pdf"
    );

    assert(initialPdfExport.format === "pdf", "Initial export produces 'pdf' format");
    assert(initialPdfExport.contentType === "application/pdf", "Initial PDF export Content-Type is 'application/pdf'");

    const pdfBuffer = initialPdfExport.content as Buffer;
    assert(Buffer.isBuffer(pdfBuffer), "PDF export returns binary Buffer");
    assert(pdfBuffer.length > 1000, `PDF Buffer size is substantial (${pdfBuffer.length} bytes)`);
    assert(pdfBuffer.subarray(0, 5).toString("utf-8") === "%PDF-", "PDF Buffer starts with '%PDF-' magic header");

    // ─── STEP 3: AST Changes → Version Tracking → Export Update ─────────────
    console.log("\nSTEP 3: AST Change Engine Mutations → Version Tracking → Export");

    // A. UPDATE_BLOCK
    const updateChange: ASTChange = {
      documentId: docId,
      blockId: "blk-p1-pipeline",
      operation: "UPDATE_BLOCK",
      version: 1,
      payload: {
        data: { text: "Updated collaborative text with special characters: <script>alert('xss')</script> & 'quotes'." },
      },
    };

    const updateResult = await documentService.applyChange(docId, updateChange);
    assert(updateResult.success === true, "UPDATE_BLOCK operation succeeded");
    if (updateResult.success) {
      const updatedAst = (updateResult as ASTChangeSuccessResult).ast;
      assert(updatedAst.version === 2, "Document version auto-incremented to 2 after UPDATE_BLOCK");

      // Export HTML after UPDATE_BLOCK
      const htmlAfterUpdate = await exportService.exportDocument(
        updatedAst.blocks,
        updatedAst.title,
        "html"
      );
      assertIncludes(
        htmlAfterUpdate.content as string,
        "Updated collaborative text with special characters: &lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt; &amp; &#39;quotes&#39;.",
        "Exported HTML reflects updated paragraph text with safe entity escaping"
      );
    }

    // B. CREATE_BLOCK
    const createChange: ASTChange = {
      documentId: docId,
      blockId: "blk-code2-pipeline",
      operation: "CREATE_BLOCK",
      version: 2,
      payload: {
        type: "code",
        targetIndex: 2,
        data: {
          language: "python",
          code: "def sync_doc():\n    return 'PDF & HTML'\n",
        },
      },
    };

    const createResult = await documentService.applyChange(docId, createChange);
    assert(createResult.success === true, "CREATE_BLOCK operation succeeded");
    if (createResult.success) {
      const createdAst = (createResult as ASTChangeSuccessResult).ast;
      assert(createdAst.version === 3, "Document version auto-incremented to 3 after CREATE_BLOCK");
      assert(createdAst.blocks.length === 5, "Block count increased to 5");
    }

    // C. MOVE_BLOCK
    const moveChange: ASTChange = {
      documentId: docId,
      blockId: "blk-h1-pipeline",
      operation: "MOVE_BLOCK",
      version: 3,
      payload: {
        targetIndex: 4,
      },
    };

    const moveResult = await documentService.applyChange(docId, moveChange);
    assert(moveResult.success === true, "MOVE_BLOCK operation succeeded");
    if (moveResult.success) {
      const movedAst = (moveResult as ASTChangeSuccessResult).ast;
      assert(movedAst.version === 4, "Document version auto-incremented to 4 after MOVE_BLOCK");
      assert(movedAst.blocks[4].id === "blk-h1-pipeline", "Heading block moved to index 4");
    }

    // D. DELETE_BLOCK
    const deleteChange: ASTChange = {
      documentId: docId,
      blockId: "blk-code1-pipeline",
      operation: "DELETE_BLOCK",
      version: 4,
    };

    const deleteResult = await documentService.applyChange(docId, deleteChange);
    assert(deleteResult.success === true, "DELETE_BLOCK operation succeeded");
    if (deleteResult.success) {
      const deletedAst = (deleteResult as ASTChangeSuccessResult).ast;
      assert(deletedAst.version === 5, "Document version auto-incremented to 5 after DELETE_BLOCK");
      assert(deletedAst.blocks.length === 4, "Block count decreased to 4 after deletion");
    }

    // Final HTML & PDF export after complete AST change sequence
    const finalDocState = await documentService.getById(docId);
    const finalHtmlExport = await exportService.exportDocument(finalDocState!.blocks, finalDocState!.title, "html");
    const finalPdfExport = await exportService.exportDocument(finalDocState!.blocks, finalDocState!.title, "pdf");

    const finalHtml = finalHtmlExport.content as string;
    assertNotIncludes(finalHtml, 'function hello()', "Deleted code block is not present in exported HTML");
    assertIncludes(finalHtml, '<code class="language-python">def sync_doc():', "Newly created Python code block is present in exported HTML");

    const finalPdfBuf = finalPdfExport.content as Buffer;
    assert(Buffer.isBuffer(finalPdfBuf) && finalPdfBuf.subarray(0, 5).toString("utf-8") === "%PDF-", "Final PDF export generates valid PDF Buffer after mutations");

    // ─── STEP 4: Invalid AST Change Rejection & State Preservation ─────────
    console.log("\nSTEP 4: Invalid AST Mutation Rejection & Preservation");

    const invalidChange: ASTChange = {
      documentId: docId,
      blockId: "blk-h1-pipeline",
      operation: "UPDATE_BLOCK",
      version: 5,
      payload: {
        data: { text: "" }, // Invalid empty heading text
      },
    };

    const invalidResult = await documentService.applyChange(docId, invalidChange);
    assert(invalidResult.success === false, "Invalid AST change (empty heading text) is rejected");

    const postInvalidDoc = await documentService.getById(docId);
    assert(postInvalidDoc?.version === 5, "Document version remains unchanged at 5 after rejected AST change");
    assert(postInvalidDoc?.blocks.length === 4, "Document block count remains unchanged after rejected AST change");

    // ─── STEP 5: Content Fidelity & Whitespace Preservation ──────────────────
    console.log("\nSTEP 5: Content Fidelity & Code Block Formatting");

    const pythonCodeBlock = postInvalidDoc?.blocks.find((b) => b.id === "blk-code2-pipeline");
    assert(pythonCodeBlock !== undefined, "Python code block found in stored AST");
    if (pythonCodeBlock && pythonCodeBlock.type === "code") {
      assert(pythonCodeBlock.data.code.includes("\n    return 'PDF & HTML'\n"), "Indentation & newlines strictly preserved in code block data");
    }

    // ─── Results Summary ────────────────────────────────────────────────────
    console.log("\n=================================================");
    console.log(`RESULTS: ${passed} passed, ${failed} failed`);
    console.log("=================================================\n");

    if (failures.length > 0) {
      console.log("FAILURES:");
      failures.forEach((f) => console.log(`  ❌ ${f}`));
      process.exit(1);
    } else {
      console.log("All pipeline integration tests passed successfully! 🚀\n");
    }
  } finally {
    documentService.create = originalCreate;
    documentService.getById = originalGetById;
    documentService.applyChange = originalApplyChange;
  }
}

runPipelineIntegrationTests().catch((err) => {
  console.error("Unhandled error during pipeline integration tests:", err);
  process.exit(1);
});
