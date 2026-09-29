/**
 * Week 2 Day 1 — Comprehensive AST Validation Test Suite
 *
 * Tests:
 *   1. Valid document cases (7+ tests)
 *   2. Invalid document cases (17+ tests)
 *   3. Database persistence protection (valid save, invalid reject, update protection)
 *   4. Stable block ID verification
 *   5. API regression tests (all Week 1 endpoints)
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import type { AddressInfo } from "net";
import app from "./app.js";
import connectDatabase from "./config/db.js";
import Document from "./models/Document.js";
import { type AstBlock } from "./models/AstNode.js";
import {
  validateDocumentAST,
  validateDocument,
  validateNode,
  validateChildren,
  type ValidationResult,
} from "./validators/astValidator.js";

// ─── Test Helpers ───────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string): void {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ ${testName}`);
    failed++;
  }
}

function assertValid(result: ValidationResult, testName: string): void {
  assert(result.isValid === true && result.errors.length === 0, testName);
  if (!result.isValid) {
    console.error(`     Errors: ${result.errors.map((e) => `${e.path}: ${e.message}`).join("; ")}`);
  }
}

function assertInvalid(result: ValidationResult, testName: string, expectedPathSubstring?: string): void {
  assert(result.isValid === false && result.errors.length > 0, testName);
  if (expectedPathSubstring) {
    const hasPath = result.errors.some((e) => e.path.includes(expectedPathSubstring));
    assert(hasPath, `  → error path contains "${expectedPathSubstring}"`);
    if (!hasPath) {
      console.error(`     Actual errors: ${result.errors.map((e) => `${e.path}: ${e.message}`).join("; ")}`);
    }
  }
}

// ─── Main Test Runner ───────────────────────────────────────────────────────

async function runWeek2Day1Tests(): Promise<void> {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Week 2 Day 1 — AST Validation Comprehensive Test Suite     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const hasMongoUri = !!process.env.MONGO_URI;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: validateDocumentAST Entry Point
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("══ 1. validateDocumentAST() Entry Point ══");

  assert(typeof validateDocumentAST === "function", "validateDocumentAST is exported as a function");
  assert(typeof validateDocument === "function", "validateDocument is still exported (backward compat)");

  // Verify both return identical results
  const testDoc = {
    title: "Test",
    ownerId: "user1",
    version: 1,
    blocks: [{ id: "b1", type: "paragraph", data: { text: "hello" } }],
  };
  const resultA = validateDocumentAST(testDoc);
  const resultB = validateDocument(testDoc);
  assert(
    resultA.isValid === resultB.isValid && resultA.errors.length === resultB.errors.length,
    "validateDocumentAST and validateDocument produce identical results"
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: Valid Document Tests (7+ tests)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 2. Valid Document Tests ══");

  // Test 1: Heading block only
  assertValid(
    validateDocumentAST({
      title: "Heading Doc",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "h1", type: "heading", data: { text: "My Heading" } }],
    }),
    "Valid: heading block only"
  );

  // Test 2: Paragraph block only
  assertValid(
    validateDocumentAST({
      title: "Paragraph Doc",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "p1", type: "paragraph", data: { text: "My paragraph" } }],
    }),
    "Valid: paragraph block only"
  );

  // Test 3: Code block only
  assertValid(
    validateDocumentAST({
      title: "Code Doc",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "c1", type: "code", data: { language: "typescript", code: "const x = 1;" } }],
    }),
    "Valid: code block only"
  );

  // Test 4: List block only
  assertValid(
    validateDocumentAST({
      title: "List Doc",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "l1", type: "list", data: { ordered: true, items: ["Item A", "Item B"] } }],
    }),
    "Valid: list block only"
  );

  // Test 5: Multiple mixed blocks
  assertValid(
    validateDocumentAST({
      title: "Mixed Doc",
      ownerId: "user1",
      version: 2,
      blocks: [
        { id: "h1", type: "heading", data: { text: "Title" } },
        { id: "p1", type: "paragraph", data: { text: "Introduction text." } },
        { id: "c1", type: "code", data: { language: "python", code: "print('hello')\n# multiline\nprint('world')" } },
        { id: "l1", type: "list", data: { ordered: false, items: ["Alpha", "Beta", "Gamma"] } },
      ],
    }),
    "Valid: multiple mixed blocks"
  );

  // Test 6: Valid document metadata
  assertValid(
    validateDocumentAST({
      title: "Metadata Test",
      ownerId: "owner-abc-123",
      version: 0,
      blocks: [{ id: "b1", type: "paragraph", data: { text: "test" } }],
    }),
    "Valid: document metadata (version=0 is valid)"
  );

  // Test 7: Nested children (current schema supports recursive traversal)
  assertValid(
    validateDocumentAST({
      title: "Nested Doc",
      ownerId: "user1",
      version: 1,
      blocks: [
        {
          id: "parent1",
          type: "paragraph",
          data: { text: "Parent block" },
          children: [
            { id: "child1", type: "heading", data: { text: "Child heading" } },
            { id: "child2", type: "code", data: { language: "js", code: "const a = 1;" } },
          ],
        },
      ],
    }),
    "Valid: nested children AST structure"
  );

  // Test 8: Code with multiline content
  assertValid(
    validateDocumentAST({
      title: "Multiline Code Doc",
      ownerId: "user1",
      version: 1,
      blocks: [
        {
          id: "mc1",
          type: "code",
          data: {
            language: "javascript",
            code: "function hello() {\n  console.log('hello');\n  return true;\n}",
          },
        },
      ],
    }),
    "Valid: multiline code content"
  );

  // Test 9: Empty paragraph text (allowed — paragraph text can be empty string)
  assertValid(
    validateDocumentAST({
      title: "Empty Para Doc",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "ep1", type: "paragraph", data: { text: "" } }],
    }),
    "Valid: paragraph with empty text (allowed)"
  );

  // Test 10: Empty code content (allowed — code can be empty string)
  assertValid(
    validateDocumentAST({
      title: "Empty Code Doc",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "ec1", type: "code", data: { language: "python", code: "" } }],
    }),
    "Valid: code with empty code string (allowed)"
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: Invalid Document Tests (17+ tests)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 3. Invalid Document Tests ══");

  // Test 1: Missing title
  assertInvalid(
    validateDocumentAST({
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "b1", type: "paragraph", data: { text: "hello" } }],
    }),
    "Invalid: missing title",
    "title"
  );

  // Test 2: Empty title
  assertInvalid(
    validateDocumentAST({
      title: "",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "b1", type: "paragraph", data: { text: "hello" } }],
    }),
    "Invalid: empty title",
    "title"
  );

  // Test 3: Missing ownerId
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      version: 1,
      blocks: [{ id: "b1", type: "paragraph", data: { text: "hello" } }],
    }),
    "Invalid: missing ownerId",
    "ownerId"
  );

  // Test 4: Empty ownerId
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "",
      version: 1,
      blocks: [{ id: "b1", type: "paragraph", data: { text: "hello" } }],
    }),
    "Invalid: empty ownerId",
    "ownerId"
  );

  // Test 5: Missing blocks
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
    }),
    "Invalid: missing blocks",
    "blocks"
  );

  // Test 6: Blocks is not an array
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
      blocks: "not-an-array",
    }),
    "Invalid: blocks is not an array",
    "blocks"
  );

  // Test 7: Missing block ID
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
      blocks: [{ type: "paragraph", data: { text: "hello" } }],
    }),
    "Invalid: missing block ID",
    "id"
  );

  // Test 8: Duplicate block ID
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
      blocks: [
        { id: "b1", type: "heading", data: { text: "Heading" } },
        { id: "b1", type: "paragraph", data: { text: "Paragraph" } },
      ],
    }),
    "Invalid: duplicate block ID 'b1'",
    "blocks[1].id"
  );

  // Test 9: Unknown block type
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "b1", type: "table", data: {} }],
    }),
    "Invalid: unknown block type 'table'",
    "type"
  );

  // Test 10: Heading without text
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "b1", type: "heading", data: {} }],
    }),
    "Invalid: heading without text",
    "data.text"
  );

  // Test 11: Paragraph without text (data missing entirely)
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "b1", type: "paragraph" }],
    }),
    "Invalid: paragraph without data",
    "data"
  );

  // Test 12: Code without language
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "b1", type: "code", data: { code: "console.log('hi')" } }],
    }),
    "Invalid: code without language",
    "data.language"
  );

  // Test 13: Code without code
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "b1", type: "code", data: { language: "javascript" } }],
    }),
    "Invalid: code without code",
    "data.code"
  );

  // Test 14: List without items
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "b1", type: "list", data: { ordered: true } }],
    }),
    "Invalid: list without items",
    "data.items"
  );

  // Test 15: List item with invalid type (number instead of string)
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "b1", type: "list", data: { ordered: false, items: ["valid", 42, "also valid"] } }],
    }),
    "Invalid: list item with invalid type (number)",
    "data.items[1]"
  );

  // Test 16: Invalid nested child (bad type in children)
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
      blocks: [
        {
          id: "parent1",
          type: "paragraph",
          data: { text: "Parent" },
          children: [
            { id: "child1", type: "unknown_type", data: {} },
          ],
        },
      ],
    }),
    "Invalid: nested child with bad type",
    "children"
  );

  // Test 17: Invalid version (non-integer)
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1.5,
      blocks: [{ id: "b1", type: "paragraph", data: { text: "hello" } }],
    }),
    "Invalid: version is non-integer (1.5)",
    "version"
  );

  // Test 18: Invalid version (negative)
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: -1,
      blocks: [{ id: "b1", type: "paragraph", data: { text: "hello" } }],
    }),
    "Invalid: version is negative (-1)",
    "version"
  );

  // Test 19: Whitespace-only title
  assertInvalid(
    validateDocumentAST({
      title: "   ",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "b1", type: "paragraph", data: { text: "hello" } }],
    }),
    "Invalid: whitespace-only title",
    "title"
  );

  // Test 20: Whitespace-only ownerId
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "   ",
      version: 1,
      blocks: [{ id: "b1", type: "paragraph", data: { text: "hello" } }],
    }),
    "Invalid: whitespace-only ownerId",
    "ownerId"
  );

  // Test 21: Empty block ID
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "", type: "paragraph", data: { text: "hello" } }],
    }),
    "Invalid: empty block ID",
    "id"
  );

  // Test 22: Heading with empty text
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
      blocks: [{ id: "b1", type: "heading", data: { text: "" } }],
    }),
    "Invalid: heading with empty text",
    "data.text"
  );

  // Test 23: Children is not an array
  {
    const seenIds = new Set<string>();
    const childErrors = validateChildren("not-an-array", "parent1", seenIds, "blocks[0].children");
    assert(
      childErrors.length > 0 && childErrors[0].path === "blocks[0].children",
      "Invalid: children is not an array"
    );
  }

  // Test 24: Duplicate IDs across nested children
  assertInvalid(
    validateDocumentAST({
      title: "Valid Title",
      ownerId: "user1",
      version: 1,
      blocks: [
        { id: "shared-id", type: "heading", data: { text: "Heading" } },
        {
          id: "parent1",
          type: "paragraph",
          data: { text: "Parent" },
          children: [
            { id: "shared-id", type: "paragraph", data: { text: "child with duplicate ID" } },
          ],
        },
      ],
    }),
    "Invalid: duplicate ID across root and nested child",
    "id"
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: Recursive Traversal Verification
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 4. Recursive Traversal Verification ══");

  // Deep nesting validation
  {
    const seenIds = new Set<string>();
    const errors = validateNode(
      {
        id: "level0",
        type: "paragraph",
        data: { text: "L0" },
        children: [
          {
            id: "level1",
            type: "paragraph",
            data: { text: "L1" },
            children: [
              {
                id: "level2",
                type: "heading",
                data: { text: "L2" },
              },
            ],
          },
        ],
      },
      0,
      seenIds,
      "blocks[0]"
    );
    assert(errors.length === 0, "Recursive: 3-level deep nesting validates successfully");
    assert(seenIds.has("level0") && seenIds.has("level1") && seenIds.has("level2"),
      "Recursive: all 3 nested IDs tracked in seenIds"
    );
  }

  // Deep nesting with invalid leaf
  {
    const seenIds = new Set<string>();
    const errors = validateNode(
      {
        id: "p0",
        type: "paragraph",
        data: { text: "Parent" },
        children: [
          {
            id: "c0",
            type: "paragraph",
            data: { text: "Child" },
            children: [
              {
                id: "gc0",
                type: "heading",
                data: {},  // Missing text — should fail
              },
            ],
          },
        ],
      },
      0,
      seenIds,
      "blocks[0]"
    );
    assert(errors.length > 0, "Recursive: invalid deep leaf detected");
    assert(
      errors.some((e) => e.path.includes("children[0].children[0]")),
      "Recursive: error path traces to deep nested node"
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: Database Persistence Tests (requires MONGO_URI)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 5. Database Persistence Tests ══");

  if (hasMongoUri) {
    await connectDatabase();

    // Clean up test data
    await Document.deleteMany({ ownerId: "w2d1-test-user" });

    // Test: Valid AST → Mongoose → MongoDB → saved successfully
    console.log("  --- 5a. Valid document persistence ---");
    const validDoc = new Document({
      title: "W2D1 Persistence Test",
      ownerId: "w2d1-test-user",
      version: 1,
      blocks: [
        { id: "pb1", type: "heading", data: { text: "Test Heading" } } as AstBlock,
        { id: "pb2", type: "paragraph", data: { text: "Test paragraph content." } } as AstBlock,
        { id: "pb3", type: "code", data: { language: "typescript", code: "const x = 42;" } } as AstBlock,
        { id: "pb4", type: "list", data: { ordered: true, items: ["One", "Two", "Three"] } } as AstBlock,
      ],
    });
    const savedDoc = await validDoc.save();
    const savedId = savedDoc._id;
    assert(!!savedId, "DB: valid document saved successfully to MongoDB");

    // Retrieve and verify
    const retrieved = await Document.findById(savedId).lean();
    assert(retrieved !== null && retrieved.title === "W2D1 Persistence Test", "DB: retrieved document matches saved data");
    assert(
      Array.isArray(retrieved?.blocks) && retrieved.blocks.length === 4,
      "DB: all 4 blocks persisted correctly"
    );

    // Test: Invalid AST → Mongoose pre-save → rejection → MongoDB NOT modified
    console.log("  --- 5b. Invalid document pre-save rejection ---");
    const invalidDoc = new Document({
      title: "Invalid Doc",
      ownerId: "w2d1-test-user",
      version: 1,
      blocks: [{ id: "bad1", type: "heading", data: {} } as AstBlock],
    });

    let preSaveRejected = false;
    try {
      await invalidDoc.save();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "ValidationError") {
        preSaveRejected = true;
      }
    }
    assert(preSaveRejected, "DB: pre-save hook rejected invalid AST (heading without text)");

    // Verify invalid doc was NOT persisted
    const invalidInDb = await Document.findOne({ title: "Invalid Doc", ownerId: "w2d1-test-user" }).lean();
    assert(invalidInDb === null, "DB: invalid document was NOT persisted to MongoDB");

    // Test: Update protection — invalid update doesn't overwrite valid document
    console.log("  --- 5c. Update protection (invalid update rejected) ---");
    const docToUpdate = await Document.findById(savedId);
    assert(docToUpdate !== null, "DB: found existing valid document for update test");

    if (docToUpdate) {
      // Attempt invalid update — remove text from paragraph
      docToUpdate.blocks = [
        { id: "pb1", type: "heading", data: {} } as AstBlock,
      ];

      let updateRejected = false;
      try {
        await docToUpdate.save();
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "ValidationError") {
          updateRejected = true;
        }
      }
      assert(updateRejected, "DB: invalid update rejected by pre-save hook");

      // Verify original document remains intact
      const afterFailed = await Document.findById(savedId).lean();
      assert(
        afterFailed !== null && Array.isArray(afterFailed.blocks) && afterFailed.blocks.length === 4,
        "DB: existing valid document remains intact after failed update"
      );
    }

    // Test: Stable block IDs
    console.log("  --- 5d. Stable block ID verification ---");
    const stableDoc = await Document.findById(savedId);
    if (stableDoc) {
      const originalIds = stableDoc.blocks.map((b) => b.id);

      // Update content only, not IDs
      stableDoc.blocks = stableDoc.blocks.map((block) => {
        if (block.type === "paragraph") {
          return { ...block, data: { text: "Updated paragraph content" } } as AstBlock;
        }
        return block;
      });

      const updatedDoc = await stableDoc.save();
      const updatedIds = updatedDoc.blocks.map((b) => b.id);

      assert(
        originalIds.length === updatedIds.length &&
        originalIds.every((id, i) => id === updatedIds[i]),
        "DB: block IDs remain stable after content update"
      );
    }

    // Clean up test data
    await Document.deleteMany({ ownerId: "w2d1-test-user" });

  } else {
    console.log("  ⚠️  Skipping DB persistence tests (MONGO_URI not set)");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6: API Regression Tests (all Week 1 endpoints)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 6. API Regression Tests ══");

  const server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 6a. GET /api/health
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthBody = await healthRes.json() as Record<string, unknown>;
    assert(healthRes.status === 200 && healthBody.success === true, "Regression: GET /api/health returns 200");

    if (hasMongoUri) {
      // 6b. POST /api/documents (valid)
      const createRes = await fetch(`${baseUrl}/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "W2D1 Regression Test",
          ownerId: "w2d1-regression-user",
          blocks: [
            { id: "reg-h1", type: "heading", data: { text: "Regression Heading" } },
            { id: "reg-p1", type: "paragraph", data: { text: "Regression paragraph." } },
          ],
        }),
      });
      const createBody = await createRes.json() as Record<string, unknown>;
      assert(createRes.status === 201 && createBody.success === true, "Regression: POST /api/documents returns 201");

      const createdData = createBody.data as Record<string, unknown>;
      const createdId = createdData._id as string;
      assert(!!createdId, "Regression: created document has _id");

      // 6c. GET /api/documents (list)
      const listRes = await fetch(`${baseUrl}/api/documents`);
      const listBody = await listRes.json() as Record<string, unknown>;
      assert(listRes.status === 200 && Array.isArray(listBody.data), "Regression: GET /api/documents returns 200");

      // 6d. GET /api/documents/:id
      const getRes = await fetch(`${baseUrl}/api/documents/${createdId}`);
      const getBody = await getRes.json() as Record<string, unknown>;
      assert(getRes.status === 200 && getBody.success === true, "Regression: GET /api/documents/:id returns 200");

      // 6e. PUT /api/documents/:id (valid update)
      const updateRes = await fetch(`${baseUrl}/api/documents/${createdId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated Regression Title" }),
      });
      const updateBody = await updateRes.json() as Record<string, unknown>;
      assert(updateRes.status === 200 && updateBody.success === true, "Regression: PUT /api/documents/:id returns 200");

      // Verify update persisted
      const updatedData = updateBody.data as Record<string, unknown>;
      assert(updatedData.title === "Updated Regression Title", "Regression: PUT update applied correctly");

      // 6f. POST /api/documents with invalid body (validation rejection)
      const invalidCreateRes = await fetch(`${baseUrl}/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", ownerId: "user1", blocks: [] }),
      });
      assert(invalidCreateRes.status === 400, "Regression: POST with empty title returns 400");

      // 6g. PUT /api/documents/:id with invalid blocks
      const invalidUpdateRes = await fetch(`${baseUrl}/api/documents/${createdId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [{ id: "bad", type: "unknown_type", data: {} }],
        }),
      });
      assert(invalidUpdateRes.status === 400, "Regression: PUT with invalid block type returns 400");

      // 6h. DELETE /api/documents/:id
      const deleteRes = await fetch(`${baseUrl}/api/documents/${createdId}`, {
        method: "DELETE",
      });
      const deleteBody = await deleteRes.json() as Record<string, unknown>;
      assert(deleteRes.status === 200 && deleteBody.success === true, "Regression: DELETE /api/documents/:id returns 200");

      // Verify deleted
      const getDeletedRes = await fetch(`${baseUrl}/api/documents/${createdId}`);
      assert(getDeletedRes.status === 404, "Regression: GET deleted document returns 404");

    } else {
      console.log("  ⚠️  Skipping DB-dependent API regression tests (MONGO_URI not set)");

      // Still test validation-only routes without DB
      const invalidPostRes = await fetch(`${baseUrl}/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", ownerId: "user1", blocks: [] }),
      });
      assert(invalidPostRes.status === 400, "Regression: POST with empty title returns 400 (no DB)");

      const invalidIdRes = await fetch(`${baseUrl}/api/documents/invalid-id`);
      assert(invalidIdRes.status === 400, "Regression: GET with invalid ObjectId returns 400 (no DB)");
    }

  } finally {
    server.close();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 7: Validation Error Format Verification
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 7. Validation Error Format Verification ══");

  const formatResult = validateDocumentAST({
    title: "Valid",
    ownerId: "user1",
    version: 1,
    blocks: [
      { id: "b1", type: "heading", data: {} },
      { id: "b1", type: "paragraph" },
    ],
  });

  assert(!formatResult.isValid, "Error format: invalid document detected");
  assert(
    formatResult.errors.every((e) => typeof e.path === "string" && typeof e.message === "string"),
    "Error format: every error has path (string) and message (string)"
  );
  assert(
    formatResult.errors.some((e) => e.path.includes("blocks[")),
    "Error format: error paths include block indices like blocks[N]"
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log(`║  Results: ${passed} passed, ${failed} failed                              `);
  console.log("╚══════════════════════════════════════════════════════════════╝");

  if (hasMongoUri) {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }

  if (failed > 0) {
    console.error(`\n❌ ${failed} TEST(S) FAILED`);
    process.exit(1);
  }

  console.log("\n🎉 ALL WEEK 2 DAY 1 TESTS PASSED SUCCESSFULLY!");
}

runWeek2Day1Tests();
