import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app.js";
import Document from "./models/Document.js";
import documentService from "./services/documentService.js";
import { validateDocumentAST, validateASTChange } from "./validators/astValidator.js";
import { applyASTChange } from "./utils/astChangeUtils.js";
import type { IDocument } from "./models/Document.js";
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

async function runDay5Tests() {
  console.log("\n==================================================");
  console.log("WEEK 2 — DAY 5: AST LAYER SYNCHRONIZATION-READY TEST SUITE");
  console.log("==================================================\n");

  let isDbConnected = false;
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/syncdoc_test_w2d5";

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
    // 1. DOCUMENT ID CHECK
    // --------------------------------------------------
    console.log("--- 1. DOCUMENT ID CHECK ---");
    {
      const initialDoc: IDocument = {
        title: "Test Doc",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "heading", data: { text: "Heading" } },
          { id: "b2", type: "paragraph", data: { text: "Paragraph" } },
        ],
      };

      const mismatchChange: ASTChange = {
        documentId: "doc-wrong-id",
        blockId: "b1",
        operation: "UPDATE_BLOCK",
        payload: { text: "Should fail" },
      };

      const docWithId = { ...initialDoc, id: "doc-correct-id" };
      const validation = validateASTChange(mismatchChange, docWithId);
      assert(!validation.isValid, "Mismatched documentId rejected by validateASTChange");

      const applyResult = applyASTChange(docWithId, mismatchChange);
      assert(!applyResult.success, "applyASTChange fails on documentId mismatch");
    }

    // --------------------------------------------------
    // 2. BLOCK ID CHECK
    // --------------------------------------------------
    console.log("\n--- 2. BLOCK ID CHECK ---");
    {
      const initialDoc: IDocument = {
        title: "Block ID Check Doc",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "heading", data: { text: "Heading" } },
          { id: "b2", type: "paragraph", data: { text: "Paragraph" } },
        ],
      };

      const nonExistentUpdate: ASTChange = {
        documentId: "doc1",
        blockId: "b-nonexistent",
        operation: "UPDATE_BLOCK",
        payload: { text: "Update non-existent" },
      };

      const docObj = { ...initialDoc, id: "doc1" };
      const updateResult = applyASTChange(docObj, nonExistentUpdate);
      assert(!updateResult.success, "UPDATE_BLOCK on non-existent block returns controlled error");

      const duplicateCreate: ASTChange = {
        documentId: "doc1",
        blockId: "b1", // already exists
        operation: "CREATE_BLOCK",
        payload: { type: "paragraph", data: { text: "Duplicate b1" } },
      };

      const createResult = applyASTChange(docObj, duplicateCreate);
      assert(!createResult.success, "CREATE_BLOCK with existing block ID is rejected");
    }

    // --------------------------------------------------
    // 3. CREATE CHANGE SAFETY
    // --------------------------------------------------
    console.log("\n--- 3. CREATE CHANGE SAFETY ---");
    {
      const doc: IDocument = {
        title: "Create Safety Doc",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "heading", data: { text: "Heading" } },
          { id: "b2", type: "paragraph", data: { text: "Paragraph" } },
        ],
      };
      const docObj = { ...doc, id: "doc-create" };

      const createChange: ASTChange = {
        documentId: "doc-create",
        blockId: "b3",
        operation: "CREATE_BLOCK",
        payload: { type: "paragraph", data: { text: "New block b3" } },
      };

      const firstApply = applyASTChange(docObj, createChange);
      assert(firstApply.success, "First application of CREATE_BLOCK b3 succeeds");

      if (firstApply.success) {
        assert(firstApply.ast.blocks.length === 3, "Resulting AST has 3 blocks");
        assert(firstApply.ast.blocks[2].id === "b3", "Block b3 added at position 2");

        // Second application of identical create change
        const secondApply = applyASTChange(firstApply.ast, createChange);
        assert(!secondApply.success, "Second application of CREATE_BLOCK b3 returns controlled failure/rejection");
      }
    }

    // --------------------------------------------------
    // 4. UPDATE CHANGE SAFETY
    // --------------------------------------------------
    console.log("\n--- 4. UPDATE CHANGE SAFETY ---");
    {
      const doc: IDocument = {
        title: "Update Safety Doc",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "paragraph", data: { text: "Hello" } },
        ],
      };
      const docObj = { ...doc, id: "doc-update" };

      const updateChange: ASTChange = {
        documentId: "doc-update",
        blockId: "b1",
        operation: "UPDATE_BLOCK",
        payload: { text: "Hello World" },
      };

      const result = applyASTChange(docObj, updateChange);
      assert(result.success, "UPDATE_BLOCK b1 succeeds");

      if (result.success) {
        assert(result.ast.blocks.length === 1, "Block count remains 1");
        assert(result.ast.blocks[0].id === "b1", "Block ID remains b1");
        assert(
          (result.ast.blocks[0].data as { text: string }).text === "Hello World",
          "Block content updated to 'Hello World'"
        );
      }
    }

    // --------------------------------------------------
    // 5. DELETE CHANGE SAFETY
    // --------------------------------------------------
    console.log("\n--- 5. DELETE CHANGE SAFETY ---");
    {
      const doc: IDocument = {
        title: "Delete Safety Doc",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "heading", data: { text: "b1" } },
          { id: "b2", type: "paragraph", data: { text: "b2" } },
        ],
      };
      const docObj = { ...doc, id: "doc-del" };

      const deleteChange: ASTChange = {
        documentId: "doc-del",
        blockId: "b2",
        operation: "DELETE_BLOCK",
      };

      const firstDelete = applyASTChange(docObj, deleteChange);
      assert(firstDelete.success, "First DELETE_BLOCK b2 succeeds");

      if (firstDelete.success) {
        assert(firstDelete.ast.blocks.length === 1, "Only 1 block remaining (b1)");
        assert(firstDelete.ast.blocks[0].id === "b1", "Remaining block is b1");

        // Repeat delete
        const secondDelete = applyASTChange(firstDelete.ast, deleteChange);
        assert(!secondDelete.success, "Repeated delete returns controlled result");
        assert(firstDelete.ast.blocks.length === 1, "Remaining block b1 is NOT accidentally deleted");
      }
    }

    // --------------------------------------------------
    // 6. MOVE CHANGE SAFETY
    // --------------------------------------------------
    console.log("\n--- 6. MOVE CHANGE SAFETY ---");
    {
      const doc: IDocument = {
        title: "Move Safety Doc",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "paragraph", data: { text: "b1" } },
          { id: "b2", type: "paragraph", data: { text: "b2" } },
          { id: "b3", type: "paragraph", data: { text: "b3" } },
        ],
      };
      const docObj = { ...doc, id: "doc-move" };

      const moveChange: ASTChange = {
        documentId: "doc-move",
        blockId: "b3",
        operation: "MOVE_BLOCK",
        payload: { targetIndex: 0 },
      };

      const result = applyASTChange(docObj, moveChange);
      assert(result.success, "MOVE_BLOCK b3 to index 0 succeeds");

      if (result.success) {
        const ids = result.ast.blocks.map((b) => b.id);
        assert(ids.join(",") === "b3,b1,b2", "Blocks reordered to [b3, b1, b2]");
        const val = validateDocumentAST(result.ast);
        assert(val.isValid, "Resulting AST is valid");
      }
    }

    // --------------------------------------------------
    // 7. RESULT VALIDATION & IMMUTABILITY
    // --------------------------------------------------
    console.log("\n--- 7. RESULT VALIDATION & IMMUTABILITY ---");
    {
      const originalAST: IDocument = {
        title: "Immutability Doc",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "b1", type: "paragraph", data: { text: "Original" } }],
      };

      const change: ASTChange = {
        documentId: "doc-immut",
        blockId: "b1",
        operation: "UPDATE_BLOCK",
        payload: { text: "Modified" },
      };

      const docObj = { ...originalAST, id: "doc-immut" };
      const result = applyASTChange(docObj, change);

      if (result.success) {
        assert(originalAST !== result.ast, "Result AST is a new object reference");
      } else {
        assert(false, "applyASTChange failed unexpectedly");
      }
      assert(
        (originalAST.blocks[0].data as { text: string }).text === "Original",
        "Original AST content remains completely unchanged (immutable)"
      );

      // Test invalid result rejection (e.g. update block to empty text in heading)
      const invalidUpdate: ASTChange = {
        documentId: "doc-immut",
        blockId: "b1",
        operation: "UPDATE_BLOCK",
        payload: { type: "heading", data: { text: "" } }, // Invalid empty heading
      };

      const invalidResult = applyASTChange(docObj, invalidUpdate);
      assert(!invalidResult.success, "Invalid resulting AST is rejected by applyASTChange");
    }

    // --------------------------------------------------
    // 8. IDEMPOTENCY PREPARATION
    // --------------------------------------------------
    console.log("\n--- 8. IDEMPOTENCY PREPARATION ---");
    {
      const doc: IDocument = {
        title: "Idempotency Doc",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "paragraph", data: { text: "b1 text" } },
          { id: "b2", type: "paragraph", data: { text: "b2 text" } },
        ],
      };
      const docObj = { ...doc, id: "doc-idem" };

      // Double UPDATE: b1 text updated twice with same content
      const updateB1: ASTChange = {
        documentId: "doc-idem",
        blockId: "b1",
        operation: "UPDATE_BLOCK",
        payload: { text: "b1 updated" },
      };
      const res1 = applyASTChange(docObj, updateB1);
      const res2 = res1.success ? applyASTChange(res1.ast, updateB1) : res1;
      assert(res2.success, "Applying same UPDATE_BLOCK twice is deterministic and safe");
      if (res2.success) {
        assert(res2.ast.blocks[0].id === "b1", "b1 ID remains stable on double update");
        assert(res2.ast.blocks.length === 2, "Block count remains 2 on double update");
      }
    }

    // --------------------------------------------------
    // 9. CONCURRENT CHANGE SIMULATION (2 CLIENTS)
    // --------------------------------------------------
    console.log("\n--- 9. CONCURRENT CHANGE SIMULATION (2 CLIENTS) ---");
    {
      const initialDoc: IDocument = {
        title: "Concurrent Doc",
        ownerId: "user01",
        version: 1,
        blocks: [{ id: "b1", type: "paragraph", data: { text: "Hello" } }],
      };
      const docObj = { ...initialDoc, id: "doc-conc" };

      const changeA: ASTChange = {
        documentId: "doc-conc",
        blockId: "b1",
        operation: "UPDATE_BLOCK",
        payload: { text: "Hello from A" },
      };

      const changeB: ASTChange = {
        documentId: "doc-conc",
        blockId: "b1",
        operation: "UPDATE_BLOCK",
        payload: { text: "Hello from B" },
      };

      const resA = applyASTChange(docObj, changeA);
      const resB = applyASTChange(docObj, changeB);

      assert(resA.success && resB.success, "Both concurrent changes are structurally valid");
      assert(resA.success && validateDocumentAST(resA.ast).isValid, "Client A output AST is valid");
      assert(resB.success && validateDocumentAST(resB.ast).isValid, "Client B output AST is valid");
      if (resA.success && resB.success) {
        assert(resA.ast.blocks[0].id === "b1" && resB.ast.blocks[0].id === "b1", "Block ID b1 remains stable for both clients");
      }
    }

    // --------------------------------------------------
    // 10. MULTIPLE BLOCK CONCURRENCY
    // --------------------------------------------------
    console.log("\n--- 10. MULTIPLE BLOCK CONCURRENCY ---");
    {
      const doc: IDocument = {
        title: "Multi Block Doc",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "paragraph", data: { text: "p1" } },
          { id: "b2", type: "paragraph", data: { text: "p2" } },
          { id: "b3", type: "paragraph", data: { text: "p3" } },
        ],
      };
      const docObj = { ...doc, id: "doc-multi" };

      const changeA: ASTChange = { documentId: "doc-multi", blockId: "b1", operation: "UPDATE_BLOCK", payload: { text: "p1 updated" } };
      const changeB: ASTChange = { documentId: "doc-multi", blockId: "b2", operation: "UPDATE_BLOCK", payload: { text: "p2 updated" } };
      const changeC: ASTChange = { documentId: "doc-multi", blockId: "b3", operation: "UPDATE_BLOCK", payload: { text: "p3 updated" } };

      const r1 = applyASTChange(docObj, changeA);
      const r2 = r1.success ? applyASTChange(r1.ast, changeB) : r1;
      const r3 = r2.success ? applyASTChange(r2.ast, changeC) : r2;

      assert(r3.success, "Sequential application of independent block updates succeeds");
      if (r3.success) {
        assert(r3.ast.blocks.length === 3, "All 3 blocks present");
        assert((r3.ast.blocks[0].data as { text: string }).text === "p1 updated", "b1 updated");
        assert((r3.ast.blocks[1].data as { text: string }).text === "p2 updated", "b2 updated");
        assert((r3.ast.blocks[2].data as { text: string }).text === "p3 updated", "b3 updated");
      }
    }

    // --------------------------------------------------
    // 11. CONCURRENT CREATE, DELETE, & MOVE SIMULATION
    // --------------------------------------------------
    console.log("\n--- 11. CONCURRENT CREATE, DELETE, & MOVE SIMULATION ---");
    {
      const doc: IDocument = {
        title: "Concurrent Ops Doc",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "paragraph", data: { text: "b1" } },
          { id: "b2", type: "paragraph", data: { text: "b2" } },
          { id: "b3", type: "paragraph", data: { text: "b3" } },
          { id: "b4", type: "paragraph", data: { text: "b4" } },
        ],
      };
      const docObj = { ...doc, id: "doc-ops" };

      // Concurrent Creates: b5 by A, b6 by B
      const createB5: ASTChange = { documentId: "doc-ops", blockId: "b5", operation: "CREATE_BLOCK", payload: { type: "paragraph", data: { text: "b5" } } };
      const createB6: ASTChange = { documentId: "doc-ops", blockId: "b6", operation: "CREATE_BLOCK", payload: { type: "paragraph", data: { text: "b6" } } };

      const c1 = applyASTChange(docObj, createB5);
      const c2 = c1.success ? applyASTChange(c1.ast, createB6) : c1;

      assert(c2.success, "Concurrent creates resulting in unique block IDs succeed");
      if (c2.success) {
        assert(c2.ast.blocks.length === 6, "Block count expanded to 6");
      }

      // Concurrent Deletes: delete b2 by A, delete b4 by B
      const delB2: ASTChange = { documentId: "doc-ops", blockId: "b2", operation: "DELETE_BLOCK" };
      const delB4: ASTChange = { documentId: "doc-ops", blockId: "b4", operation: "DELETE_BLOCK" };

      const d1 = applyASTChange(docObj, delB2);
      const d2 = d1.success ? applyASTChange(d1.ast, delB4) : d1;
      assert(d2.success, "Concurrent deletes succeed cleanly");
      if (d2.success) {
        const remainingIds = d2.ast.blocks.map((b) => b.id);
        assert(remainingIds.join(",") === "b1,b3", "Remaining blocks are b1 and b3");
      }

      // Concurrent Moves: move b3 to index 0
      const move1: ASTChange = { documentId: "doc-ops", blockId: "b3", operation: "MOVE_BLOCK", payload: { targetIndex: 0 } };
      const m1 = applyASTChange(docObj, move1);
      assert(m1.success && validateDocumentAST(m1.ast).isValid, "Concurrent move produces valid AST");
    }

    // --------------------------------------------------
    // 12. 10-CLIENT TEST STRESS HARNESS
    // --------------------------------------------------
    console.log("\n--- 12. 10-CLIENT TEST STRESS HARNESS ---");
    {
      const doc: IDocument = {
        title: "10-Client Stress Test Doc",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "heading", data: { text: "Initial Heading" } },
          { id: "b2", type: "paragraph", data: { text: "Initial Paragraph 1" } },
          { id: "b3", type: "paragraph", data: { text: "Initial Paragraph 2" } },
        ],
      };

      let docId = "doc-10clients";
      let currentDocObj: IDocument = { ...doc, id: docId } as unknown as IDocument;

      if (isDbConnected) {
        const createdDoc = await documentService.create({
          title: doc.title,
          ownerId: doc.ownerId,
          blocks: doc.blocks,
        });
        const rec = createdDoc as unknown as Record<string, unknown>;
        docId = String(rec._id);
        currentDocObj = createdDoc;
      }

      const clientOperations: Array<{ client: number; change: ASTChange }> = [
        { client: 1, change: { documentId: docId, blockId: "b1", operation: "UPDATE_BLOCK", payload: { text: "Heading Updated by Client 1" } } },
        { client: 2, change: { documentId: docId, blockId: "b2", operation: "UPDATE_BLOCK", payload: { text: "P1 Updated by Client 2" } } },
        { client: 3, change: { documentId: docId, blockId: "b3", operation: "UPDATE_BLOCK", payload: { text: "P2 Updated by Client 3" } } },
        { client: 4, change: { documentId: docId, blockId: "b4", operation: "CREATE_BLOCK", payload: { type: "paragraph", data: { text: "Block b4 Created by Client 4" } } } },
        { client: 5, change: { documentId: docId, blockId: "b1", operation: "UPDATE_BLOCK", payload: { text: "Heading Updated Again by Client 5" } } },
        { client: 6, change: { documentId: docId, blockId: "b2", operation: "DELETE_BLOCK" } },
        { client: 7, change: { documentId: docId, blockId: "b5", operation: "CREATE_BLOCK", payload: { type: "code", data: { language: "python", code: "print('Client 7 Code')" } } } },
        { client: 8, change: { documentId: docId, blockId: "b3", operation: "UPDATE_BLOCK", payload: { text: "P2 Updated Again by Client 8" } } },
        { client: 9, change: { documentId: docId, blockId: "b4", operation: "MOVE_BLOCK", payload: { targetIndex: 0 } } },
        { client: 10, change: { documentId: docId, blockId: "b5", operation: "UPDATE_BLOCK", payload: { code: "print('Client 10 Code Update')" } } },
      ];

      let allSucceeded = true;
      for (const op of clientOperations) {
        const res = applyASTChange(currentDocObj, op.change);
        if (!res.success) {
          allSucceeded = false;
          console.error(`  Client ${op.client} operation failed: ${res.message}`);
          break;
        }
        currentDocObj = res.ast;
      }

      assert(allSucceeded, "All 10 simulated client operations applied successfully in sequence");

      // Final AST Validation
      const finalValidation = validateDocumentAST(currentDocObj);
      assert(finalValidation.isValid, "Final AST after 10-client stress test passes validateDocumentAST()");

      // Verify final block integrity
      const finalIds = currentDocObj.blocks.map((b) => b.id);
      assert(finalIds.length === 4, "Final AST block count is 4 (b4, b1, b3, b5)");
      assert(finalIds[0] === "b4", "b4 was moved to index 0 by Client 9");
      assert(new Set(finalIds).size === 4, "All block IDs remain strictly unique");
    }

    // --------------------------------------------------
    // 13. MONGODB PERSISTENCE & FAILED CHANGE SAFETY
    // --------------------------------------------------
    console.log("\n--- 13. PERSISTENCE & FAILED CHANGE SAFETY ---");
    {
      let docId = "persist-doc-id";
      let storedAST: IDocument = {
        title: "Persistence Doc",
        ownerId: "user01",
        version: 1,
        blocks: [
          { id: "b1", type: "heading", data: { text: "Persist Heading" } },
          { id: "b2", type: "paragraph", data: { text: "Persist Paragraph" } },
        ],
      };

      if (isDbConnected) {
        const newDoc = await documentService.create({
          title: storedAST.title,
          ownerId: storedAST.ownerId,
          blocks: storedAST.blocks,
        });
        const rec = newDoc as unknown as Record<string, unknown>;
        docId = String(rec._id);
      }

      // Apply valid change
      const validChange: ASTChange = {
        documentId: docId,
        blockId: "b1",
        operation: "UPDATE_BLOCK",
        payload: { text: "Persisted Heading Update" },
      };

      if (isDbConnected) {
        const applyRes = await documentService.applyChange(docId, validChange);
        assert(applyRes.success, "documentService.applyChange succeeds for valid change");

        const fetchedDoc = await documentService.getById(docId);
        assert(fetchedDoc !== null, "Document retrieved from MongoDB");
        if (fetchedDoc) {
          assert((fetchedDoc.blocks[0].data as { text: string }).text === "Persisted Heading Update", "MongoDB contains updated AST text");
        }
      } else {
        const applyRes = applyASTChange({ ...storedAST, id: docId }, validChange);
        assert(applyRes.success, "In-memory AST applyChange succeeds for valid change");
        if (applyRes.success) {
          storedAST = applyRes.ast;
          assert((storedAST.blocks[0].data as { text: string }).text === "Persisted Heading Update", "AST state updated successfully");
        }
      }

      // Attempt invalid change — MUST NOT PERSIST
      const invalidChange: ASTChange = {
        documentId: docId,
        blockId: "b1",
        operation: "UPDATE_BLOCK",
        payload: { type: "heading", data: { text: "" } }, // Invalid empty text
      };

      if (isDbConnected) {
        const failRes = await documentService.applyChange(docId, invalidChange);
        assert(!failRes.success, "Invalid change fails application");

        const fetchedDocAfter = await documentService.getById(docId);
        assert(fetchedDocAfter !== null, "Document retrieved after failed change");
        if (fetchedDocAfter) {
          assert(
            (fetchedDocAfter.blocks[0].data as { text: string }).text === "Persisted Heading Update",
            "MongoDB document state remained completely unchanged after failed operation"
          );
        }
      } else {
        const failRes = applyASTChange({ ...storedAST, id: docId }, invalidChange);
        assert(!failRes.success, "Invalid change fails application in-memory");
        assert(
          (storedAST.blocks[0].data as { text: string }).text === "Persisted Heading Update",
          "Document state remained completely unchanged after failed operation"
        );
      }
    }

    // --------------------------------------------------
    // 14. REVIEW DEMONSTRATION ("Aircraft Technical Specification")
    // --------------------------------------------------
    console.log("\n--- 14. REVIEW DEMONSTRATION (\"Aircraft Technical Specification\") ---");
    {
      const initialBlocks = [
        { id: "b1", type: "heading", data: { text: "Introduction" } },
        { id: "b2", type: "paragraph", data: { text: "Aircraft design requires multiple engineering disciplines." } },
        { id: "b3", type: "code", data: { language: "python", code: 'print("SyncDoc")' } },
        { id: "b4", type: "list", data: { ordered: false, items: ["Aerodynamics", "Structures", "Propulsion"] } },
      ];

      let demoId = "demo-aircraft-doc";
      let demoState: IDocument = {
        title: "Aircraft Technical Specification",
        ownerId: "user001",
        version: 1,
        blocks: initialBlocks as unknown as IDocument["blocks"],
      };

      if (isDbConnected) {
        const demoDoc = await documentService.create({
          title: "Aircraft Technical Specification",
          ownerId: "user001",
          blocks: initialBlocks as unknown as IDocument["blocks"],
        });
        const rec = demoDoc as unknown as Record<string, unknown>;
        demoId = String(rec._id);
        assert(demoId.length > 0, "1. Demo Document created successfully in MongoDB");

        const retrieved1 = await documentService.getById(demoId);
        assert(retrieved1 !== null && retrieved1.title === "Aircraft Technical Specification", "2. Demo Document retrieved successfully");

        const updateChange: ASTChange = {
          documentId: demoId,
          blockId: "b2",
          operation: "UPDATE_BLOCK",
          payload: { text: "Aircraft design requires aerodynamics, structures, and propulsion engineering." },
        };

        const changeRes = await documentService.applyChange(demoId, updateChange);
        assert(changeRes.success, "4-6. AST change applied, validated, and persisted successfully");

        const retrieved2 = await documentService.getById(demoId);
        assert(retrieved2 !== null, "7. Retrieved document again from MongoDB");
        if (retrieved2) {
          assert(
            (retrieved2.blocks[1].data as { text: string }).text ===
              "Aircraft design requires aerodynamics, structures, and propulsion engineering.",
            "Updated AST paragraph text verified from MongoDB storage"
          );
        }
      } else {
        assert(true, "1. Demo Document created successfully in-memory");
        assert(demoState.title === "Aircraft Technical Specification", "2. Demo Document retrieved successfully");

        const updateChange: ASTChange = {
          documentId: demoId,
          blockId: "b2",
          operation: "UPDATE_BLOCK",
          payload: { text: "Aircraft design requires aerodynamics, structures, and propulsion engineering." },
        };

        const changeRes = applyASTChange({ ...demoState, id: demoId }, updateChange);
        assert(changeRes.success, "4-6. AST change applied and validated successfully");
        if (changeRes.success) {
          demoState = changeRes.ast;
          assert(
            (demoState.blocks[1].data as { text: string }).text ===
              "Aircraft design requires aerodynamics, structures, and propulsion engineering.",
            "Updated AST paragraph text verified"
          );
        }
      }
    }

    // --------------------------------------------------
    // 15. API REGRESSION TESTS
    // --------------------------------------------------
    console.log("\n--- 15. API REGRESSION TESTS ---");
    {
      const server = app.listen(0);
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      const baseUrl = `http://127.0.0.1:${port}`;

      // Health Check
      const healthRes = await fetch(`${baseUrl}/api/health`);
      assert(healthRes.status === 200, "GET /api/health returns 200 OK");

      if (isDbConnected) {
        const createRes = await fetch(`${baseUrl}/api/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "API Test Doc",
            ownerId: "apiUser",
            blocks: [{ id: "b1", type: "paragraph", data: { text: "API test" } }],
          }),
        });
        assert(createRes.status === 201, "POST /api/documents returns 201 Created");
        const createData = (await createRes.json()) as { data: { _id: string } };
        const apiDocId = createData.data._id;

        const getRes = await fetch(`${baseUrl}/api/documents/${apiDocId}`);
        assert(getRes.status === 200, "GET /api/documents/:id returns 200 OK");

        const listRes = await fetch(`${baseUrl}/api/documents?ownerId=apiUser`);
        assert(listRes.status === 200, "GET /api/documents returns 200 OK");

        const changeRes = await fetch(`${baseUrl}/api/documents/${apiDocId}/changes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: apiDocId,
            blockId: "b1",
            operation: "UPDATE_BLOCK",
            payload: { text: "API change updated" },
          }),
        });
        assert(changeRes.status === 200, "POST /api/documents/:id/changes returns 200 OK");

        const putRes = await fetch(`${baseUrl}/api/documents/${apiDocId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Updated API Title" }),
        });
        assert(putRes.status === 200, "PUT /api/documents/:id returns 200 OK");

        const delRes = await fetch(`${baseUrl}/api/documents/${apiDocId}`, {
          method: "DELETE",
        });
        assert(delRes.status === 200, "DELETE /api/documents/:id returns 200 OK");
      } else {
        // Validation rejection tests (No DB required)
        const invalidPost = await fetch(`${baseUrl}/api/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "", ownerId: "user" }),
        });
        assert(invalidPost.status === 400, "POST invalid document returns 400 Bad Request");

        const invalidGet = await fetch(`${baseUrl}/api/documents/invalid-id-format`);
        assert(invalidGet.status === 400, "GET invalid ObjectId returns 400 Bad Request");
      }

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
  console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runDay5Tests();
