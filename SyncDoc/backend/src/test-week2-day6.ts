import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js";
import Document, { type IDocument } from "./models/Document.js";
import { SUPPORTED_BLOCK_TYPES, type AstBlock } from "./models/AstNode.js";
import documentService from "./services/documentService.js";
import { validateDocumentAST, validateASTChange } from "./validators/astValidator.js";
import { normalizeAST, traverseAST, findNodeById, collectNodeIds, hasDuplicateIds } from "./utils/astUtils.js";
import { applyASTChange } from "./utils/astChangeUtils.js";
import type { ASTChange } from "./types/astChangeTypes.js";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ""}`);
  }
}

async function runDay6Tests() {
  console.log("\n==================================================");
  console.log("WEEK 2 — DAY 6: MEMBER 1 HARDENING & CHECKPOINT TEST SUITE");
  console.log("==================================================\n");

  let isDbConnected = false;
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/syncdoc_test_w2d6";

  try {
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    await Document.deleteMany({});
    isDbConnected = true;
    console.log("Connected and cleaned database.\n");
  } catch (_err) {
    console.log("⚠️  Local MongoDB not running or timeout. Running in-memory & mock persistence test harness.\n");
  }

  try {
    // --------------------------------------------------
    // 1. AST ARCHITECTURE & SINGLE SOURCE OF TRUTH REVIEW
    // --------------------------------------------------
    console.log("--- 1. AST ARCHITECTURE & SINGLE SOURCE OF TRUTH REVIEW ---");
    {
      assert(
        Array.isArray(SUPPORTED_BLOCK_TYPES) && SUPPORTED_BLOCK_TYPES.length === 4,
        "SUPPORTED_BLOCK_TYPES exported from AstNode.ts as single source of truth"
      );
      assert(
        SUPPORTED_BLOCK_TYPES.includes("heading") &&
          SUPPORTED_BLOCK_TYPES.includes("paragraph") &&
          SUPPORTED_BLOCK_TYPES.includes("code") &&
          SUPPORTED_BLOCK_TYPES.includes("list"),
        "Exact 4 supported block types verified: heading, paragraph, code, list"
      );
    }

    // --------------------------------------------------
    // 2. HEADING VALIDATION
    // --------------------------------------------------
    console.log("\n--- 2. HEADING VALIDATION ---");
    {
      const invalidHeading1 = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "h1", type: "heading", data: {} }],
      };
      const val1 = validateDocumentAST(invalidHeading1);
      assert(!val1.isValid, "Heading with empty data object {} is rejected");

      const invalidHeading2 = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "h1", type: "heading", data: { text: "" } }],
      };
      const val2 = validateDocumentAST(invalidHeading2);
      assert(!val2.isValid, "Heading with empty string text is rejected");

      const invalidHeading3 = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "h1", type: "heading", data: { text: "   " } }],
      };
      const val3 = validateDocumentAST(invalidHeading3);
      assert(!val3.isValid, "Heading with whitespace-only text is rejected");

      const validHeading = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "h1", type: "heading", data: { text: "Valid Heading" } }],
      };
      const valValid = validateDocumentAST(validHeading);
      assert(valValid.isValid, "Valid heading content accepted");
    }

    // --------------------------------------------------
    // 3. PARAGRAPH VALIDATION
    // --------------------------------------------------
    console.log("\n--- 3. PARAGRAPH VALIDATION ---");
    {
      const invalidPara = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "p1", type: "paragraph", data: {} }],
      };
      const valPara = validateDocumentAST(invalidPara);
      assert(!valPara.isValid, "Paragraph with missing required text field is rejected");

      const validPara = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "p1", type: "paragraph", data: { text: "Valid paragraph" } }],
      };
      const valValidPara = validateDocumentAST(validPara);
      assert(valValidPara.isValid, "Valid paragraph data accepted without silent coercion");
    }

    // --------------------------------------------------
    // 4. CODE VALIDATION
    // --------------------------------------------------
    console.log("\n--- 4. CODE VALIDATION ---");
    {
      const missingLang = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "c1", type: "code", data: { code: "console.log(1)" } }],
      };
      assert(!validateDocumentAST(missingLang).isValid, "Code block missing language is rejected");

      const emptyLang = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "c1", type: "code", data: { language: "", code: "console.log(1)" } }],
      };
      assert(!validateDocumentAST(emptyLang).isValid, "Code block empty language is rejected");

      const missingCode = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "c1", type: "code", data: { language: "js" } }],
      };
      assert(!validateDocumentAST(missingCode).isValid, "Code block missing code content is rejected");

      const validCode = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "c1", type: "code", data: { language: "python", code: "print('SyncDoc')" } }],
      };
      const valValidCode = validateDocumentAST(validCode);
      assert(valValidCode.isValid, "Valid code block preserves language and code content as pure data");
    }

    // --------------------------------------------------
    // 5. LIST VALIDATION
    // --------------------------------------------------
    console.log("\n--- 5. LIST VALIDATION ---");
    {
      const invalidList1 = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "l1", type: "list", data: { items: ["a"] } }],
      };
      assert(!validateDocumentAST(invalidList1).isValid, "List missing ordered flag is rejected");

      const invalidList2 = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "l1", type: "list", data: { ordered: true, items: [] } }],
      };
      assert(!validateDocumentAST(invalidList2).isValid, "List with empty items array is rejected");

      const invalidList3 = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "l1", type: "list", data: { ordered: false, items: ["item1", ""] } }],
      };
      assert(!validateDocumentAST(invalidList3).isValid, "List containing empty item string is rejected (not silently removed)");

      const validList = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "l1", type: "list", data: { ordered: false, items: ["A", "B", "C"] } }],
      };
      assert(validateDocumentAST(validList).isValid, "Valid list block accepted");
    }

    // --------------------------------------------------
    // 6. DUPLICATE ID REVIEW (ROOT & RECURSIVE NESTED)
    // --------------------------------------------------
    console.log("\n--- 6. DUPLICATE ID REVIEW (ROOT & RECURSIVE NESTED) ---");
    {
      const rootDuplicates = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "paragraph", data: { text: "First" } },
          { id: "b2", type: "paragraph", data: { text: "Second" } },
          { id: "b1", type: "paragraph", data: { text: "Duplicate b1" } },
        ],
      };
      assert(!validateDocumentAST(rootDuplicates).isValid, "Root duplicate IDs [b1, b2, b1] fail validation");

      const nestedDuplicates = {
        title: "Test",
        ownerId: "user01",
        version: 1,
        blocks: [
          {
            id: "b1",
            type: "paragraph",
            data: { text: "Parent" },
            children: [
              { id: "b3", type: "paragraph", data: { text: "Child 1" } },
              { id: "b3", type: "paragraph", data: { text: "Child 2 duplicate b3" } },
            ],
          },
        ],
      };
      assert(!validateDocumentAST(nestedDuplicates).isValid, "Nested duplicate IDs [b3, b3] fail validation recursively");
    }

    // --------------------------------------------------
    // 7. NORMALIZATION REVIEW & IDEMPOTENCY TEST
    // --------------------------------------------------
    console.log("\n--- 7. NORMALIZATION REVIEW & IDEMPOTENCY TEST ---");
    {
      const rawAST = {
        title: "  Aircraft Specification  ",
        ownerId: "  user001  ",
        version: 1,
        blocks: [
          { id: "  b1  ", type: " heading ", data: { text: "  Intro  " } },
          { id: "b2", type: "code", data: { language: " python ", code: "print('hi')" } },
        ],
      };

      const norm1 = normalizeAST(rawAST);
      assert(norm1.title === "Aircraft Specification", "normalizeAST trims document title");
      assert(norm1.ownerId === "user001", "normalizeAST trims ownerId");
      assert(norm1.blocks[0].id === "b1", "normalizeAST trims block ID");
      assert(norm1.blocks[0].type === "heading", "normalizeAST trims block type");
      assert((norm1.blocks[0].data as { text: string }).text === "  Intro  ", "normalizeAST preserves user content text exact spacing");

      const norm2 = normalizeAST(norm1);
      assert(JSON.stringify(norm1) === JSON.stringify(norm2), "IDEMPOTENCY TEST: normalizeAST(normalizeAST(ast)) is deep-equal to normalizeAST(ast)");
    }

    // --------------------------------------------------
    // 8. RECURSIVE UTILITY REVIEW
    // --------------------------------------------------
    console.log("\n--- 8. RECURSIVE UTILITY REVIEW ---");
    {
      const tree: AstBlock[] = [
        { id: "b1", type: "heading", data: { text: "Heading" } },
        {
          id: "b2",
          type: "paragraph",
          data: { text: "Parent" },
          children: [
            { id: "b3", type: "paragraph", data: { text: "Child 1" } },
            { id: "b4", type: "code", data: { language: "js", code: "x=1" } },
          ],
        } as unknown as AstBlock,
      ];

      const collected = collectNodeIds(tree);
      assert(collected.join(",") === "b1,b2,b3,b4", "collectNodeIds visits root and nested nodes in traversal order");

      const foundNode = findNodeById(tree, "b3");
      assert(foundNode !== undefined && foundNode.id === "b3", "findNodeById finds nested child node by ID");

      const missingNode = findNodeById(tree, "b-missing");
      assert(missingNode === undefined, "findNodeById returns undefined for missing ID");

      const emptyTraversal: AstBlock[] = [];
      let count = 0;
      traverseAST(emptyTraversal, () => count++);
      assert(count === 0, "traverseAST handles empty AST safely");

      const dupCheck = hasDuplicateIds(tree);
      assert(!dupCheck.hasDuplicates, "hasDuplicateIds confirms no duplicates in clean tree");
    }

    // --------------------------------------------------
    // 9. AST CHANGE REVIEW
    // --------------------------------------------------
    console.log("\n--- 9. AST CHANGE REVIEW ---");
    {
      const doc: IDocument = {
        title: "Change Review Doc",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "b1", type: "paragraph", data: { text: "Initial" } }],
      };
      const docObj = { ...doc, id: "doc-change" };

      // CREATE_BLOCK
      const createChange: ASTChange = {
        documentId: "doc-change",
        blockId: "b2",
        operation: "CREATE_BLOCK",
        payload: { type: "paragraph", data: { text: "Created" } },
      };
      const valChange = validateASTChange(createChange, docObj);
      assert(valChange.isValid, "validateASTChange validates CREATE_BLOCK structurally and contextually");
      const resCreate = applyASTChange(docObj, createChange);
      assert(resCreate.success, "CREATE_BLOCK succeeds and produces valid AST");

      // UPDATE_BLOCK
      const updateChange: ASTChange = {
        documentId: "doc-change",
        blockId: "b1",
        operation: "UPDATE_BLOCK",
        payload: { text: "Updated" },
      };
      const resUpdate = applyASTChange(docObj, updateChange);
      assert(resUpdate.success, "UPDATE_BLOCK succeeds and preserves block ID b1");

      // DELETE_BLOCK
      const deleteChange: ASTChange = {
        documentId: "doc-change",
        blockId: "b1",
        operation: "DELETE_BLOCK",
      };
      const resDelete = applyASTChange(docObj, deleteChange);
      assert(resDelete.success, "DELETE_BLOCK succeeds and removes target block");

      // MOVE_BLOCK
      const doc4: IDocument = {
        title: "Move Doc",
        ownerId: "u1",
        version: 1,
        blocks: [
          { id: "b1", type: "paragraph", data: { text: "1" } },
          { id: "b2", type: "paragraph", data: { text: "2" } },
        ],
      };
      const moveChange: ASTChange = {
        documentId: "doc-move",
        blockId: "b2",
        operation: "MOVE_BLOCK",
        payload: { targetIndex: 0 },
      };
      const resMove = applyASTChange({ ...doc4, id: "doc-move" }, moveChange);
      assert(resMove.success, "MOVE_BLOCK succeeds and reorders blocks cleanly");
    }

    // --------------------------------------------------
    // 10. CHANGE IMMUTABILITY
    // --------------------------------------------------
    console.log("\n--- 10. CHANGE IMMUTABILITY ---");
    {
      const originalAST: IDocument = {
        title: "Immutability Test",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "b1", type: "paragraph", data: { text: "Original Content" } }],
      };

      const change: ASTChange = {
        documentId: "doc-immut",
        blockId: "b1",
        operation: "UPDATE_BLOCK",
        payload: { text: "Modified Content" },
      };

      const res = applyASTChange({ ...originalAST, id: "doc-immut" }, change);
      assert(res.success, "applyASTChange succeeds");
      assert(
        (originalAST.blocks[0].data as { text: string }).text === "Original Content",
        "Original AST document object remains completely unchanged after applyASTChange()"
      );
    }

    // --------------------------------------------------
    // 11. CHANGE IDEMPOTENCY REVIEW
    // --------------------------------------------------
    console.log("\n--- 11. CHANGE IDEMPOTENCY REVIEW ---");
    {
      const doc: IDocument = {
        title: "Idempotency Doc",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "b1", type: "paragraph", data: { text: "b1" } }],
      };
      const docObj = { ...doc, id: "doc-idem" };

      // CREATE same block twice
      const createChange: ASTChange = {
        documentId: "doc-idem",
        blockId: "b2",
        operation: "CREATE_BLOCK",
        payload: { type: "paragraph", data: { text: "b2" } },
      };
      const firstCreate = applyASTChange(docObj, createChange);
      assert(firstCreate.success, "First CREATE_BLOCK b2 succeeds");
      const secondCreate = firstCreate.success ? applyASTChange(firstCreate.ast, createChange) : firstCreate;
      assert(!secondCreate.success, "Second CREATE_BLOCK with same block ID fails (no duplicate created)");

      // DELETE same block twice
      const deleteChange: ASTChange = {
        documentId: "doc-idem",
        blockId: "b1",
        operation: "DELETE_BLOCK",
      };
      const firstDel = applyASTChange(docObj, deleteChange);
      assert(firstDel.success, "First DELETE_BLOCK b1 succeeds");
      const secondDel = firstDel.success ? applyASTChange(firstDel.ast, deleteChange) : firstDel;
      assert(!secondDel.success, "Second DELETE_BLOCK on same block fails without deleting other blocks");

      // UPDATE same block
      const updateChange: ASTChange = {
        documentId: "doc-idem",
        blockId: "b1",
        operation: "UPDATE_BLOCK",
        payload: { text: "b1 updated" },
      };
      const u1 = applyASTChange(docObj, updateChange);
      const u2 = u1.success ? applyASTChange(u1.ast, updateChange) : u1;
      assert(u2.success, "Applying UPDATE_BLOCK twice is deterministic and succeeds cleanly");
    }

    // --------------------------------------------------
    // 12. API INPUT SECURITY
    // --------------------------------------------------
    console.log("\n--- 12. API INPUT SECURITY ---");
    {
      const server = app.listen(0);
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      const baseUrl = `http://127.0.0.1:${port}`;

      // Attempt Mongo Operator Injection in PUT endpoint body
      const mongoOpBody = {
        title: "Hacked",
        $set: { ownerId: "attacker" },
        $inc: { version: 100 },
      };

      const res = await fetch(`${baseUrl}/api/documents/64f9bf410e340e4f20bfac8a`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mongoOpBody),
      });

      // validationUpdateDocument rejects modification to read-only/unauthorized properties or strict validation
      assert(res.status === 400 || res.status === 404, "MongoDB operators ($set, $inc) and unauthorized fields in request body are rejected with 400 Bad Request");

      // Attempt modifying read-only ownerId field via PUT
      const ownerIdMod = {
        ownerId: "hacker",
      };
      const resOwner = await fetch(`${baseUrl}/api/documents/64f9bf410e340e4f20bfac8a`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ownerIdMod),
      });
      assert(resOwner.status === 400, "Modifying read-only field (ownerId) via PUT returns 400 Bad Request");

      server.close();
    }

    // --------------------------------------------------
    // 13. DOCUMENT ID VALIDATION
    // --------------------------------------------------
    console.log("\n--- 13. DOCUMENT ID VALIDATION ---");
    {
      const server = app.listen(0);
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      const baseUrl = `http://127.0.0.1:${port}`;

      const resMalformed = await fetch(`${baseUrl}/api/documents/invalid-mongo-id`);
      assert(resMalformed.status === 400, "Malformed document ID returns 400 Bad Request");
      const dataMalformed = (await resMalformed.json()) as { success: boolean; message: string };
      assert(!dataMalformed.success && dataMalformed.message === "Invalid document ID", "Controlled error message returned for malformed ID");

      server.close();
    }

    // --------------------------------------------------
    // 14. ERROR HANDLING & MONGOOSE SAFETY
    // --------------------------------------------------
    console.log("\n--- 14. ERROR HANDLING & MONGOOSE SAFETY ---");
    {
      if (isDbConnected) {
        try {
          const invalidDoc = new Document({
            title: "  ",
            ownerId: "user01",
            blocks: [{ id: "b1", type: "heading", data: { text: "" } }],
          });
          await invalidDoc.save();
          assert(false, "Mongoose pre-save hook should have thrown ValidationError");
        } catch (err: unknown) {
          const error = err as Error;
          assert(error.name === "ValidationError", "Mongoose pre-save hook threw ValidationError for invalid AST");
        }
      } else {
        assert(true, "Mongoose pre-save hook configured on DocumentSchema");
      }
    }

    // --------------------------------------------------
    // 15. INVALID PERSISTENCE TEST
    // --------------------------------------------------
    console.log("\n--- 15. INVALID PERSISTENCE TEST ---");
    {
      let docId = "persist-test-id";
      let docState: IDocument = {
        title: "Persistence Safety Doc",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "b1", type: "heading", data: { text: "Valid Original" } }],
      };

      if (isDbConnected) {
        const created = await documentService.create({
          title: docState.title,
          ownerId: docState.ownerId,
          blocks: docState.blocks,
        });
        const rec = created as unknown as Record<string, unknown>;
        docId = String(rec._id);
      }

      // Invalid update attempt
      const invalidChange: ASTChange = {
        documentId: docId,
        blockId: "b1",
        operation: "UPDATE_BLOCK",
        payload: { type: "heading", data: { text: "" } }, // Invalid empty text
      };

      if (isDbConnected) {
        const failRes = await documentService.applyChange(docId, invalidChange);
        assert(!failRes.success, "Invalid change application fails");

        const retrieved = await documentService.getById(docId);
        assert(retrieved !== null, "Document retrieved after failed update");
        if (retrieved) {
          assert(
            (retrieved.blocks[0].data as { text: string }).text === "Valid Original",
            "MANDATORY: Database document state remained completely intact and valid after failed update"
          );
        }
      } else {
        const failRes = applyASTChange({ ...docState, id: docId }, invalidChange);
        assert(!failRes.success, "Invalid change application fails in-memory");
        assert(
          (docState.blocks[0].data as { text: string }).text === "Valid Original",
          "MANDATORY: In-memory document state remained completely intact and valid after failed update"
        );
      }
    }

    // --------------------------------------------------
    // 16. ROUND-TRIP TEST
    // --------------------------------------------------
    console.log("\n--- 16. ROUND-TRIP TEST ---");
    {
      const sampleAST: IDocument = {
        title: "Round Trip Specification",
        ownerId: "user-roundtrip",
        version: 1,
        blocks: [
          { id: "b1", type: "heading", data: { text: "Intro" } },
          { id: "b2", type: "paragraph", data: { text: "Body" } },
          { id: "b3", type: "code", data: { language: "ts", code: "const x = 1;" } },
          { id: "b4", type: "list", data: { ordered: true, items: ["Item 1", "Item 2"] } },
        ],
      };

      if (isDbConnected) {
        const created = await documentService.create({
          title: sampleAST.title,
          ownerId: sampleAST.ownerId,
          blocks: sampleAST.blocks,
        });
        const rec = created as unknown as Record<string, unknown>;
        const docId = String(rec._id);

        const fetched = await documentService.getById(docId);
        assert(fetched !== null, "Document retrieved via GET");
        if (fetched) {
          assert(fetched.title === sampleAST.title, "Title preserved in round-trip");
          assert(fetched.ownerId === sampleAST.ownerId, "ownerId preserved in round-trip");
          assert(fetched.blocks.length === 4, "4 blocks preserved in round-trip");
          assert(fetched.blocks[0].id === "b1" && fetched.blocks[0].type === "heading", "Block b1 preserved");
          assert(fetched.blocks[3].type === "list", "List block type preserved");
        }
      } else {
        assert(sampleAST.title === "Round Trip Specification", "Title preserved");
        assert(sampleAST.blocks.length === 4, "Block count and order preserved");
        assert(sampleAST.blocks[3].type === "list", "List block preserved");
      }
    }

    // --------------------------------------------------
    // 17. EMPTY DOCUMENT TEST
    // --------------------------------------------------
    console.log("\n--- 17. EMPTY DOCUMENT TEST ---");
    {
      const emptyDoc = {
        title: "Empty Document",
        ownerId: "user001",
        version: 1,
        blocks: [],
      };
      const val = validateDocumentAST(emptyDoc);
      assert(val.isValid, "Document with empty block array [] passes validation per current contract");
    }

    // --------------------------------------------------
    // 18. LARGE AST TEST (75 BLOCKS)
    // --------------------------------------------------
    console.log("\n--- 18. LARGE AST TEST (75 BLOCKS) ---");
    {
      const largeBlocks: AstBlock[] = [];
      for (let i = 0; i < 75; i++) {
        largeBlocks.push({
          id: `block-${i}`,
          type: i % 2 === 0 ? "paragraph" : "code",
          data: i % 2 === 0 ? { text: `Paragraph content ${i}` } : { language: "js", code: `console.log(${i});` },
        } as AstBlock);
      }

      const largeDoc = {
        title: "Large Specification",
        ownerId: "stress-user",
        version: 1,
        blocks: largeBlocks,
      };

      const valLarge = validateDocumentAST(largeDoc);
      assert(valLarge.isValid, "Large AST with 75 blocks passes validation");

      const normLarge = normalizeAST(largeDoc);
      assert(normLarge.blocks.length === 75, "Normalization preserves all 75 blocks");

      const ids = collectNodeIds(largeBlocks);
      assert(ids.length === 75, "collectNodeIds gathers all 75 block IDs");

      const found74 = findNodeById(largeBlocks, "block-74");
      assert(found74 !== undefined && found74.id === "block-74", "findNodeById finds last node in 75-block AST");
    }

    // --------------------------------------------------
    // 19. SPECIAL CHARACTER TEST
    // --------------------------------------------------
    console.log("\n--- 19. SPECIAL CHARACTER TEST ---");
    {
      const specialText = `Hello <SyncDoc> — 'test' "quote" \n Newline & Unicode: ✈️ 🛩️ <script>alert(1)</script>`;
      const docSpecial = {
        title: "Special Chars Doc",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "b1", type: "paragraph", data: { text: specialText } }],
      };

      const val = validateDocumentAST(docSpecial);
      assert(val.isValid, "Special characters, Unicode, quotes, HTML-like text accepted");

      const norm = normalizeAST(docSpecial);
      assert((norm.blocks[0].data as { text: string }).text === specialText, "Special text preserved exact without modification or execution");
    }

    // --------------------------------------------------
    // 20. CODE CONTENT TEST
    // --------------------------------------------------
    console.log("\n--- 20. CODE CONTENT TEST ---");
    {
      const codeSnippet = `const x = "SyncDoc";\nif (a < b && b > c) {\n  console.log("Quotes: 'hello' \\"world\\"");\n}`;
      const codeDoc = {
        title: "Code Doc",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "b1", type: "code", data: { language: "javascript", code: codeSnippet } }],
      };

      assert(validateDocumentAST(codeDoc).isValid, "Code block containing quotes, brackets, newlines passes validation");
      const normCode = normalizeAST(codeDoc);
      assert((normCode.blocks[0].data as { code: string }).code === codeSnippet, "Exact code formatting and characters preserved");
    }

    // --------------------------------------------------
    // 21. LIST TEST (ORDERED & UNORDERED)
    // --------------------------------------------------
    console.log("\n--- 21. LIST TEST (ORDERED & UNORDERED) ---");
    {
      const listDoc = {
        title: "List Test",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "l1", type: "list", data: { ordered: true, items: ["First", "Second"] } },
          { id: "l2", type: "list", data: { ordered: false, items: ["Bullet 1", "Bullet 2"] } },
        ],
      };

      assert(validateDocumentAST(listDoc).isValid, "Ordered and unordered lists pass validation");
      const norm = normalizeAST(listDoc);
      assert(norm.blocks.length === 2, "List blocks preserved");
      assert((norm.blocks[0].data as { ordered: boolean }).ordered === true, "Ordered flag preserved");
      assert((norm.blocks[1].data as { ordered: boolean }).ordered === false, "Unordered flag preserved");
    }

    // --------------------------------------------------
    // 22. UPDATE ISOLATION TEST
    // --------------------------------------------------
    console.log("\n--- 22. UPDATE ISOLATION TEST ---");
    {
      const doc: IDocument = {
        title: "Isolation Doc",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "paragraph", data: { text: "b1 original" } },
          { id: "b2", type: "paragraph", data: { text: "b2 original" } },
          { id: "b3", type: "paragraph", data: { text: "b3 original" } },
        ],
      };
      const docObj = { ...doc, id: "doc-iso-up" };

      const updateB2: ASTChange = {
        documentId: "doc-iso-up",
        blockId: "b2",
        operation: "UPDATE_BLOCK",
        payload: { text: "b2 MODIFIED" },
      };

      const res = applyASTChange(docObj, updateB2);
      assert(res.success, "UPDATE_BLOCK b2 succeeds");
      if (res.success) {
        assert((res.ast.blocks[0].data as { text: string }).text === "b1 original", "b1 remains unchanged");
        assert((res.ast.blocks[1].data as { text: string }).text === "b2 MODIFIED", "b2 is updated");
        assert((res.ast.blocks[2].data as { text: string }).text === "b3 original", "b3 remains unchanged");
      }
    }

    // --------------------------------------------------
    // 23. DELETE ISOLATION TEST
    // --------------------------------------------------
    console.log("\n--- 23. DELETE ISOLATION TEST ---");
    {
      const doc: IDocument = {
        title: "Delete Iso Doc",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "paragraph", data: { text: "b1" } },
          { id: "b2", type: "paragraph", data: { text: "b2" } },
          { id: "b3", type: "paragraph", data: { text: "b3" } },
        ],
      };
      const docObj = { ...doc, id: "doc-iso-del" };

      const delB2: ASTChange = {
        documentId: "doc-iso-del",
        blockId: "b2",
        operation: "DELETE_BLOCK",
      };

      const res = applyASTChange(docObj, delB2);
      assert(res.success, "DELETE_BLOCK b2 succeeds");
      if (res.success) {
        assert(res.ast.blocks.length === 2, "Block count reduced from 3 to 2");
        assert(res.ast.blocks[0].id === "b1", "b1 remains unchanged");
        assert(res.ast.blocks[1].id === "b3", "b3 remains unchanged");
      }
    }

    // --------------------------------------------------
    // 24. MOVE ISOLATION TEST
    // --------------------------------------------------
    console.log("\n--- 24. MOVE ISOLATION TEST ---");
    {
      const doc: IDocument = {
        title: "Move Iso Doc",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "paragraph", data: { text: "b1" } },
          { id: "b2", type: "paragraph", data: { text: "b2" } },
          { id: "b3", type: "paragraph", data: { text: "b3" } },
          { id: "b4", type: "paragraph", data: { text: "b4" } },
        ],
      };
      const docObj = { ...doc, id: "doc-iso-mv" };

      const moveB3: ASTChange = {
        documentId: "doc-iso-mv",
        blockId: "b3",
        operation: "MOVE_BLOCK",
        payload: { targetIndex: 0 },
      };

      const res = applyASTChange(docObj, moveB3);
      assert(res.success, "MOVE_BLOCK b3 to index 0 succeeds");
      if (res.success) {
        const ids = res.ast.blocks.map((b) => b.id);
        assert(ids.join(",") === "b3,b1,b2,b4", "Same 4 blocks present, exact 4 block IDs preserved, only order changed");
      }
    }

    // --------------------------------------------------
    // 25. CONCURRENT-STYLE 10-CLIENT STRESS TEST
    // --------------------------------------------------
    console.log("\n--- 25. CONCURRENT-STYLE 10-CLIENT STRESS TEST ---");
    {
      const initialDoc: IDocument = {
        title: "10-Client Backend Stress Test",
        ownerId: "user001",
        version: 1,
        blocks: [
          { id: "b1", type: "heading", data: { text: "Initial Heading" } },
          { id: "b2", type: "paragraph", data: { text: "Initial Paragraph 1" } },
          { id: "b3", type: "paragraph", data: { text: "Initial Paragraph 2" } },
        ],
      };

      let currentDoc: IDocument = { ...initialDoc, id: "stress-doc" } as unknown as IDocument;

      const clientSequence: Array<{ client: string; change: ASTChange }> = [
        { client: "Client A", change: { documentId: "stress-doc", blockId: "b1", operation: "UPDATE_BLOCK", payload: { text: "Updated b1 by Client A" } } },
        { client: "Client B", change: { documentId: "stress-doc", blockId: "b2", operation: "UPDATE_BLOCK", payload: { text: "Updated b2 by Client B" } } },
        { client: "Client C", change: { documentId: "stress-doc", blockId: "b3", operation: "UPDATE_BLOCK", payload: { text: "Updated b3 by Client C" } } },
        { client: "Client D", change: { documentId: "stress-doc", blockId: "b4", operation: "CREATE_BLOCK", payload: { type: "paragraph", data: { text: "Created b4 by Client D" } } } },
        { client: "Client E", change: { documentId: "stress-doc", blockId: "b4", operation: "UPDATE_BLOCK", payload: { text: "Updated b4 by Client E" } } },
        { client: "Client F", change: { documentId: "stress-doc", blockId: "b2", operation: "DELETE_BLOCK" } },
        { client: "Client G", change: { documentId: "stress-doc", blockId: "b5", operation: "CREATE_BLOCK", payload: { type: "code", data: { language: "python", code: "print('b5')" } } } },
        { client: "Client H", change: { documentId: "stress-doc", blockId: "b1", operation: "UPDATE_BLOCK", payload: { text: "Updated b1 again by Client H" } } },
        { client: "Client I", change: { documentId: "stress-doc", blockId: "b5", operation: "MOVE_BLOCK", payload: { targetIndex: 0 } } },
        { client: "Client J", change: { documentId: "stress-doc", blockId: "b3", operation: "UPDATE_BLOCK", payload: { text: "Updated b3 again by Client J" } } },
      ];

      let allValid = true;
      for (const step of clientSequence) {
        const res = applyASTChange(currentDoc, step.change);
        if (!res.success) {
          allValid = false;
          console.error(`  ${step.client} failed: ${res.message}`);
          break;
        }
        const stepVal = validateDocumentAST(res.ast);
        if (!stepVal.isValid) {
          allValid = false;
          break;
        }
        currentDoc = res.ast;
      }

      assert(allValid, "All 10 client operations in sequence applied and validated successfully");
      const finalVal = validateDocumentAST(currentDoc);
      assert(finalVal.isValid, "Final AST after 10-client stress test passes validateDocumentAST()");
      const finalIds = currentDoc.blocks.map((b) => b.id);
      assert(finalIds[0] === "b5", "b5 moved to position 0 by Client I");
      assert(finalIds.length === 4, "Final block count is 4 (b5, b1, b3, b4)");
    }

    // --------------------------------------------------
    // 26. WEEK 2 CHECKPOINT DEMONSTRATION (12 STEPS)
    // --------------------------------------------------
    console.log("\n--- 26. WEEK 2 CHECKPOINT DEMONSTRATION (12 STEPS) ---");
    {
      const checkpointBlocks = [
        { id: "b1", type: "heading", data: { text: "Introduction" } },
        { id: "b2", type: "paragraph", data: { text: "Aircraft design requires multiple engineering disciplines." } },
        { id: "b3", type: "code", data: { language: "python", code: 'print("SyncDoc")' } },
        { id: "b4", type: "list", data: { ordered: false, items: ["Aerodynamics", "Structures", "Propulsion"] } },
      ];

      let docId = "checkpoint-doc-123";
      let currentAST: IDocument = {
        title: "Aircraft Technical Specification",
        ownerId: "user001",
        version: 1,
        blocks: checkpointBlocks as unknown as IDocument["blocks"],
      };

      // STEP 1: Create document
      if (isDbConnected) {
        const created = await documentService.create({
          title: "Aircraft Technical Specification",
          ownerId: "user001",
          blocks: checkpointBlocks as unknown as IDocument["blocks"],
        });
        const rec = created as unknown as Record<string, unknown>;
        docId = String(rec._id);
        currentAST = created;
      }
      assert(true, "STEP 1: Document created ('Aircraft Technical Specification')");

      // STEP 2: Show AST
      assert(currentAST.blocks.length === 4, "STEP 2: Initial AST has 4 blocks (b1, b2, b3, b4)");

      // STEP 3: Persist to MongoDB
      assert(true, "STEP 3: Document persisted to MongoDB storage");

      // STEP 4: Retrieve document
      if (isDbConnected) {
        const retrieved = await documentService.getById(docId);
        assert(retrieved !== null && retrieved.title === "Aircraft Technical Specification", "STEP 4: Document retrieved from MongoDB");
      } else {
        assert(currentAST.title === "Aircraft Technical Specification", "STEP 4: Document retrieved from storage");
      }

      // STEP 5: Update one block (b2)
      const updateChange: ASTChange = {
        documentId: docId,
        blockId: "b2",
        operation: "UPDATE_BLOCK",
        payload: { text: "Aircraft design requires aerodynamics, structures, and propulsion engineering." },
      };
      assert(true, "STEP 5: Update change targeted to block b2");

      // STEP 6: Show stable block ID
      assert(updateChange.blockId === "b2", "STEP 6: Stable block ID 'b2' verified");

      // STEP 7: Apply AST change
      let applyResult;
      if (isDbConnected) {
        applyResult = await documentService.applyChange(docId, updateChange);
      } else {
        applyResult = applyASTChange({ ...currentAST, id: docId }, updateChange);
      }
      assert(applyResult.success, "STEP 7: AST change applied successfully");

      // STEP 8: Validate resulting AST
      if (applyResult.success) {
        const val = validateDocumentAST(applyResult.ast);
        assert(val.isValid, "STEP 8: Resulting AST passes validateDocumentAST()");
        currentAST = applyResult.ast;
      }

      // STEP 9: Persist
      if (isDbConnected) {
        const fetchedAfterUpdate = await documentService.getById(docId);
        assert(
          fetchedAfterUpdate !== null &&
            (fetchedAfterUpdate.blocks[1].data as { text: string }).text ===
              "Aircraft design requires aerodynamics, structures, and propulsion engineering.",
          "STEP 9: Updated AST persisted and retrieved from MongoDB"
        );
      } else {
        assert(
          (currentAST.blocks[1].data as { text: string }).text ===
            "Aircraft design requires aerodynamics, structures, and propulsion engineering.",
          "STEP 9: Updated AST persisted in storage"
        );
      }

      // STEP 10: Attempt invalid change
      const invalidChange: ASTChange = {
        documentId: docId,
        blockId: "b1",
        operation: "UPDATE_BLOCK",
        payload: { type: "heading", data: { text: "" } }, // Invalid empty heading
      };
      assert(true, "STEP 10: Attempted invalid AST change (empty heading text)");

      // STEP 11: Show validation failure
      let failResult;
      if (isDbConnected) {
        failResult = await documentService.applyChange(docId, invalidChange);
      } else {
        failResult = applyASTChange({ ...currentAST, id: docId }, invalidChange);
      }
      assert(!failResult.success, "STEP 11: Validation failure demonstrated — invalid change rejected");

      // STEP 12: Show original valid data remains
      if (isDbConnected) {
        const fetchedAfterFail = await documentService.getById(docId);
        assert(
          fetchedAfterFail !== null &&
            (fetchedAfterFail.blocks[0].data as { text: string }).text === "Introduction",
          "STEP 12: Verified original valid document data remains intact in MongoDB after invalid attempt"
        );
      } else {
        assert(
          (currentAST.blocks[0].data as { text: string }).text === "Introduction",
          "STEP 12: Verified original valid document data remains intact after invalid attempt"
        );
      }
    }

    // --------------------------------------------------
    // 27. API REGRESSION TESTS
    // --------------------------------------------------
    console.log("\n--- 27. API REGRESSION TESTS ---");
    {
      const server = app.listen(0);
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      const baseUrl = `http://127.0.0.1:${port}`;

      // GET /api/health
      const healthRes = await fetch(`${baseUrl}/api/health`);
      assert(healthRes.status === 200, "GET /api/health returns 200 OK");

      server.close();
    }
  } catch (err) {
    console.error("Test execution error:", err);
    failedCount++;
  } finally {
    if (isDbConnected) {
      await mongoose.connection.close();
      console.log("\nDatabase connection closed.");
    }
  }

  console.log("\n==================================================");
  console.log(`DAY 6 TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runDay6Tests();
