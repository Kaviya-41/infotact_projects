/**
 * Week 2 Day 4 — AST Change Engine & Validation Test Suite
 *
 * Verifies:
 *   1. AST change/delta types
 *   2. CREATE_BLOCK application & stable ID preservation
 *   3. UPDATE_BLOCK application & content update without position change
 *   4. DELETE_BLOCK application & single block removal with order preservation
 *   5. MOVE_BLOCK application & precise array reordering
 *   6. 12 Invalid change rejection cases (validateASTChange & applyASTChange)
 *   7. Immutability guarantee (original AST unaltered)
 *   8. Sequential change composition (CREATE → UPDATE → MOVE → DELETE)
 *   9. Version-aware change handling
 *  10. Regression safety for existing Week 1 & 2 AST validators
 */
import { validateDocumentAST, validateASTChange } from "./validators/astValidator.js";
import { applyASTChange } from "./utils/astUtils.js";
import type { IDocument } from "./models/Document.js";
import type { ParagraphBlockData } from "./models/AstNode.js";
import type { ASTChange } from "./types/astChangeTypes.js";

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

async function runTests() {
  console.log("==================================================");
  console.log("WEEK 2 DAY 4 — AST CHANGE ENGINE TEST SUITE");
  console.log("==================================================\n");

  const baseDoc: IDocument = {
    title: "Test Specification",
    ownerId: "user001",
    version: 1,
    blocks: [
      { id: "b1", type: "heading", data: { text: "Introduction" } },
      { id: "b2", type: "paragraph", data: { text: "Initial content" } },
      { id: "b3", type: "code", data: { language: "typescript", code: "console.log('hi');" } },
    ],
  };



  // ──────────────────────────────────────────────────────────────────────────
  // 1. CREATE_BLOCK TEST
  // ──────────────────────────────────────────────────────────────────────────
  console.log("1. Testing CREATE_BLOCK Application...");
  {
    const initialDoc: IDocument = {
      title: "Spec Doc",
      ownerId: "user001",
      version: 1,
      blocks: [{ id: "b1", type: "heading", data: { text: "Header" } }],
    };
    const testDoc = { _id: "doc-001", ...initialDoc };

    const createChange: ASTChange = {
      documentId: "doc-001",
      blockId: "b2",
      operation: "CREATE_BLOCK",
      version: 2,
      payload: {
        type: "paragraph",
        data: { text: "Second block paragraph" },
      },
    };

    const result = applyASTChange(testDoc, createChange);
    assert(result.success === true, "CREATE_BLOCK operation succeeded");

    if (result.success) {
      assert(result.ast.blocks.length === 2, "Resulting document has 2 blocks");
      assert(result.ast.blocks[0].id === "b1", "First block b1 remains unchanged");
      assert(result.ast.blocks[1].id === "b2", "Second block b2 exists with preserved ID 'b2'");
      assert(
        (result.ast.blocks[1].data as ParagraphBlockData).text === "Second block paragraph",
        "Second block content matches payload"
      );
      const valid = validateDocumentAST(result.ast);
      assert(valid.isValid, "Resulting document AST is structurally valid");
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. UPDATE_BLOCK TEST
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n2. Testing UPDATE_BLOCK Application...");
  {
    const initialDoc: IDocument = {
      title: "Spec Doc",
      ownerId: "user001",
      version: 1,
      blocks: [
        { id: "b1", type: "paragraph", data: { text: "Hello" } },
        { id: "b2", type: "paragraph", data: { text: "Unchanged" } },
      ],
    };
    const testDoc = { _id: "doc-001", ...initialDoc };

    const updateChange: ASTChange = {
      documentId: "doc-001",
      blockId: "b1",
      operation: "UPDATE_BLOCK",
      version: 2,
      payload: {
        text: "Hello SyncDoc",
      },
    };

    const result = applyASTChange(testDoc, updateChange);
    assert(result.success === true, "UPDATE_BLOCK operation succeeded");

    if (result.success) {
      assert(result.ast.blocks[0].id === "b1", "Block b1 ID is preserved");
      assert(
        (result.ast.blocks[0].data as ParagraphBlockData).text === "Hello SyncDoc",
        "Block b1 text updated to 'Hello SyncDoc'"
      );
      assert(result.ast.blocks[1].id === "b2", "Other block b2 is untouched");
      assert((result.ast.blocks[1].data as ParagraphBlockData).text === "Unchanged", "Other block b2 content intact");
      const valid = validateDocumentAST(result.ast);
      assert(valid.isValid, "Resulting AST is valid");
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. DELETE_BLOCK TEST
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n3. Testing DELETE_BLOCK Application...");
  {
    const initialDoc: IDocument = {
      title: "Spec Doc",
      ownerId: "user001",
      version: 1,
      blocks: [
        { id: "b1", type: "heading", data: { text: "First" } },
        { id: "b2", type: "paragraph", data: { text: "ToDelete" } },
        { id: "b3", type: "code", data: { language: "js", code: "x=1" } },
      ],
    };
    const testDoc = { _id: "doc-001", ...initialDoc };

    const deleteChange: ASTChange = {
      documentId: "doc-001",
      blockId: "b2",
      operation: "DELETE_BLOCK",
      version: 2,
    };

    const result = applyASTChange(testDoc, deleteChange);
    assert(result.success === true, "DELETE_BLOCK operation succeeded");

    if (result.success) {
      assert(result.ast.blocks.length === 2, "Exactly one block was removed");
      assert(result.ast.blocks[0].id === "b1", "b1 remains in first position");
      assert(result.ast.blocks[1].id === "b3", "b3 remains in second position");
      assert(
        !result.ast.blocks.some((b) => b.id === "b2"),
        "b2 is completely removed from document"
      );
      const valid = validateDocumentAST(result.ast);
      assert(valid.isValid, "Resulting AST is valid");
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. MOVE_BLOCK TEST
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n4. Testing MOVE_BLOCK Application...");
  {
    const initialDoc: IDocument = {
      title: "Spec Doc",
      ownerId: "user001",
      version: 1,
      blocks: [
        { id: "b1", type: "heading", data: { text: "Block 1" } },
        { id: "b2", type: "paragraph", data: { text: "Block 2" } },
        { id: "b3", type: "code", data: { language: "ts", code: "v=3" } },
      ],
    };
    const testDoc = { _id: "doc-001", ...initialDoc };

    const moveChange: ASTChange = {
      documentId: "doc-001",
      blockId: "b3",
      operation: "MOVE_BLOCK",
      version: 2,
      payload: {
        targetIndex: 0,
      },
    };

    const result = applyASTChange(testDoc, moveChange);
    assert(result.success === true, "MOVE_BLOCK operation succeeded");

    if (result.success) {
      assert(result.ast.blocks.length === 3, "Total block count remains 3");
      assert(result.ast.blocks[0].id === "b3", "b3 moved to index 0");
      assert(result.ast.blocks[1].id === "b1", "b1 shifted to index 1");
      assert(result.ast.blocks[2].id === "b2", "b2 shifted to index 2");
      const valid = validateDocumentAST(result.ast);
      assert(valid.isValid, "Resulting AST is valid after reordering");
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. TEST 12 INVALID CHANGE REJECTION CASES
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n5. Testing 12 Invalid Change Rejection Cases...");
  {
    const testDoc = { _id: "doc-001", ...baseDoc };

    // Case 1: Missing documentId
    const c1 = { blockId: "b1", operation: "DELETE_BLOCK" };
    const v1 = validateASTChange(c1, testDoc);
    assert(!v1.isValid && v1.errors.some((e) => e.path === "documentId"), "Reject 1: Missing documentId");

    // Case 2: Missing blockId
    const c2 = { documentId: "doc-001", operation: "DELETE_BLOCK" };
    const v2 = validateASTChange(c2, testDoc);
    assert(!v2.isValid && v2.errors.some((e) => e.path === "blockId"), "Reject 2: Missing blockId");

    // Case 3: Invalid operation
    const c3 = { documentId: "doc-001", blockId: "b1", operation: "UNSUPPORTED_OP" };
    const v3 = validateASTChange(c3, testDoc);
    assert(!v3.isValid && v3.errors.some((e) => e.path === "operation"), "Reject 3: Invalid operation");

    // Case 4: Missing payload for CREATE
    const c4 = { documentId: "doc-001", blockId: "b4", operation: "CREATE_BLOCK" };
    const v4 = validateASTChange(c4, testDoc);
    assert(!v4.isValid && v4.errors.some((e) => e.path === "payload"), "Reject 4: Missing payload for CREATE");

    // Case 5: Missing payload for UPDATE
    const c5 = { documentId: "doc-001", blockId: "b1", operation: "UPDATE_BLOCK" };
    const v5 = validateASTChange(c5, testDoc);
    assert(!v5.isValid && v5.errors.some((e) => e.path === "payload"), "Reject 5: Missing payload for UPDATE");

    // Case 6: Invalid block type for CREATE
    const c6 = {
      documentId: "doc-001",
      blockId: "b4",
      operation: "CREATE_BLOCK",
      payload: { type: "invalid_type", data: { text: "x" } },
    };
    const v6 = validateASTChange(c6, testDoc);
    assert(!v6.isValid && v6.errors.some((e) => e.path === "payload.type"), "Reject 6: Invalid block type for CREATE");

    // Case 7: Invalid targetIndex for MOVE (negative)
    const c7 = {
      documentId: "doc-001",
      blockId: "b1",
      operation: "MOVE_BLOCK",
      payload: { targetIndex: -1 },
    };
    const v7 = validateASTChange(c7, testDoc);
    assert(!v7.isValid && v7.errors.some((e) => e.path === "payload.targetIndex"), "Reject 7: Invalid targetIndex for MOVE");

    // Case 8: Malformed structure (non-object change)
    const v8 = validateASTChange("invalid_string", testDoc);
    assert(!v8.isValid && v8.errors.some((e) => e.path === "change"), "Reject 8: Malformed non-object change");

    // Case 9: Change for wrong document
    const c9 = { documentId: "wrong-doc-999", blockId: "b1", operation: "DELETE_BLOCK" };
    const v9 = validateASTChange(c9, testDoc);
    assert(!v9.isValid && v9.errors.some((e) => e.path === "documentId"), "Reject 9: Change for wrong documentId");

    // Case 10: Non-existent target block for UPDATE
    const c10 = { documentId: "doc-001", blockId: "nonexistent_block", operation: "UPDATE_BLOCK", payload: { text: "x" } };
    const v10 = validateASTChange(c10, testDoc);
    assert(!v10.isValid && v10.errors.some((e) => e.path === "blockId"), "Reject 10: Non-existent target block");

    // Case 11: Duplicate ID during CREATE
    const c11 = {
      documentId: "doc-001",
      blockId: "b1", // b1 already exists!
      operation: "CREATE_BLOCK",
      payload: { type: "paragraph", data: { text: "Duplicate ID" } },
    };
    const v11 = validateASTChange(c11, testDoc);
    assert(!v11.isValid && v11.errors.some((e) => e.path === "blockId"), "Reject 11: Duplicate block ID during CREATE");

    // Case 12: Invalid resulting AST (e.g. empty heading text inside payload)
    const c12: ASTChange = {
      documentId: "doc-001",
      blockId: "b4",
      operation: "CREATE_BLOCK",
      payload: { type: "heading", data: { text: "   " } }, // Empty whitespace heading text fails AST validation
    };
    const r12 = applyASTChange(testDoc, c12);
    assert(!r12.success, "Reject 12: Invalid resulting AST rejected");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. IMMUTABILITY TEST
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n6. Testing Immutability Guarantee...");
  {
    const originalAST: IDocument = {
      title: "Immutable Doc",
      ownerId: "user001",
      version: 1,
      blocks: [
        { id: "b1", type: "heading", data: { text: "Original Header" } },
        { id: "b2", type: "paragraph", data: { text: "Original Paragraph" } },
      ],
    };
    const originalCopy = JSON.parse(JSON.stringify(originalAST));
    const testDoc = { _id: "doc-001", ...originalAST };

    const change: ASTChange = {
      documentId: "doc-001",
      blockId: "b1",
      operation: "UPDATE_BLOCK",
      payload: { text: "Mutated Header" },
    };

    const result = applyASTChange(testDoc, change);

    assert(result.success === true, "Change applied successfully");
    assert(
      JSON.stringify(originalAST) === JSON.stringify(originalCopy),
      "Original AST object was NOT mutated by applyASTChange()"
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. SEQUENTIAL CHANGE COMPOSITION TEST
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n7. Testing Sequential Change Composition...");
  {
    let currentDoc: IDocument = {
      title: "Composition Doc",
      ownerId: "user001",
      version: 1,
      blocks: [{ id: "b1", type: "heading", data: { text: "Initial Block" } }],
    };
    let activeDoc = { _id: "doc-comp", ...currentDoc };

    // Change 1: CREATE_BLOCK b2
    const change1: ASTChange = {
      documentId: "doc-comp",
      blockId: "b2",
      operation: "CREATE_BLOCK",
      version: 2,
      payload: { type: "paragraph", data: { text: "Paragraph block 2" } },
    };
    const r1 = applyASTChange(activeDoc, change1);
    assert(r1.success, "Step 1: CREATE_BLOCK b2 succeeded");
    if (r1.success) activeDoc = { _id: "doc-comp", ...r1.ast };

    // Change 2: UPDATE_BLOCK b2
    const change2: ASTChange = {
      documentId: "doc-comp",
      blockId: "b2",
      operation: "UPDATE_BLOCK",
      version: 3,
      payload: { text: "Updated paragraph block 2" },
    };
    const r2 = applyASTChange(activeDoc, change2);
    assert(r2.success, "Step 2: UPDATE_BLOCK b2 succeeded");
    if (r2.success) activeDoc = { _id: "doc-comp", ...r2.ast };

    // Change 3: MOVE_BLOCK b2 → index 0
    const change3: ASTChange = {
      documentId: "doc-comp",
      blockId: "b2",
      operation: "MOVE_BLOCK",
      version: 4,
      payload: { targetIndex: 0 },
    };
    const r3 = applyASTChange(activeDoc, change3);
    assert(r3.success, "Step 3: MOVE_BLOCK b2 to index 0 succeeded");
    if (r3.success) activeDoc = { _id: "doc-comp", ...r3.ast };

    // Change 4: DELETE_BLOCK b1
    const change4: ASTChange = {
      documentId: "doc-comp",
      blockId: "b1",
      operation: "DELETE_BLOCK",
      version: 5,
    };
    const r4 = applyASTChange(activeDoc, change4);
    assert(r4.success, "Step 4: DELETE_BLOCK b1 succeeded");
    if (r4.success) activeDoc = { _id: "doc-comp", ...r4.ast };

    // Verification of Final AST State
    assert(activeDoc.blocks.length === 1, "Final document has exactly 1 block");
    assert(activeDoc.blocks[0].id === "b2", "Remaining block is b2");
    assert(
      (activeDoc.blocks[0].data as ParagraphBlockData).text === "Updated paragraph block 2",
      "Remaining block content matches accumulated updates"
    );
    const validFinal = validateDocumentAST(activeDoc);
    assert(validFinal.isValid, "Final composition AST is completely valid");
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8. STALE VERSION CHECK TEST
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n8. Testing Version Compatibility Check...");
  {
    const versionedDoc = {
      _id: "doc-v",
      title: "Versioned Doc",
      ownerId: "user001",
      version: 5,
      blocks: [{ id: "b1", type: "paragraph", data: { text: "v5" } }],
    };

    const staleChange: ASTChange = {
      documentId: "doc-v",
      blockId: "b1",
      operation: "UPDATE_BLOCK",
      version: 3, // Stale version 3 < current version 5!
      payload: { text: "Stale update" },
    };

    const vResult = validateASTChange(staleChange, versionedDoc);
    assert(!vResult.isValid, "Stale version change is rejected");
    assert(
      vResult.errors.some((e) => e.path === "version"),
      "Error path correctly flags 'version'"
    );
  }

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
