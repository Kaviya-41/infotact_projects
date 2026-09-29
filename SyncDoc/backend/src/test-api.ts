import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import type { AddressInfo } from "net";
import app from "./app.js";
import connectDatabase from "./config/db.js";

async function runApiTests() {
  console.log("Starting Express REST API Verification Suite...\n");

  const hasMongoUri = !!process.env.MONGO_URI;

  // Start HTTP server on dynamic port
  const server = app.listen(0);
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  console.log(`Test server running at ${baseUrl}\n`);

  try {
    if (hasMongoUri) {
      await connectDatabase();
      console.log("Connected to MongoDB for API integration tests.");
    } else {
      console.log("⚠️  MONGO_URI not set. Running HTTP middleware & negative API validation tests without database persistence.");
    }

    // 1. Health Check
    console.log("\n--- 1. Testing GET /api/health ---");
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthBody = await healthRes.json();
    console.log(`Status: ${healthRes.status}`);
    console.log(`Response:`, healthBody);
    if (healthRes.status !== 200 || !healthBody.success) {
      throw new Error("Health check failed!");
    }
    console.log("✅ Health check passed!");

    // 2. Negative Validation Tests for POST /api/documents
    console.log("\n--- 2. Testing Negative Cases for POST /api/documents ---");

    const negativeCases = [
      {
        name: "Empty title string",
        payload: { title: "", ownerId: "user001", blocks: [] },
      },
      {
        name: "Whitespace title string",
        payload: { title: "   ", ownerId: "user001", blocks: [] },
      },
      {
        name: "Missing title",
        payload: { ownerId: "user001", blocks: [] },
      },
      {
        name: "Empty ownerId string",
        payload: { title: "Valid Title", ownerId: "", blocks: [] },
      },
      {
        name: "Missing ownerId",
        payload: { title: "Valid Title", blocks: [] },
      },
      {
        name: "Blocks not an array",
        payload: { title: "Valid Title", ownerId: "user001", blocks: "not-an-array" },
      },
      {
        name: "Missing blocks field",
        payload: { title: "Valid Title", ownerId: "user001" },
      },
      {
        name: "Unsupported block type",
        payload: {
          title: "Valid Title",
          ownerId: "user001",
          blocks: [{ id: "b1", type: "invalid_type", data: {} }],
        },
      },
    ];

    for (const testCase of negativeCases) {
      const res = await fetch(`${baseUrl}/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testCase.payload),
      });
      const body = await res.json();

      if (res.status === 400 && body.success === false) {
        console.log(`✅ Correctly rejected (${testCase.name}): Status 400 - "${body.message}"`);
      } else {
        throw new Error(`Failed negative test '${testCase.name}'! Got status ${res.status}: ${JSON.stringify(body)}`);
      }
    }

    // 3. ObjectId Validation Tests
    console.log("\n--- 3. Testing ObjectId Format Validation ---");

    // Invalid ObjectId format
    const invalidIdRes = await fetch(`${baseUrl}/api/documents/invalid-id-12345`);
    const invalidIdBody = await invalidIdRes.json();
    console.log(`Invalid ID Status: ${invalidIdRes.status}, Body:`, invalidIdBody);
    if (invalidIdRes.status !== 400 || invalidIdBody.message !== "Invalid document ID") {
      throw new Error("Failed invalid ObjectId validation check!");
    }
    console.log("✅ Invalid ObjectId correctly rejected with HTTP 400 ('Invalid document ID')");

    // 4. Full CRUD & DB-Dependent Endpoint Verification
    if (hasMongoUri) {
      console.log("\n--- 4. Testing Non-Existent Document & Full REST API CRUD Workflow with MongoDB ---");

      const validNonExistentId = "64f9bf410e340e4f20bfac8a";

      // Non-existent ObjectId (valid hex format)
      const nonExistentRes = await fetch(`${baseUrl}/api/documents/${validNonExistentId}`);
      const nonExistentBody = await nonExistentRes.json();
      console.log(`Non-existent ID Status: ${nonExistentRes.status}, Body:`, nonExistentBody);
      if (nonExistentRes.status !== 404 || nonExistentBody.message !== "Document not found") {
        throw new Error("Failed non-existent document 404 check!");
      }
      console.log("✅ Non-existent ObjectId correctly returned HTTP 404 ('Document not found')");

      // PUT non-existent document
      const putNonExistentRes = await fetch(`${baseUrl}/api/documents/${validNonExistentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated Title" }),
      });
      if (putNonExistentRes.status !== 404) {
        throw new Error("Failed PUT non-existent document 404 check!");
      }
      console.log("✅ PUT non-existent document correctly returned HTTP 404");

      // DELETE non-existent document
      const deleteNonExistentRes = await fetch(`${baseUrl}/api/documents/${validNonExistentId}`, {
        method: "DELETE",
      });
      if (deleteNonExistentRes.status !== 404) {
        throw new Error("Failed DELETE non-existent document 404 check!");
      }
      console.log("✅ DELETE non-existent document correctly returned HTTP 404");

      // Create Document
      const createRes = await fetch(`${baseUrl}/api/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Aircraft Technical Specification",
          ownerId: "user001",
          blocks: [
            { id: "block001", type: "heading", data: { text: "Introduction" } },
            { id: "block002", type: "paragraph", data: { text: "SyncDoc is a collaborative document engine." } },
            { id: "block003", type: "code", data: { language: "javascript", code: "console.log('SyncDoc');" } },
            { id: "block004", type: "list", data: { ordered: false, items: ["AST", "MongoDB", "Collaboration"] } },
          ],
        }),
      });

      const createBody = await createRes.json();
      console.log("Create Status:", createRes.status);
      console.log("Create Body:", JSON.stringify(createBody, null, 2));

      if (createRes.status !== 201 || !createBody.success || !createBody.data._id) {
        throw new Error("POST /api/documents failed!");
      }
      const createdId = createBody.data._id;
      console.log("✅ Document created with ID:", createdId);

      // List Documents
      const listRes = await fetch(`${baseUrl}/api/documents`);
      const listBody = await listRes.json();
      console.log(`List Status: ${listRes.status}, Documents count: ${listBody.data.length}`);
      if (listRes.status !== 200 || !Array.isArray(listBody.data)) {
        throw new Error("GET /api/documents failed!");
      }
      console.log("✅ GET /api/documents returned list successfully!");

      // Get Document by ID
      const getRes = await fetch(`${baseUrl}/api/documents/${createdId}`);
      const getBody = await getRes.json();
      console.log("GetById Status:", getRes.status);
      if (getRes.status !== 200 || getBody.data._id !== createdId || getBody.data.blocks.length !== 4) {
        throw new Error("GET /api/documents/:id failed!");
      }
      console.log("✅ GET /api/documents/:id retrieved valid AST document structure!");

      // Update Document
      const updateRes = await fetch(`${baseUrl}/api/documents/${createdId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Updated Technical Specification",
        }),
      });
      const updateBody = await updateRes.json();
      console.log("Update Status:", updateRes.status);
      if (updateRes.status !== 200 || updateBody.data.title !== "Updated Technical Specification") {
        throw new Error("PUT /api/documents/:id failed!");
      }
      console.log("✅ PUT /api/documents/:id updated document title successfully!");

      // Delete Document
      const deleteRes = await fetch(`${baseUrl}/api/documents/${createdId}`, {
        method: "DELETE",
      });
      const deleteBody = await deleteRes.json();
      console.log("Delete Status:", deleteRes.status);
      if (deleteRes.status !== 200 || !deleteBody.success) {
        throw new Error("DELETE /api/documents/:id failed!");
      }
      console.log("✅ DELETE /api/documents/:id deleted document successfully!");
    }

    console.log("\n🎉 ALL REST API VERIFICATION TESTS PASSED SUCCESSFULLY!");

  } catch (error) {
    console.error("\n❌ REST API TEST FAILED:", error);
    process.exit(1);
  } finally {
    server.close();
    if (hasMongoUri) {
      await mongoose.connection.close();
    }
  }
}

runApiTests();
