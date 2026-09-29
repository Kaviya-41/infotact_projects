import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDatabase from "./config/db.js";
import Document from "./models/Document.js";
import { type AstBlock } from "./models/AstNode.js";
import { validateDocument } from "./validators/astValidator.js";
import {
  traverseAST,
  collectNodeIds,
  findNodeById,
  normalizeAST,
} from "./utils/astUtils.js";

async function runTests() {
  console.log("Starting Day 6 AST Structure & Normalization Test Suite...\n");

  const hasMongoUri = !!process.env.MONGO_URI;

  try {
    // --- PART 1: AST UTILITY & NORMALIZATION TESTS ---
    console.log("--- 1. Testing AST Utilities (traverseAST, collectNodeIds, findNodeById) ---");

    const sampleBlocks: AstBlock[] = [
      { id: "root-head-1", type: "heading", data: { text: "Introduction" } },
      { id: "root-para-1", type: "paragraph", data: { text: "Welcome to SyncDoc." } },
      {
        id: "root-section-1",
        type: "paragraph",
        data: { text: "Parent section node" },
        children: [
          { id: "child-code-1", type: "code", data: { language: "ts", code: "const a = 1;" } },
          { id: "child-list-1", type: "list", data: { ordered: false, items: ["A", "B"] } },
        ],
      } as unknown as AstBlock,
    ];

    // Test collectNodeIds
    const collectedIds = collectNodeIds(sampleBlocks);
    console.log("Collected Node IDs:", collectedIds);
    if (collectedIds.length !== 5 || !collectedIds.includes("child-code-1")) {
      throw new Error("collectNodeIds failed to collect root and child IDs!");
    }
    console.log("✅ collectNodeIds correctly extracted root and nested block IDs");

    // Test findNodeById (root-level)
    const foundRoot = findNodeById(sampleBlocks, "root-para-1");
    if (!foundRoot || foundRoot.type !== "paragraph") {
      throw new Error("findNodeById failed to find root-level node!");
    }
    console.log("✅ findNodeById found root-level block 'root-para-1'");

    // Test findNodeById (nested child)
    const foundChild = findNodeById(sampleBlocks, "child-code-1");
    if (!foundChild || foundChild.type !== "code") {
      throw new Error("findNodeById failed to find nested child node!");
    }
    console.log("✅ findNodeById found nested child block 'child-code-1'");

    // Test findNodeById (non-existent)
    const foundMissing = findNodeById(sampleBlocks, "non-existent-id");
    if (foundMissing !== undefined) {
      throw new Error("findNodeById returned a node for non-existent ID!");
    }
    console.log("✅ findNodeById correctly returned undefined for non-existent ID");

    // Test traverseAST order preservation
    const visitedPaths: string[] = [];
    traverseAST(sampleBlocks, (_node, path) => visitedPaths.push(path));
    console.log("Visited AST paths in order:", visitedPaths);
    if (visitedPaths[0] !== "blocks[0]" || visitedPaths[1] !== "blocks[1]") {
      throw new Error("traverseAST failed to preserve block order!");
    }
    console.log("✅ traverseAST preserved block order strictly");

    // Test normalizeAST metadata trimming & content preservation
    console.log("\n--- 2. Testing AST Normalization (normalizeAST) ---");
    const rawDocToNormalize = {
      title: "  Padded Document Title  ",
      ownerId: "  user007  ",
      blocks: [
        { id: "  b-padded-1  ", type: "heading  ", data: { text: "Heading Text Intact" } },
        { id: "b-padded-2", type: "code", data: { language: "  javascript  ", code: "  console.log('spaced');  " } },
      ],
    };

    const normalizedDoc = normalizeAST(rawDocToNormalize);
    console.log("Normalized Title:", `'${normalizedDoc.title}'`);
    console.log("Normalized OwnerId:", `'${normalizedDoc.ownerId}'`);
    console.log("Normalized Block 0 ID:", `'${normalizedDoc.blocks[0].id}'`);

    if (normalizedDoc.title !== "Padded Document Title" || normalizedDoc.ownerId !== "user007") {
      throw new Error("normalizeAST failed to trim document metadata!");
    }
    if (normalizedDoc.blocks[0].id !== "b-padded-1" || normalizedDoc.blocks[0].type !== "heading") {
      throw new Error("normalizeAST failed to trim block metadata!");
    }
    // Verify content string internal formatting was NOT destroyed
    if (normalizedDoc.blocks[1].data.code !== "  console.log('spaced');  ") {
      throw new Error("normalizeAST incorrectly mutated user document content!");
    }
    console.log("✅ normalizeAST trimmed metadata while preserving stable IDs, block order, and content!");

    // --- PART 2: VALID & INVALID TEST CASES ---
    console.log("\n--- 3. Testing Valid & Invalid Document Validations ---");

    const validDoc = new Document({
      title: "Aircraft Technical Specification",
      ownerId: "user001",
      version: 1,
      blocks: [
        { id: "b-head-1", type: "heading", data: { text: "Introduction" } },
        { id: "b-para-1", type: "paragraph", data: { text: "SyncDoc is a collaborative document engine." } },
        { id: "b-code-1", type: "code", data: { language: "javascript", code: "console.log('SyncDoc');" } },
        { id: "b-list-1", type: "list", data: { ordered: false, items: ["AST", "MongoDB", "Collaboration"] } },
      ],
    });
    await validDoc.validate();
    console.log("✅ Valid multi-block document passed schema validation");

    const invalidCases: Array<{ id: number; name: string; payload: unknown; expectedPath: string }> = [
      {
        id: 1,
        name: "Missing title",
        payload: { ownerId: "u1", blocks: [{ id: "b1", type: "paragraph", data: { text: "hi" } }] },
        expectedPath: "title",
      },
      {
        id: 2,
        name: "Duplicate block ID",
        payload: {
          title: "Title",
          ownerId: "u1",
          blocks: [
            { id: "b-dup", type: "paragraph", data: { text: "p1" } },
            { id: "b-dup", type: "heading", data: { text: "h1" } },
          ],
        },
        expectedPath: "blocks[1].id",
      },
    ];

    for (const testCase of invalidCases) {
      const res = validateDocument(testCase.payload);
      if (res.isValid) {
        throw new Error(`Failed Case ${testCase.id} (${testCase.name}): Expected invalid, but passed!`);
      }
      console.log(`✅ Invalid Case ${testCase.id} (${testCase.name}) correctly rejected`);
    }

    // --- PART 3: MONGOOSE PRE-SAVE PERSISTENCE PROTECTION ---
    console.log("\n--- 4. Testing Mongoose Pre-Save Hook Protection ---");
    if (hasMongoUri) {
      await connectDatabase();
      await Document.deleteMany({});

      const invalidDocToPersist = new Document({
        title: "Bad Doc",
        ownerId: "u1",
        blocks: [{ id: "b-bad", type: "heading", data: {} } as AstBlock],
      });

      try {
        await invalidDocToPersist.save();
        throw new Error("Mongoose pre-save hook failed to prevent persistence of invalid AST!");
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "ValidationError") {
          console.log(`✅ Mongoose pre-save hook correctly rejected persistence!`);
        } else {
          throw err;
        }
      }

      await mongoose.connection.close();
      console.log("Database connection closed.");
    } else {
      console.log("⚠️  Skipping DB persistence test because MONGO_URI is not set.");
    }

    console.log("\n🎉 ALL DAY 6 AST UTILITIES & NORMALIZATION TESTS PASSED SUCCESSFULLY!");

  } catch (error) {
    console.error("\n❌ DAY 6 TEST FAILED:", error);
    process.exit(1);
  }
}

runTests();
