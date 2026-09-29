/**
 * Week 2 Day 3 — API ↔ AST ↔ MongoDB Integration Test Suite
 *
 * Tests the complete flow:
 *   HTTP Request → Normalize → Validate → Service → Mongoose → pre-save → MongoDB → Response
 *
 * Sections:
 *   1.  POST document flow (Aircraft spec sample)
 *   2.  GET document flow (AST round-trip)
 *   3.  AST round-trip comparison
 *   4.  PUT document flow (stable block ID update)
 *   5.  Invalid update protection
 *   6.  Version consistency
 *   7.  DELETE flow
 *   8.  Invalid POST cases (19 cases)
 *   9.  Invalid PUT cases
 *  10.  Error contract verification
 *  11.  Immutable field rejection
 *  12.  Normalization in API flow
 *  13.  Member 2/3 compatibility
 *  14.  Pre-save regression
 *  15.  Previous day regression
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
  type ValidationResult,
} from "./validators/astValidator.js";
import {
  traverseAST,
  collectNodeIds,
  findNodeById,
  hasDuplicateIds,
  normalizeAST,
} from "./utils/astUtils.js";

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

// The Aircraft Technical Specification sample document from the spec
const AIRCRAFT_SPEC_DOC = {
  title: "Aircraft Technical Specification",
  ownerId: "user001",
  blocks: [
    {
      id: "b1",
      type: "heading",
      data: { text: "Introduction" },
    },
    {
      id: "b2",
      type: "paragraph",
      data: { text: "Aircraft design requires multiple engineering disciplines." },
    },
    {
      id: "b3",
      type: "code",
      data: { language: "python", code: "print('SyncDoc')" },
    },
    {
      id: "b4",
      type: "list",
      data: { ordered: false, items: ["Aerodynamics", "Structures", "Propulsion"] },
    },
  ],
};

// ─── Main Test Runner ───────────────────────────────────────────────────────

async function runWeek2Day3Tests(): Promise<void> {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Week 2 Day 3 — API ↔ AST ↔ MongoDB Integration Tests     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const hasMongoUri = !!process.env.MONGO_URI;

  // Start HTTP server on dynamic port
  const server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    if (hasMongoUri) {
      await connectDatabase();
      // Clean up test data from previous runs
      await Document.deleteMany({ ownerId: "user001" });
      await Document.deleteMany({ ownerId: "w2d3-test-user" });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 0: HEALTH CHECK
    // ═══════════════════════════════════════════════════════════════════════
    console.log("══ 0. Health Check ══");

    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthBody = await healthRes.json() as Record<string, unknown>;
    assert(healthRes.status === 200 && healthBody.success === true, "GET /api/health returns 200");

    if (!hasMongoUri) {
      console.log("\n  ⚠️  MONGO_URI not set. Running validation-only tests.\n");

      // ═══════════════════════════════════════════════════════════════════
      // VALIDATION-ONLY TESTS (no DB)
      // ═══════════════════════════════════════════════════════════════════
      console.log("══ 1-NoDB. POST Validation (no DB) ══");

      // Invalid POST: empty title
      const invalidPost1 = await fetch(`${baseUrl}/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", ownerId: "user1", blocks: [] }),
      });
      assert(invalidPost1.status === 400, "POST with empty title returns 400");

      // Invalid POST: missing blocks
      const invalidPost2 = await fetch(`${baseUrl}/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "T", ownerId: "user1" }),
      });
      assert(invalidPost2.status === 400, "POST with missing blocks returns 400");

      // Invalid ObjectId
      const invalidIdRes = await fetch(`${baseUrl}/api/documents/invalid-id`);
      assert(invalidIdRes.status === 400, "GET with invalid ObjectId returns 400");

      // Validation regression (Day 1 cases)
      console.log("\n══ 2-NoDB. Validation Regression ══");
      runValidationRegressionTests();

      // AST utility regression
      console.log("\n══ 3-NoDB. AST Utility Regression ══");
      runAstUtilityTests();

      server.close();
      printSummary(hasMongoUri);
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 1: POST DOCUMENT FLOW
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 1. POST Document Flow (Aircraft Spec) ══");

    const createRes = await fetch(`${baseUrl}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(AIRCRAFT_SPEC_DOC),
    });
    const createBody = await createRes.json() as Record<string, unknown>;

    assert(createRes.status === 201, "POST returns 201 Created");
    assert(createBody.success === true, "POST response has success: true");

    const createdDoc = createBody.data as Record<string, unknown>;
    assert(typeof createdDoc._id === "string" && createdDoc._id.length > 0, "Response contains document _id");
    assert(createdDoc.title === "Aircraft Technical Specification", "Response contains title");
    assert(createdDoc.ownerId === "user001", "Response contains ownerId");
    assert(createdDoc.version === 1, "Response contains version: 1");
    assert(Array.isArray(createdDoc.blocks) && (createdDoc.blocks as unknown[]).length === 4, "Response contains 4 blocks");
    assert(createdDoc.createdAt !== undefined, "Response contains createdAt timestamp");
    assert(createdDoc.updatedAt !== undefined, "Response contains updatedAt timestamp");

    const createdId = createdDoc._id as string;
    const createdBlocks = createdDoc.blocks as Array<Record<string, unknown>>;

    // Verify block structure
    assert(createdBlocks[0].id === "b1" && createdBlocks[0].type === "heading", "Block 0: id=b1, type=heading");
    assert(createdBlocks[1].id === "b2" && createdBlocks[1].type === "paragraph", "Block 1: id=b2, type=paragraph");
    assert(createdBlocks[2].id === "b3" && createdBlocks[2].type === "code", "Block 2: id=b3, type=code");
    assert(createdBlocks[3].id === "b4" && createdBlocks[3].type === "list", "Block 3: id=b4, type=list");

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 2: GET DOCUMENT FLOW
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 2. GET Document Flow ══");

    const getRes = await fetch(`${baseUrl}/api/documents/${createdId}`);
    const getBody = await getRes.json() as Record<string, unknown>;

    assert(getRes.status === 200, "GET returns 200");
    assert(getBody.success === true, "GET response has success: true");

    const retrievedDoc = getBody.data as Record<string, unknown>;
    assert(retrievedDoc._id === createdId, "GET returns same document _id");
    assert(retrievedDoc.title === "Aircraft Technical Specification", "GET preserves title");
    assert(retrievedDoc.ownerId === "user001", "GET preserves ownerId");
    assert(retrievedDoc.version === 1, "GET preserves version");

    const retrievedBlocks = retrievedDoc.blocks as Array<Record<string, unknown>>;
    assert(retrievedBlocks.length === 4, "GET returns all 4 blocks");

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 3: AST ROUND-TRIP COMPARISON
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 3. AST Round-Trip Comparison ══");

    // Compare title, ownerId, version
    assert(retrievedDoc.title === AIRCRAFT_SPEC_DOC.title, "Round-trip: title matches");
    assert(retrievedDoc.ownerId === AIRCRAFT_SPEC_DOC.ownerId, "Round-trip: ownerId matches");
    assert(retrievedDoc.version === 1, "Round-trip: version matches");

    // Compare block count
    assert(retrievedBlocks.length === AIRCRAFT_SPEC_DOC.blocks.length, "Round-trip: block count matches");

    // Compare each block
    for (let i = 0; i < AIRCRAFT_SPEC_DOC.blocks.length; i++) {
      const original = AIRCRAFT_SPEC_DOC.blocks[i];
      const retrieved = retrievedBlocks[i];
      assert(retrieved.id === original.id, `Round-trip: block[${i}] id matches (${original.id})`);
      assert(retrieved.type === original.type, `Round-trip: block[${i}] type matches (${original.type})`);

      const origData = original.data as Record<string, unknown>;
      const retData = retrieved.data as Record<string, unknown>;

      if (original.type === "heading" || original.type === "paragraph") {
        assert(retData.text === origData.text, `Round-trip: block[${i}] data.text matches`);
      }
      if (original.type === "code") {
        assert(retData.language === origData.language, `Round-trip: block[${i}] data.language matches`);
        assert(retData.code === origData.code, `Round-trip: block[${i}] data.code matches`);
      }
      if (original.type === "list") {
        assert(retData.ordered === origData.ordered, `Round-trip: block[${i}] data.ordered matches`);
        assert(
          JSON.stringify(retData.items) === JSON.stringify(origData.items),
          `Round-trip: block[${i}] data.items matches`
        );
      }
    }

    // Block order preserved
    const retrievedIds = retrievedBlocks.map((b) => b.id);
    const originalIds = AIRCRAFT_SPEC_DOC.blocks.map((b) => b.id);
    assert(JSON.stringify(retrievedIds) === JSON.stringify(originalIds), "Round-trip: block order preserved [b1, b2, b3, b4]");

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 4: PUT DOCUMENT FLOW (Stable Block ID Update)
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 4. PUT Document Flow (Stable Block IDs) ══");

    // Update only paragraph content, keep same block IDs
    const updatedBlocks = retrievedBlocks.map((block) => {
      if (block.id === "b2") {
        return { ...block, data: { text: "Hello SyncDoc" } };
      }
      return block;
    });

    const updateRes = await fetch(`${baseUrl}/api/documents/${createdId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks: updatedBlocks }),
    });
    const updateBody = await updateRes.json() as Record<string, unknown>;

    assert(updateRes.status === 200, "PUT returns 200");
    assert(updateBody.success === true, "PUT response has success: true");

    const updatedDoc = updateBody.data as Record<string, unknown>;
    assert(updatedDoc._id === createdId, "PUT preserves document _id");

    const updatedDocBlocks = updatedDoc.blocks as Array<Record<string, unknown>>;

    // Verify stable block IDs
    assert(updatedDocBlocks[0].id === "b1", "Stable ID: b1 unchanged after update");
    assert(updatedDocBlocks[1].id === "b2", "Stable ID: b2 unchanged after update");
    assert(updatedDocBlocks[2].id === "b3", "Stable ID: b3 unchanged after update");
    assert(updatedDocBlocks[3].id === "b4", "Stable ID: b4 unchanged after update");

    // Verify content changed
    const updatedPara = updatedDocBlocks[1].data as Record<string, unknown>;
    assert(updatedPara.text === "Hello SyncDoc", "Content updated: b2 text is now 'Hello SyncDoc'");

    // Verify block order unchanged
    const updatedOrderIds = updatedDocBlocks.map((b) => b.id);
    assert(
      JSON.stringify(updatedOrderIds) === JSON.stringify(["b1", "b2", "b3", "b4"]),
      "Block order preserved after update [b1, b2, b3, b4]"
    );

    // Verify via GET that update persisted
    const getAfterUpdate = await fetch(`${baseUrl}/api/documents/${createdId}`);
    const getAfterUpdateBody = await getAfterUpdate.json() as Record<string, unknown>;
    const afterUpdateDoc = getAfterUpdateBody.data as Record<string, unknown>;
    const afterUpdateBlocks = afterUpdateDoc.blocks as Array<Record<string, unknown>>;
    const afterUpdatePara = afterUpdateBlocks[1].data as Record<string, unknown>;
    assert(afterUpdatePara.text === "Hello SyncDoc", "GET after PUT confirms content persisted");

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 5: INVALID UPDATE PROTECTION
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 5. Invalid Update Protection ══");

    // Attempt invalid update — heading without text
    const invalidUpdateRes = await fetch(`${baseUrl}/api/documents/${createdId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blocks: [{ id: "b1", type: "heading", data: {} }],
      }),
    });
    assert(invalidUpdateRes.status === 400, "Invalid update returns 400");

    // Verify original document intact
    const getAfterInvalid = await fetch(`${baseUrl}/api/documents/${createdId}`);
    const getAfterInvalidBody = await getAfterInvalid.json() as Record<string, unknown>;
    const afterInvalidDoc = getAfterInvalidBody.data as Record<string, unknown>;
    const afterInvalidBlocks = afterInvalidDoc.blocks as Array<Record<string, unknown>>;
    assert(afterInvalidBlocks.length === 4, "Original document intact: still 4 blocks after failed update");
    assert(afterInvalidBlocks[0].id === "b1", "Original document intact: b1 still present");

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 6: VERSION CONSISTENCY
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 6. Version Consistency ══");

    // Version should have incremented from the successful update in Section 4
    assert(updatedDoc.version === 2, "Version incremented to 2 after successful update");

    // Version should NOT have incremented from the failed update in Section 5
    assert(afterInvalidDoc.version === 2, "Version still 2 after failed invalid update");

    // Another successful update
    const titleUpdateRes = await fetch(`${baseUrl}/api/documents/${createdId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Aircraft Spec" }),
    });
    const titleUpdateBody = await titleUpdateRes.json() as Record<string, unknown>;
    const titleUpdatedDoc = titleUpdateBody.data as Record<string, unknown>;
    assert(titleUpdatedDoc.version === 3, "Version incremented to 3 after second successful update");

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 7: DELETE FLOW
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 7. DELETE Flow ══");

    const deleteRes = await fetch(`${baseUrl}/api/documents/${createdId}`, { method: "DELETE" });
    const deleteBody = await deleteRes.json() as Record<string, unknown>;
    assert(deleteRes.status === 200 && deleteBody.success === true, "DELETE returns 200 with success: true");

    // Verify GET returns 404
    const getDeletedRes = await fetch(`${baseUrl}/api/documents/${createdId}`);
    assert(getDeletedRes.status === 404, "GET deleted document returns 404");

    const getDeletedBody = await getDeletedRes.json() as Record<string, unknown>;
    assert(getDeletedBody.success === false, "404 response has success: false");
    assert(getDeletedBody.message === "Document not found", "404 response has 'Document not found' message");

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 8: INVALID POST CASES
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 8. Invalid POST Cases ══");

    const invalidPostCases: Array<{ name: string; payload: Record<string, unknown>; expectedPath?: string }> = [
      { name: "Missing title", payload: { ownerId: "u1", blocks: [{ id: "b1", type: "paragraph", data: { text: "hi" } }] }, expectedPath: "title" },
      { name: "Empty title", payload: { title: "", ownerId: "u1", blocks: [{ id: "b1", type: "paragraph", data: { text: "hi" } }] }, expectedPath: "title" },
      { name: "Whitespace title", payload: { title: "   ", ownerId: "u1", blocks: [{ id: "b1", type: "paragraph", data: { text: "hi" } }] }, expectedPath: "title" },
      { name: "Missing ownerId", payload: { title: "T", blocks: [{ id: "b1", type: "paragraph", data: { text: "hi" } }] }, expectedPath: "ownerId" },
      { name: "Empty ownerId", payload: { title: "T", ownerId: "", blocks: [{ id: "b1", type: "paragraph", data: { text: "hi" } }] }, expectedPath: "ownerId" },
      { name: "Missing blocks", payload: { title: "T", ownerId: "u1" }, expectedPath: "blocks" },
      { name: "Blocks not array", payload: { title: "T", ownerId: "u1", blocks: "notarray" }, expectedPath: "blocks" },
      { name: "Invalid block type", payload: { title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "table", data: {} }] }, expectedPath: "type" },
      { name: "Missing block ID", payload: { title: "T", ownerId: "u1", blocks: [{ type: "paragraph", data: { text: "hi" } }] }, expectedPath: "id" },
      { name: "Duplicate block ID", payload: { title: "T", ownerId: "u1", blocks: [
        { id: "b1", type: "heading", data: { text: "H" } },
        { id: "b1", type: "paragraph", data: { text: "P" } },
      ] }, expectedPath: "id" },
      { name: "Heading without text", payload: { title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "heading", data: {} }] }, expectedPath: "data.text" },
      { name: "Heading empty text", payload: { title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "heading", data: { text: "" } }] }, expectedPath: "data.text" },
      { name: "Paragraph without data", payload: { title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "paragraph" }] }, expectedPath: "data" },
      { name: "Code without language", payload: { title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "code", data: { code: "x" } }] }, expectedPath: "data.language" },
      { name: "Code without code", payload: { title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "code", data: { language: "js" } }] }, expectedPath: "data.code" },
      { name: "List without items", payload: { title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "list", data: { ordered: true } }] }, expectedPath: "data.items" },
      { name: "List non-string item", payload: { title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "list", data: { ordered: false, items: ["ok", 42] } }] }, expectedPath: "data.items" },
      { name: "Invalid nested child", payload: { title: "T", ownerId: "u1", blocks: [{
        id: "p1", type: "paragraph", data: { text: "P" },
        children: [{ id: "c1", type: "unknown_type", data: {} }],
      }] }, expectedPath: "children" },
      { name: "Invalid ObjectId GET", payload: {} },
    ];

    for (const testCase of invalidPostCases) {
      if (testCase.name === "Invalid ObjectId GET") {
        const res = await fetch(`${baseUrl}/api/documents/invalid-id`);
        assert(res.status === 400, `Invalid: ${testCase.name} → 400`);
        continue;
      }

      const res = await fetch(`${baseUrl}/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testCase.payload),
      });
      assert(res.status === 400, `Invalid: ${testCase.name} → 400`);

      if (testCase.expectedPath) {
        const body = await res.json() as Record<string, unknown>;
        const errors = body.errors as Array<{ path: string; message: string }>;
        if (Array.isArray(errors)) {
          const hasPath = errors.some((e) => e.path.includes(testCase.expectedPath!));
          assert(hasPath, `  → error path contains "${testCase.expectedPath}"`);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 9: INVALID PUT CASES
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 9. Invalid PUT Cases ══");

    // Create a fresh document for PUT tests
    const putTestRes = await fetch(`${baseUrl}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "PUT Test Doc",
        ownerId: "w2d3-test-user",
        blocks: [{ id: "pt1", type: "paragraph", data: { text: "Original" } }],
      }),
    });
    const putTestBody = await putTestRes.json() as Record<string, unknown>;
    const putTestId = (putTestBody.data as Record<string, unknown>)._id as string;

    // Invalid block type in update
    const invalidPut1 = await fetch(`${baseUrl}/api/documents/${putTestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks: [{ id: "pt1", type: "unknown", data: {} }] }),
    });
    assert(invalidPut1.status === 400, "Invalid PUT: unknown block type → 400");

    // Duplicate block IDs in update
    const invalidPut2 = await fetch(`${baseUrl}/api/documents/${putTestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks: [
        { id: "dup", type: "heading", data: { text: "H" } },
        { id: "dup", type: "paragraph", data: { text: "P" } },
      ] }),
    });
    assert(invalidPut2.status === 400, "Invalid PUT: duplicate block IDs → 400");

    // Empty title in update
    const invalidPut3 = await fetch(`${baseUrl}/api/documents/${putTestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    assert(invalidPut3.status === 400, "Invalid PUT: empty title → 400");

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 10: ERROR CONTRACT VERIFICATION
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 10. Error Contract Verification ══");

    // Validation error format
    const errRes = await fetch(`${baseUrl}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "heading", data: {} }] }),
    });
    const errBody = await errRes.json() as Record<string, unknown>;
    assert(errBody.success === false, "Error contract: success is false");
    assert(typeof errBody.message === "string", "Error contract: message is string");
    assert(Array.isArray(errBody.errors), "Error contract: errors is array");

    const errErrors = errBody.errors as Array<{ path: string; message: string }>;
    assert(
      errErrors.every((e) => typeof e.path === "string" && typeof e.message === "string"),
      "Error contract: each error has path and message strings"
    );

    // 404 format
    const notFoundRes = await fetch(`${baseUrl}/api/documents/64f9bf410e340e4f20bfac8a`);
    const notFoundBody = await notFoundRes.json() as Record<string, unknown>;
    assert(notFoundRes.status === 404, "Error contract: non-existent doc returns 404");
    assert(notFoundBody.success === false, "Error contract: 404 has success: false");
    assert(notFoundBody.message === "Document not found", "Error contract: 404 message is 'Document not found'");

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 11: IMMUTABLE FIELD REJECTION
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 11. Immutable Field Rejection ══");

    // Try to modify _id
    const immutable1 = await fetch(`${baseUrl}/api/documents/${putTestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: "new-id", title: "Test" }),
    });
    assert(immutable1.status === 400, "Immutable: _id modification rejected");

    // Try to modify createdAt
    const immutable2 = await fetch(`${baseUrl}/api/documents/${putTestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ createdAt: "2025-01-01", title: "Test" }),
    });
    assert(immutable2.status === 400, "Immutable: createdAt modification rejected");

    // Try to modify ownerId
    const immutable3 = await fetch(`${baseUrl}/api/documents/${putTestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId: "new-owner", title: "Test" }),
    });
    assert(immutable3.status === 400, "Immutable: ownerId modification rejected");

    // Try to modify version
    const immutable4 = await fetch(`${baseUrl}/api/documents/${putTestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: 999, title: "Test" }),
    });
    assert(immutable4.status === 400, "Immutable: version modification rejected");

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 12: NORMALIZATION IN API FLOW
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 12. Normalization in API Flow ══");

    // POST with padded metadata — should be trimmed
    const paddedRes = await fetch(`${baseUrl}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "  Padded Title  ",
        ownerId: "  w2d3-test-user  ",
        blocks: [
          { id: "  n1  ", type: "heading", data: { text: "Heading" } },
          { id: "n2", type: "code", data: { language: "  python  ", code: "  print('hello')  " } },
        ],
      }),
    });
    const paddedBody = await paddedRes.json() as Record<string, unknown>;
    assert(paddedRes.status === 201, "Normalized POST: returns 201");

    const paddedDoc = paddedBody.data as Record<string, unknown>;
    assert(paddedDoc.title === "Padded Title", "Normalized POST: title trimmed");
    assert(paddedDoc.ownerId === "w2d3-test-user", "Normalized POST: ownerId trimmed");

    const paddedBlocks = paddedDoc.blocks as Array<Record<string, unknown>>;
    assert(paddedBlocks[0].id === "n1", "Normalized POST: block ID trimmed");

    const paddedCodeData = paddedBlocks[1].data as Record<string, unknown>;
    assert(paddedCodeData.language === "python", "Normalized POST: code language trimmed");
    assert(paddedCodeData.code === "  print('hello')  ", "Normalized POST: code content NOT trimmed (preserved)");

    // Cleanup padded doc
    await fetch(`${baseUrl}/api/documents/${(paddedDoc as Record<string, unknown>)._id}`, { method: "DELETE" });

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 13: MEMBER 2/3 COMPATIBILITY
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 13. Member 2/3 Compatibility ══");

    // Create a doc and verify it has the contract fields
    const compatRes = await fetch(`${baseUrl}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Compat Verification",
        ownerId: "w2d3-test-user",
        blocks: [
          { id: "compat-h1", type: "heading", data: { text: "Heading" } },
          { id: "compat-p1", type: "paragraph", data: { text: "Paragraph" } },
          { id: "compat-c1", type: "code", data: { language: "js", code: "const x = 1;" } },
          { id: "compat-l1", type: "list", data: { ordered: true, items: ["A", "B"] } },
        ],
      }),
    });
    const compatBody = await compatRes.json() as Record<string, unknown>;
    const compatDoc = compatBody.data as Record<string, unknown>;
    const compatId = compatDoc._id as string;

    // GET the document to verify API response format
    const compatGet = await fetch(`${baseUrl}/api/documents/${compatId}`);
    const compatGetBody = await compatGet.json() as Record<string, unknown>;
    const compatGetDoc = compatGetBody.data as Record<string, unknown>;

    // Member 2 needs: documentId, blockId, version, type, data
    assert(typeof compatGetDoc._id === "string", "Member 2: documentId (_id) present as string");
    assert(typeof compatGetDoc.version === "number", "Member 2: version present as number");

    const compatBlocks = compatGetDoc.blocks as Array<Record<string, unknown>>;
    assert(
      compatBlocks.every((b) => typeof b.id === "string" && typeof b.type === "string" && typeof b.data === "object"),
      "Member 2: every block has string id, string type, object data"
    );

    // Member 3 needs: heading/paragraph/code/list mapping
    const typeSet = new Set(compatBlocks.map((b) => b.type));
    assert(
      typeSet.has("heading") && typeSet.has("paragraph") && typeSet.has("code") && typeSet.has("list"),
      "Member 3: all 4 block types present for rendering"
    );

    // Verify heading data
    const headingBlock = compatBlocks.find((b) => b.type === "heading");
    assert(
      headingBlock !== undefined && typeof (headingBlock.data as Record<string, unknown>).text === "string",
      "Member 3: heading has data.text (string)"
    );

    // Verify code data
    const codeBlock = compatBlocks.find((b) => b.type === "code");
    assert(
      codeBlock !== undefined &&
      typeof (codeBlock.data as Record<string, unknown>).language === "string" &&
      typeof (codeBlock.data as Record<string, unknown>).code === "string",
      "Member 3: code has data.language and data.code (strings)"
    );

    // Verify list data
    const listBlock = compatBlocks.find((b) => b.type === "list");
    assert(
      listBlock !== undefined &&
      typeof (listBlock.data as Record<string, unknown>).ordered === "boolean" &&
      Array.isArray((listBlock.data as Record<string, unknown>).items),
      "Member 3: list has data.ordered (boolean) and data.items (array)"
    );

    // Cleanup
    await fetch(`${baseUrl}/api/documents/${compatId}`, { method: "DELETE" });

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 14: PRE-SAVE REGRESSION
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 14. Mongoose Pre-Save Regression ══");

    // Valid document through Mongoose
    const preSaveDoc = new Document({
      title: "Pre-save Valid",
      ownerId: "w2d3-test-user",
      version: 1,
      blocks: [
        { id: "ps1", type: "heading", data: { text: "Valid" } } as AstBlock,
        { id: "ps2", type: "paragraph", data: { text: "Content" } } as AstBlock,
      ],
    });
    const savedPreSave = await preSaveDoc.save();
    assert(!!savedPreSave._id, "Pre-save: valid document saved to MongoDB");

    // Invalid document through Mongoose
    const invalidPreSaveDoc = new Document({
      title: "Pre-save Invalid",
      ownerId: "w2d3-test-user",
      version: 1,
      blocks: [{ id: "ps-bad", type: "heading", data: {} } as AstBlock],
    });

    let preSaveRejected = false;
    try {
      await invalidPreSaveDoc.save();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "ValidationError") {
        preSaveRejected = true;
      }
    }
    assert(preSaveRejected, "Pre-save: invalid document rejected by pre-save hook");

    const notPersisted = await Document.findOne({ title: "Pre-save Invalid", ownerId: "w2d3-test-user" }).lean();
    assert(notPersisted === null, "Pre-save: invalid document NOT persisted to MongoDB");

    // Cleanup
    await Document.findByIdAndDelete(savedPreSave._id);

    // ═══════════════════════════════════════════════════════════════════════
    // SECTION 15: PREVIOUS DAY REGRESSION
    // ═══════════════════════════════════════════════════════════════════════
    console.log("\n══ 15. Previous Day Regression ══");

    // AST utility tests
    runAstUtilityTests();

    // Validation regression
    runValidationRegressionTests();

    // GET /api/documents (list endpoint)
    const listRes = await fetch(`${baseUrl}/api/documents`);
    const listBody = await listRes.json() as Record<string, unknown>;
    assert(listRes.status === 200 && Array.isArray(listBody.data), "Regression: GET /api/documents returns 200 with array");

    // Cleanup remaining test data
    await Document.deleteMany({ ownerId: "w2d3-test-user" });
    await Document.deleteMany({ ownerId: "user001" });
    await fetch(`${baseUrl}/api/documents/${putTestId}`, { method: "DELETE" });

  } finally {
    server.close();
  }

  printSummary(hasMongoUri);
}

// ─── AST Utility Tests ──────────────────────────────────────────────────────

function runAstUtilityTests(): void {
  // traverseAST
  const blocks: AstBlock[] = [
    { id: "t1", type: "heading", data: { text: "H" } },
    {
      id: "t2",
      type: "paragraph",
      data: { text: "P" },
      children: [
        { id: "t3", type: "code", data: { language: "js", code: "x" } },
      ],
    } as unknown as AstBlock,
  ];

  const visited: string[] = [];
  traverseAST(blocks, (node) => visited.push(node.id));
  assert(visited.length === 3 && visited[0] === "t1" && visited[1] === "t2" && visited[2] === "t3",
    "Utility: traverseAST visits all nodes in order"
  );

  // collectNodeIds
  const ids = collectNodeIds(blocks);
  assert(ids.length === 3 && ids.includes("t1") && ids.includes("t3"),
    "Utility: collectNodeIds collects root and nested IDs"
  );

  // findNodeById
  const found = findNodeById(blocks, "t3");
  assert(found !== undefined && found.type === "code", "Utility: findNodeById finds nested node");
  const missing = findNodeById(blocks, "nonexistent");
  assert(missing === undefined, "Utility: findNodeById returns undefined for missing");

  // hasDuplicateIds
  const noDups = hasDuplicateIds(blocks);
  assert(!noDups.hasDuplicates, "Utility: hasDuplicateIds returns false for unique IDs");

  const dupBlocks: AstBlock[] = [
    { id: "dup", type: "heading", data: { text: "H" } },
    { id: "dup", type: "paragraph", data: { text: "P" } },
  ];
  const hasDups = hasDuplicateIds(dupBlocks);
  assert(hasDups.hasDuplicates && hasDups.duplicateIds.includes("dup"),
    "Utility: hasDuplicateIds detects duplicates"
  );

  // normalizeAST
  const rawDoc = {
    title: "  Padded  ",
    ownerId: "  user  ",
    blocks: [{ id: "  b1  ", type: "heading", data: { text: "Content preserved" } }],
  };
  const normalized = normalizeAST(rawDoc);
  assert(normalized.title === "Padded" && normalized.ownerId === "user" && normalized.blocks[0].id === "b1",
    "Utility: normalizeAST trims metadata, preserves content"
  );
}

// ─── Validation Regression Tests ────────────────────────────────────────────

function runValidationRegressionTests(): void {
  // Valid
  assertValid(
    validateDocumentAST({
      title: "Valid", ownerId: "u1", version: 1,
      blocks: [
        { id: "h1", type: "heading", data: { text: "Title" } },
        { id: "p1", type: "paragraph", data: { text: "Content" } },
        { id: "c1", type: "code", data: { language: "js", code: "x" } },
        { id: "l1", type: "list", data: { ordered: true, items: ["A"] } },
      ],
    }),
    "Validation regression: valid mixed document passes"
  );

  // Invalid cases
  assertInvalid(validateDocumentAST({ ownerId: "u1", blocks: [{ id: "b1", type: "paragraph", data: { text: "hi" } }] }), "Validation regression: missing title", "title");
  assertInvalid(validateDocumentAST({ title: "T", blocks: [{ id: "b1", type: "paragraph", data: { text: "hi" } }] }), "Validation regression: missing ownerId", "ownerId");
  assertInvalid(validateDocumentAST({ title: "T", ownerId: "u1" }), "Validation regression: missing blocks", "blocks");
  assertInvalid(validateDocumentAST({ title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "table", data: {} }] }), "Validation regression: invalid block type", "type");
  assertInvalid(validateDocumentAST({ title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "heading", data: {} }] }), "Validation regression: heading missing text", "data.text");
}

// ─── Summary ────────────────────────────────────────────────────────────────

function printSummary(hasMongoUri: boolean): void {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log(`║  Results: ${passed} passed, ${failed} failed                              `);
  console.log("╚══════════════════════════════════════════════════════════════╝");

  if (hasMongoUri) {
    mongoose.connection.close().then(() => {
      console.log("Database connection closed.");
    });
  }

  if (failed > 0) {
    console.error(`\n❌ ${failed} TEST(S) FAILED`);
    process.exit(1);
  }

  console.log("\n🎉 ALL WEEK 2 DAY 3 TESTS PASSED SUCCESSFULLY!");
}

runWeek2Day3Tests();
