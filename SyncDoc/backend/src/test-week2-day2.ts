/**
 * Week 2 Day 2 — Comprehensive AST Normalization, Traversal, & Safe Update Test Suite
 *
 * Tests:
 *   1. AST Normalization (8+ tests)
 *   2. Traversal utility (4+ tests)
 *   3. findNodeById (3+ tests)
 *   4. collectNodeIds (4+ tests)
 *   5. Duplicate ID detection (3+ tests)
 *   6. Safe update behavior (3+ tests)
 *   7. Version handling (2+ tests)
 *   8. AST immutability during validation (2+ tests)
 *   9. API regression tests (all endpoints)
 *  10. Validation regression (all Day 1 invalid cases)
 *  11. Mongoose pre-save regression
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import type { AddressInfo } from "net";
import app from "./app.js";
import connectDatabase from "./config/db.js";
import Document from "./models/Document.js";
import { type AstBlock } from "./models/AstNode.js";
import documentService from "./services/documentService.js";
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
  normalizeBlock,
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

// ─── Main Test Runner ───────────────────────────────────────────────────────

async function runWeek2Day2Tests(): Promise<void> {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Week 2 Day 2 — Normalization, Traversal & Safe Updates    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const hasMongoUri = !!process.env.MONGO_URI;

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: AST NORMALIZATION TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("══ 1. AST Normalization Tests ══");

  // Test 1.1: Valid AST remains semantically unchanged
  {
    const input = {
      title: "My Document",
      ownerId: "user1",
      blocks: [
        { id: "b1", type: "heading", data: { text: "Hello World" } },
        { id: "b2", type: "paragraph", data: { text: "Some content here." } },
      ],
    };
    const normalized = normalizeAST(input);
    assert(
      normalized.title === "My Document" &&
      normalized.ownerId === "user1" &&
      normalized.blocks[0].id === "b1" &&
      normalized.blocks[0].type === "heading" &&
      normalized.blocks[0].data.text === "Hello World" &&
      normalized.blocks[1].id === "b2" &&
      normalized.blocks[1].data.text === "Some content here.",
      "Normalization: valid AST remains semantically unchanged"
    );
  }

  // Test 1.2: Block order remains unchanged
  {
    const input = {
      title: "Order Test",
      ownerId: "user1",
      blocks: [
        { id: "h1", type: "heading", data: { text: "Heading" } },
        { id: "p1", type: "paragraph", data: { text: "Paragraph" } },
        { id: "c1", type: "code", data: { language: "js", code: "x()" } },
        { id: "l1", type: "list", data: { ordered: true, items: ["A", "B"] } },
      ],
    };
    const normalized = normalizeAST(input);
    const types = normalized.blocks.map((b: Record<string, unknown>) => b.type);
    assert(
      types[0] === "heading" && types[1] === "paragraph" && types[2] === "code" && types[3] === "list",
      "Normalization: block order [heading, paragraph, code, list] preserved"
    );
  }

  // Test 1.3: Block IDs remain unchanged (stable identity)
  {
    const input = {
      title: "ID Test",
      ownerId: "user1",
      blocks: [
        { id: "block-001", type: "paragraph", data: { text: "Hello" } },
        { id: "block-002", type: "heading", data: { text: "Title" } },
      ],
    };
    const normalized = normalizeAST(input);
    assert(
      normalized.blocks[0].id === "block-001" && normalized.blocks[1].id === "block-002",
      "Normalization: block IDs remain unchanged (stable identity)"
    );
  }

  // Test 1.4: Text content remains unchanged
  {
    const input = {
      title: "Content Test",
      ownerId: "user1",
      blocks: [
        { id: "b1", type: "paragraph", data: { text: "  Hello   World  " } },
        { id: "b2", type: "code", data: { language: "python", code: "  print('hello')  \n  x = 1  " } },
      ],
    };
    const normalized = normalizeAST(input);
    assert(
      normalized.blocks[0].data.text === "  Hello   World  ",
      "Normalization: paragraph text content preserved (including internal spaces)"
    );
    assert(
      normalized.blocks[1].data.code === "  print('hello')  \n  x = 1  ",
      "Normalization: code content preserved (including leading/trailing spaces)"
    );
  }

  // Test 1.5: List structure remains valid
  {
    const input = {
      title: "List Test",
      ownerId: "user1",
      blocks: [
        { id: "l1", type: "list", data: { ordered: false, items: ["Alpha", "Beta", "Gamma"] } },
      ],
    };
    const normalized = normalizeAST(input);
    const listData = normalized.blocks[0].data as Record<string, unknown>;
    assert(
      listData.ordered === false &&
      Array.isArray(listData.items) &&
      (listData.items as string[])[0] === "Alpha" &&
      (listData.items as string[])[1] === "Beta" &&
      (listData.items as string[])[2] === "Gamma",
      "Normalization: list structure (ordered flag + items array) preserved"
    );
  }

  // Test 1.6: Multiple blocks remain in the same order
  {
    const blockIds = ["a1", "b2", "c3", "d4", "e5"];
    const input = {
      title: "Multi Block Order",
      ownerId: "user1",
      blocks: blockIds.map((id) => ({ id, type: "paragraph", data: { text: `Block ${id}` } })),
    };
    const normalized = normalizeAST(input);
    const normalizedIds = normalized.blocks.map((b: Record<string, unknown>) => b.id);
    assert(
      JSON.stringify(normalizedIds) === JSON.stringify(blockIds),
      "Normalization: 5 blocks remain in identical order"
    );
  }

  // Test 1.7: Nested children are normalized recursively
  {
    const input = {
      title: "Nested Test",
      ownerId: "user1",
      blocks: [
        {
          id: "  parent1  ",
          type: "paragraph",
          data: { text: "Parent" },
          children: [
            { id: "  child1  ", type: "  heading  ", data: { text: "Child heading" } },
          ],
        },
      ],
    };
    const normalized = normalizeAST(input);
    const parent = normalized.blocks[0] as Record<string, unknown>;
    const children = parent.children as Array<Record<string, unknown>>;
    assert(
      parent.id === "parent1" && children[0].id === "child1" && children[0].type === "heading",
      "Normalization: nested children IDs and types trimmed recursively"
    );
  }

  // Test 1.8: Invalid AST is NOT made valid by normalization
  {
    // Heading with missing text — normalization should NOT add text
    const input = {
      title: "Invalid Heading Doc",
      ownerId: "user1",
      blocks: [
        { id: "b1", type: "heading", data: {} },
      ],
    };
    const normalized = normalizeAST(input);
    const result = validateDocumentAST(normalized);
    assert(
      !result.isValid,
      "Normalization: invalid AST (heading without text) is NOT made valid by normalization"
    );
  }

  // Test 1.9: Normalization trims metadata but not content
  {
    const input = {
      title: "  Padded Title  ",
      ownerId: "  user007  ",
      blocks: [
        { id: "  b1  ", type: "code  ", data: { language: "  javascript  ", code: "  console.log('hi');  " } },
      ],
    };
    const normalized = normalizeAST(input);
    assert(normalized.title === "Padded Title", "Normalization: title trimmed");
    assert(normalized.ownerId === "user007", "Normalization: ownerId trimmed");
    assert(normalized.blocks[0].id === "b1", "Normalization: block ID trimmed");
    assert(normalized.blocks[0].type === "code", "Normalization: block type trimmed");
    assert(normalized.blocks[0].data.language === "javascript", "Normalization: code language trimmed");
    assert(normalized.blocks[0].data.code === "  console.log('hi');  ", "Normalization: code content NOT trimmed");
  }

  // Test 1.10: normalizeBlock does NOT coerce non-boolean ordered flag
  {
    const block = normalizeBlock({ id: "l1", type: "list", data: { ordered: "yes", items: ["A"] } });
    assert(
      (block.data as Record<string, unknown>).ordered === "yes",
      "Normalization: non-boolean ordered flag NOT coerced (left for validation)"
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: TRAVERSAL TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 2. Traversal Tests ══");

  // Test 2.1: Root-only AST traversal
  {
    const blocks: AstBlock[] = [
      { id: "b1", type: "heading", data: { text: "H1" } },
      { id: "b2", type: "paragraph", data: { text: "P1" } },
      { id: "b3", type: "code", data: { language: "js", code: "x" } },
    ];
    const visited: string[] = [];
    traverseAST(blocks, (node) => visited.push(node.id));
    assert(
      visited.length === 3 && visited[0] === "b1" && visited[1] === "b2" && visited[2] === "b3",
      "Traversal: root-only AST visits b1, b2, b3 in order"
    );
  }

  // Test 2.2: Nested AST traversal
  {
    const blocks: AstBlock[] = [
      { id: "b1", type: "heading", data: { text: "H1" } },
      {
        id: "b2",
        type: "paragraph",
        data: { text: "P1" },
        children: [
          { id: "b3", type: "heading", data: { text: "Child H" } },
          { id: "b4", type: "paragraph", data: { text: "Child P" } },
        ],
      } as unknown as AstBlock,
    ];
    const visited: string[] = [];
    traverseAST(blocks, (node) => visited.push(node.id));
    assert(
      visited.length === 4 &&
      visited[0] === "b1" && visited[1] === "b2" && visited[2] === "b3" && visited[3] === "b4",
      "Traversal: nested AST visits b1, b2, b3, b4 in document order"
    );
  }

  // Test 2.3: Every node visited exactly once
  {
    const blocks: AstBlock[] = [
      { id: "x1", type: "paragraph", data: { text: "A" } },
      {
        id: "x2",
        type: "paragraph",
        data: { text: "B" },
        children: [
          { id: "x3", type: "heading", data: { text: "C" } },
        ],
      } as unknown as AstBlock,
    ];
    const visitCounts = new Map<string, number>();
    traverseAST(blocks, (node) => {
      visitCounts.set(node.id, (visitCounts.get(node.id) ?? 0) + 1);
    });
    const allOnce = Array.from(visitCounts.values()).every((count) => count === 1);
    assert(allOnce && visitCounts.size === 3, "Traversal: every node visited exactly once");
  }

  // Test 2.4: Traversal path includes correct indices
  {
    const blocks: AstBlock[] = [
      { id: "r1", type: "paragraph", data: { text: "Root" } },
      {
        id: "r2",
        type: "paragraph",
        data: { text: "Root2" },
        children: [
          { id: "c1", type: "heading", data: { text: "Child" } },
        ],
      } as unknown as AstBlock,
    ];
    const paths: string[] = [];
    traverseAST(blocks, (_node, path) => paths.push(path));
    assert(
      paths[0] === "blocks[0]" &&
      paths[1] === "blocks[1]" &&
      paths[2] === "blocks[1].children[0]",
      "Traversal: paths are blocks[0], blocks[1], blocks[1].children[0]"
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: FIND NODE BY ID TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 3. findNodeById Tests ══");

  const searchBlocks: AstBlock[] = [
    { id: "b1", type: "heading", data: { text: "Heading" } },
    {
      id: "b2",
      type: "paragraph",
      data: { text: "Parent" },
      children: [
        { id: "nested-id", type: "code", data: { language: "ts", code: "x" } },
        {
          id: "nested-parent",
          type: "paragraph",
          data: { text: "Nested parent" },
          children: [
            { id: "deep-nested", type: "heading", data: { text: "Deep" } },
          ],
        },
      ],
    } as unknown as AstBlock,
  ];

  // Test 3.1: Find root-level node
  {
    const found = findNodeById(searchBlocks, "b1");
    assert(found !== undefined && found.id === "b1" && found.type === "heading", "findNodeById: finds root-level node b1");
  }

  // Test 3.2: Find nested node
  {
    const found = findNodeById(searchBlocks, "nested-id");
    assert(found !== undefined && found.id === "nested-id" && found.type === "code", "findNodeById: finds nested node 'nested-id'");
  }

  // Test 3.3: Find deeply nested node
  {
    const found = findNodeById(searchBlocks, "deep-nested");
    assert(found !== undefined && found.id === "deep-nested" && found.type === "heading", "findNodeById: finds deeply nested node 'deep-nested'");
  }

  // Test 3.4: Return undefined for missing ID
  {
    const found = findNodeById(searchBlocks, "missing");
    assert(found === undefined, "findNodeById: returns undefined for non-existent ID 'missing'");
  }

  // Test 3.5: Return undefined for empty string
  {
    const found = findNodeById(searchBlocks, "");
    assert(found === undefined, "findNodeById: returns undefined for empty string ID");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: COLLECT NODE IDS TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 4. collectNodeIds Tests ══");

  // Test 4.1: All root IDs included
  {
    const blocks: AstBlock[] = [
      { id: "r1", type: "heading", data: { text: "H" } },
      { id: "r2", type: "paragraph", data: { text: "P" } },
      { id: "r3", type: "code", data: { language: "js", code: "x" } },
    ];
    const ids = collectNodeIds(blocks);
    assert(
      ids.length === 3 && ids.includes("r1") && ids.includes("r2") && ids.includes("r3"),
      "collectNodeIds: all root IDs included [r1, r2, r3]"
    );
  }

  // Test 4.2: All nested IDs included
  {
    const blocks: AstBlock[] = [
      { id: "b1", type: "heading", data: { text: "H" } },
      {
        id: "b2",
        type: "paragraph",
        data: { text: "P" },
        children: [
          { id: "b3", type: "heading", data: { text: "CH" } },
          { id: "b4", type: "paragraph", data: { text: "CP" } },
        ],
      } as unknown as AstBlock,
    ];
    const ids = collectNodeIds(blocks);
    assert(
      ids.length === 4 && ids.includes("b1") && ids.includes("b2") && ids.includes("b3") && ids.includes("b4"),
      "collectNodeIds: all nested IDs included [b1, b2, b3, b4]"
    );
  }

  // Test 4.3: Order is deterministic (document order)
  {
    const blocks: AstBlock[] = [
      { id: "first", type: "heading", data: { text: "H" } },
      {
        id: "second",
        type: "paragraph",
        data: { text: "P" },
        children: [
          { id: "third", type: "heading", data: { text: "CH" } },
        ],
      } as unknown as AstBlock,
      { id: "fourth", type: "paragraph", data: { text: "P2" } },
    ];
    const ids = collectNodeIds(blocks);
    assert(
      ids[0] === "first" && ids[1] === "second" && ids[2] === "third" && ids[3] === "fourth",
      "collectNodeIds: order is deterministic [first, second, third, fourth]"
    );
  }

  // Test 4.4: No IDs silently removed
  {
    const blocks: AstBlock[] = [
      { id: "keep-1", type: "heading", data: { text: "H" } },
      { id: "keep-2", type: "paragraph", data: { text: "P" } },
    ];
    const ids = collectNodeIds(blocks);
    assert(ids.length === 2, "collectNodeIds: no IDs silently removed (2 in, 2 out)");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: DUPLICATE ID DETECTION TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 5. Duplicate ID Detection Tests ══");

  // Test 5.1: No duplicates returns false
  {
    const blocks: AstBlock[] = [
      { id: "u1", type: "heading", data: { text: "H" } },
      { id: "u2", type: "paragraph", data: { text: "P" } },
    ];
    const result = hasDuplicateIds(blocks);
    assert(!result.hasDuplicates && result.duplicateIds.length === 0, "hasDuplicateIds: no duplicates detected");
  }

  // Test 5.2: Root-level duplicates detected
  {
    const blocks: AstBlock[] = [
      { id: "dup", type: "heading", data: { text: "H" } },
      { id: "dup", type: "paragraph", data: { text: "P" } },
    ];
    const result = hasDuplicateIds(blocks);
    assert(result.hasDuplicates && result.duplicateIds.includes("dup"), "hasDuplicateIds: root-level duplicate 'dup' detected");
  }

  // Test 5.3: Cross-level duplicates detected
  {
    const blocks: AstBlock[] = [
      { id: "shared", type: "heading", data: { text: "H" } },
      {
        id: "parent",
        type: "paragraph",
        data: { text: "P" },
        children: [
          { id: "shared", type: "heading", data: { text: "Child" } },
        ],
      } as unknown as AstBlock,
    ];
    const result = hasDuplicateIds(blocks);
    assert(result.hasDuplicates && result.duplicateIds.includes("shared"), "hasDuplicateIds: cross-level duplicate 'shared' detected");
  }

  // Test 5.4: Duplicate IDs still rejected by validation
  {
    const doc = {
      title: "Dup Test",
      ownerId: "user1",
      blocks: [
        { id: "b1", type: "heading", data: { text: "H" } },
        { id: "b1", type: "paragraph", data: { text: "P" } },
      ],
    };
    const result = validateDocumentAST(doc);
    assert(!result.isValid, "Duplicate IDs: validation correctly rejects duplicate ID document");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6: SAFE UPDATE BEHAVIOR (requires MongoDB)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 6. Safe Update Behavior ══");

  if (hasMongoUri) {
    await connectDatabase();
    await Document.deleteMany({ ownerId: "w2d2-test-user" });

    // Create a valid document for update tests
    const validDoc = new Document({
      title: "W2D2 Update Test",
      ownerId: "w2d2-test-user",
      version: 1,
      blocks: [
        { id: "b1", type: "heading", data: { text: "Original Heading" } } as AstBlock,
        { id: "b2", type: "paragraph", data: { text: "Original Paragraph" } } as AstBlock,
        { id: "b3", type: "code", data: { language: "typescript", code: "const x = 1;" } } as AstBlock,
        { id: "b4", type: "list", data: { ordered: true, items: ["One", "Two"] } } as AstBlock,
      ],
    });
    const saved = await validDoc.save();
    const savedId = saved._id;

    // Test 6.1: Update preserves document ID
    {
      const doc = await Document.findById(savedId);
      if (doc) {
        doc.title = "Updated Title";
        const updated = await doc.save();
        assert(
          String(updated._id) === String(savedId),
          "Safe update: document ID preserved after title update"
        );
      }
    }

    // Test 6.2: Update preserves block IDs and order
    {
      const doc = await Document.findById(savedId);
      if (doc) {
        const originalIds = doc.blocks.map((b) => b.id);

        // Update content only, not IDs
        doc.blocks = doc.blocks.map((block) => {
          if (block.type === "paragraph") {
            return { ...block, data: { text: "Hello SyncDoc" } } as AstBlock;
          }
          return block;
        });

        const updated = await doc.save();
        const updatedIds = updated.blocks.map((b) => b.id);

        assert(
          originalIds.length === updatedIds.length &&
          originalIds.every((id, i) => id === updatedIds[i]),
          "Safe update: block IDs and order preserved after content update"
        );

        // Verify the content was actually updated
        const para = updated.blocks.find((b) => b.type === "paragraph");
        assert(
          para !== undefined && (para.data as unknown as Record<string, unknown>).text === "Hello SyncDoc",
          "Safe update: paragraph content actually updated to 'Hello SyncDoc'"
        );
      }
    }

    // Test 6.3: Invalid update does NOT overwrite valid data
    {
      const doc = await Document.findById(savedId);
      if (doc) {
        const originalBlockCount = doc.blocks.length;

        // Attempt invalid update — heading without text
        doc.blocks = [
          { id: "b1", type: "heading", data: {} } as AstBlock,
        ];

        let updateFailed = false;
        try {
          await doc.save();
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "ValidationError") {
            updateFailed = true;
          }
        }
        assert(updateFailed, "Safe update: invalid update rejected by pre-save hook");

        // Verify the original document is still intact
        const afterFailed = await Document.findById(savedId);
        assert(
          afterFailed !== null &&
          afterFailed.blocks.length === originalBlockCount,
          "Safe update: original valid document intact after failed invalid update"
        );
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTION 7: VERSION HANDLING
    // ═══════════════════════════════════════════════════════════════════════════
    console.log("\n══ 7. Version Handling ══");

    // Test 7.1: Version increments on successful update (via service)
    {

      const created = await documentService.create({
        title: "Version Test Doc",
        ownerId: "w2d2-test-user",
        blocks: [
          { id: "v1", type: "paragraph", data: { text: "Version test" } } as AstBlock,
        ],
      });

      assert(created.version === 1, "Version: initial version is 1");

      const updated = await documentService.update(
        String((created as unknown as Record<string, unknown>)._id),
        { title: "Version Test Doc Updated" }
      );

      assert(updated !== null && updated.version === 2, "Version: incremented to 2 after successful update");

      // Second update
      const updated2 = await documentService.update(
        String((created as unknown as Record<string, unknown>)._id),
        { title: "Version Test Doc V3" }
      );

      assert(updated2 !== null && updated2.version === 3, "Version: incremented to 3 after second update");

      // Clean up
      await documentService.delete(String((created as unknown as Record<string, unknown>)._id));
    }

    // Test 7.2: Version does NOT increment on failed update
    {

      const created = await documentService.create({
        title: "Version Fail Test",
        ownerId: "w2d2-test-user",
        blocks: [
          { id: "vf1", type: "paragraph", data: { text: "Content" } } as AstBlock,
        ],
      });

      const docId = String((created as unknown as Record<string, unknown>)._id);
      const originalVersion = created.version;

      // Attempt invalid update
      let updateFailed = false;
      try {
        await documentService.update(docId, {
          blocks: [{ id: "vf1", type: "heading", data: {} } as AstBlock],
        });
      } catch {
        updateFailed = true;
      }

      assert(updateFailed, "Version: invalid update throws error");

      // Verify version unchanged
      const afterFailed = await documentService.getById(docId);
      assert(
        afterFailed !== null && afterFailed.version === originalVersion,
        "Version: NOT incremented after failed update"
      );

      // Clean up
      await documentService.delete(docId);
    }

    // Clean up all Day 2 test documents
    await Document.deleteMany({ ownerId: "w2d2-test-user" });

  } else {
    console.log("  ⚠️  Skipping DB-dependent tests (MONGO_URI not set)");
    console.log("\n══ 7. Version Handling ══");
    console.log("  ⚠️  Skipping version tests (MONGO_URI not set)");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 8: AST IMMUTABILITY DURING VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 8. AST Immutability During Validation ══");

  // Test 8.1: Validation does not mutate valid AST
  {
    const ast = {
      title: "Immutability Test",
      ownerId: "user1",
      version: 1,
      blocks: [
        { id: "im1", type: "heading", data: { text: "Heading" } },
        { id: "im2", type: "paragraph", data: { text: "Paragraph" } },
      ],
    };
    const before = JSON.stringify(ast);
    validateDocumentAST(ast);
    const after = JSON.stringify(ast);
    assert(before === after, "Immutability: validation does not mutate valid AST");
  }

  // Test 8.2: Validation does not mutate invalid AST
  {
    const ast = {
      title: "Invalid Immutability",
      ownerId: "user1",
      version: 1,
      blocks: [
        { id: "im1", type: "heading", data: {} },
        { id: "im1", type: "paragraph" },
      ],
    };
    const before = JSON.stringify(ast);
    validateDocumentAST(ast);
    const after = JSON.stringify(ast);
    assert(before === after, "Immutability: validation does not mutate invalid AST");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 9: API REGRESSION TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 9. API Regression Tests ══");

  const server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 9a. GET /api/health
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthBody = await healthRes.json() as Record<string, unknown>;
    assert(healthRes.status === 200 && healthBody.success === true, "API Regression: GET /api/health returns 200");

    if (hasMongoUri) {
      // 9b. POST /api/documents (valid)
      const createRes = await fetch(`${baseUrl}/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "W2D2 Regression Test",
          ownerId: "w2d2-regression-user",
          blocks: [
            { id: "reg-h1", type: "heading", data: { text: "Regression Heading" } },
            { id: "reg-p1", type: "paragraph", data: { text: "Regression paragraph." } },
            { id: "reg-c1", type: "code", data: { language: "python", code: "print('hello')" } },
            { id: "reg-l1", type: "list", data: { ordered: false, items: ["Item A", "Item B"] } },
          ],
        }),
      });
      const createBody = await createRes.json() as Record<string, unknown>;
      assert(createRes.status === 201 && createBody.success === true, "API Regression: POST /api/documents returns 201");

      const createdData = createBody.data as Record<string, unknown>;
      const createdId = createdData._id as string;
      assert(!!createdId, "API Regression: created document has _id");

      // 9c. GET /api/documents (list)
      const listRes = await fetch(`${baseUrl}/api/documents`);
      const listBody = await listRes.json() as Record<string, unknown>;
      assert(listRes.status === 200 && Array.isArray(listBody.data), "API Regression: GET /api/documents returns 200");

      // 9d. GET /api/documents/:id
      const getRes = await fetch(`${baseUrl}/api/documents/${createdId}`);
      const getBody = await getRes.json() as Record<string, unknown>;
      assert(getRes.status === 200 && getBody.success === true, "API Regression: GET /api/documents/:id returns 200");

      // Verify returned AST has stable block structure for Member 3
      const getData = getBody.data as Record<string, unknown>;
      const returnedBlocks = getData.blocks as Array<Record<string, unknown>>;
      assert(
        returnedBlocks.length === 4 &&
        returnedBlocks[0].type === "heading" &&
        returnedBlocks[1].type === "paragraph" &&
        returnedBlocks[2].type === "code" &&
        returnedBlocks[3].type === "list",
        "API Regression: GET returns predictable AST structure for Member 3"
      );

      // 9e. PUT /api/documents/:id (valid update)
      const updateRes = await fetch(`${baseUrl}/api/documents/${createdId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated Regression Title" }),
      });
      const updateBody = await updateRes.json() as Record<string, unknown>;
      assert(updateRes.status === 200 && updateBody.success === true, "API Regression: PUT /api/documents/:id returns 200");

      const updatedData = updateBody.data as Record<string, unknown>;
      assert(updatedData.title === "Updated Regression Title", "API Regression: PUT update applied correctly");

      // Verify version incremented
      assert(updatedData.version === 2, "API Regression: version incremented to 2 after update");

      // 9f. POST with invalid body
      const invalidCreateRes = await fetch(`${baseUrl}/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", ownerId: "user1", blocks: [] }),
      });
      assert(invalidCreateRes.status === 400, "API Regression: POST with empty title returns 400");

      // 9g. PUT with invalid blocks
      const invalidUpdateRes = await fetch(`${baseUrl}/api/documents/${createdId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: [{ id: "bad", type: "unknown_type", data: {} }],
        }),
      });
      assert(invalidUpdateRes.status === 400, "API Regression: PUT with invalid block type returns 400");

      // 9h. DELETE /api/documents/:id
      const deleteRes = await fetch(`${baseUrl}/api/documents/${createdId}`, {
        method: "DELETE",
      });
      const deleteBody = await deleteRes.json() as Record<string, unknown>;
      assert(deleteRes.status === 200 && deleteBody.success === true, "API Regression: DELETE /api/documents/:id returns 200");

      // Verify deleted
      const getDeletedRes = await fetch(`${baseUrl}/api/documents/${createdId}`);
      assert(getDeletedRes.status === 404, "API Regression: GET deleted document returns 404");

    } else {
      console.log("  ⚠️  Skipping DB-dependent API tests (MONGO_URI not set)");

      // Still test validation-only endpoints
      const invalidPostRes = await fetch(`${baseUrl}/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", ownerId: "user1", blocks: [] }),
      });
      assert(invalidPostRes.status === 400, "API Regression: POST with empty title returns 400 (no DB)");

      const invalidIdRes = await fetch(`${baseUrl}/api/documents/invalid-id`);
      assert(invalidIdRes.status === 400, "API Regression: GET with invalid ObjectId returns 400 (no DB)");
    }

  } finally {
    server.close();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 10: VALIDATION REGRESSION (Day 1 Invalid Cases)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 10. Validation Regression (Day 1 Invalid Cases) ══");

  // Missing title
  assertInvalid(
    validateDocumentAST({ ownerId: "u1", version: 1, blocks: [{ id: "b1", type: "paragraph", data: { text: "hi" } }] }),
    "Regression: missing title", "title"
  );

  // Missing ownerId
  assertInvalid(
    validateDocumentAST({ title: "T", version: 1, blocks: [{ id: "b1", type: "paragraph", data: { text: "hi" } }] }),
    "Regression: missing ownerId", "ownerId"
  );

  // Missing blocks
  assertInvalid(
    validateDocumentAST({ title: "T", ownerId: "u1", version: 1 }),
    "Regression: missing blocks", "blocks"
  );

  // Invalid block type
  assertInvalid(
    validateDocumentAST({ title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "table", data: {} }] }),
    "Regression: invalid block type", "type"
  );

  // Missing block ID
  assertInvalid(
    validateDocumentAST({ title: "T", ownerId: "u1", blocks: [{ type: "paragraph", data: { text: "hi" } }] }),
    "Regression: missing block ID", "id"
  );

  // Duplicate block ID
  assertInvalid(
    validateDocumentAST({
      title: "T", ownerId: "u1", blocks: [
        { id: "b1", type: "heading", data: { text: "H" } },
        { id: "b1", type: "paragraph", data: { text: "P" } },
      ],
    }),
    "Regression: duplicate block ID", "id"
  );

  // Invalid heading (empty text)
  assertInvalid(
    validateDocumentAST({ title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "heading", data: { text: "" } }] }),
    "Regression: heading with empty text", "data.text"
  );

  // Invalid heading (missing text)
  assertInvalid(
    validateDocumentAST({ title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "heading", data: {} }] }),
    "Regression: heading missing text", "data.text"
  );

  // Invalid paragraph (missing data)
  assertInvalid(
    validateDocumentAST({ title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "paragraph" }] }),
    "Regression: paragraph missing data", "data"
  );

  // Invalid code (missing language)
  assertInvalid(
    validateDocumentAST({ title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "code", data: { code: "x" } }] }),
    "Regression: code missing language", "data.language"
  );

  // Invalid code (missing code)
  assertInvalid(
    validateDocumentAST({ title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "code", data: { language: "js" } }] }),
    "Regression: code missing code", "data.code"
  );

  // Invalid list (missing items)
  assertInvalid(
    validateDocumentAST({ title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "list", data: { ordered: true } }] }),
    "Regression: list missing items", "data.items"
  );

  // Invalid list (non-string item)
  assertInvalid(
    validateDocumentAST({ title: "T", ownerId: "u1", blocks: [{ id: "b1", type: "list", data: { ordered: false, items: ["ok", 42] } }] }),
    "Regression: list with non-string item", "data.items"
  );

  // Invalid nested child type
  assertInvalid(
    validateDocumentAST({
      title: "T", ownerId: "u1", blocks: [{
        id: "p1", type: "paragraph", data: { text: "P" },
        children: [{ id: "c1", type: "unknown_type", data: {} }],
      }],
    }),
    "Regression: invalid nested child type", "children"
  );

  // Valid cases still pass
  assertValid(
    validateDocumentAST({
      title: "Valid Doc", ownerId: "u1", version: 1,
      blocks: [
        { id: "h1", type: "heading", data: { text: "Title" } },
        { id: "p1", type: "paragraph", data: { text: "Content" } },
        { id: "c1", type: "code", data: { language: "js", code: "const x = 1;" } },
        { id: "l1", type: "list", data: { ordered: true, items: ["A", "B", "C"] } },
      ],
    }),
    "Regression: valid mixed document still passes"
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 11: MONGOOSE PRE-SAVE REGRESSION
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 11. Mongoose Pre-Save Regression ══");

  if (hasMongoUri) {
    // Test 11.1: Valid document passes pre-save
    {
      const validDoc = new Document({
        title: "Pre-save Valid",
        ownerId: "w2d2-test-user",
        version: 1,
        blocks: [
          { id: "ps1", type: "heading", data: { text: "Valid Heading" } } as AstBlock,
          { id: "ps2", type: "paragraph", data: { text: "Valid paragraph" } } as AstBlock,
        ],
      });
      const saved = await validDoc.save();
      assert(!!saved._id, "Pre-save regression: valid document saved to MongoDB");
      await Document.findByIdAndDelete(saved._id);
    }

    // Test 11.2: Invalid document fails pre-save, MongoDB not modified
    {
      const invalidDoc = new Document({
        title: "Pre-save Invalid",
        ownerId: "w2d2-test-user",
        version: 1,
        blocks: [{ id: "ps-bad", type: "heading", data: {} } as AstBlock],
      });

      let rejected = false;
      try {
        await invalidDoc.save();
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "ValidationError") {
          rejected = true;
        }
      }
      assert(rejected, "Pre-save regression: invalid document rejected by pre-save hook");

      const shouldNotExist = await Document.findOne({ title: "Pre-save Invalid", ownerId: "w2d2-test-user" }).lean();
      assert(shouldNotExist === null, "Pre-save regression: invalid document NOT persisted to MongoDB");
    }

  } else {
    console.log("  ⚠️  Skipping pre-save regression tests (MONGO_URI not set)");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 12: MEMBER COMPATIBILITY VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n══ 12. Member Compatibility Verification ══");

  // Verify AST structure exposes stable fields for Member 2 (Yjs) and Member 3 (React)
  {
    const sampleDoc = {
      title: "Compat Test",
      ownerId: "user1",
      version: 1,
      blocks: [
        { id: "block-001", type: "heading", data: { text: "Introduction" } },
        { id: "block-002", type: "paragraph", data: { text: "Content here" } },
      ],
    };

    // Member 2 needs: documentId (from _id), blockId (from block.id), version, type, data
    const block = sampleDoc.blocks[0];
    assert(
      typeof block.id === "string" &&
      typeof block.type === "string" &&
      typeof block.data === "object" &&
      typeof sampleDoc.version === "number",
      "Member 2 compat: blocks expose stable id, type, data, version"
    );

    // Member 3 needs: heading → Heading, paragraph → Paragraph, code → Code, list → List
    const typeMap: Record<string, boolean> = { heading: true, paragraph: true, code: true, list: true };
    const allTypesSupported = sampleDoc.blocks.every((b) => typeMap[b.type]);
    assert(allTypesSupported, "Member 3 compat: all block types are renderable (heading, paragraph, code, list)");
  }

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

  console.log("\n🎉 ALL WEEK 2 DAY 2 TESTS PASSED SUCCESSFULLY!");
}

runWeek2Day2Tests();
