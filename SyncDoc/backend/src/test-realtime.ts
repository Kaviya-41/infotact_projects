import dotenv from "dotenv";
dotenv.config();

import http from "http";
import WebSocket from "ws";
import * as Y from "yjs";
import app from "./app.js";
import collaborationServer from "./realtime/collaborationServer.js";
import roomManager from "./realtime/roomManager.js";
import documentService from "./services/documentService.js";
import exportService from "./services/exportService.js";
import { astToYDoc, yDocToAST } from "./realtime/astYjsMap.js";
import {
  handleYjsMessage,
  createSyncStep1Message,
  createUpdateMessage,
  MSG_SYNC_STEP1,
  MSG_SYNC_STEP2,
} from "./realtime/yjsSync.js";
import type { IDocument } from "./models/Document.js";
import type { AstBlock } from "./models/AstNode.js";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string): void {
  if (condition) {
    passedCount++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`  ❌ FAIL: ${testName}${detail ? ` (${detail})` : ""}`);
  }
}

async function runRealtimeTests(): Promise<void> {
  console.log("\n==================================================");
  console.log("SYNCDOC MEMBER 2: YJS + WEBSOCKET REAL-TIME SUITE");
  console.log("==================================================\n");

  const PORT = 5099;
  const server = http.createServer(app);
  collaborationServer.attach(server, "/ws");

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => resolve());
  });
  console.log(`Test server running on port ${PORT}\n`);

  // --- 1. REST HEALTH ENDPOINT ---
  console.log("--- 1. REST HEALTH ENDPOINT ---");
  {
    const res = await fetch(`http://localhost:${PORT}/api/health`);
    const json = (await res.json()) as { success: boolean; message: string };
    assert(res.status === 200, "GET /api/health returns 200 OK");
    assert(json.success === true, "Health response success flag is true");
    assert(json.message === "SyncDoc API is running", "Health response message correct");
  }

  // Mock / In-Memory Document Setup for test suite execution
  const TEST_DOC_ID = "650000000000000000000001";
  const NON_EXISTENT_DOC_ID = "650000000000000000000099";

  const initialBlocks: AstBlock[] = [
    {
      id: "b-head-1",
      type: "heading",
      data: { text: "Collaborative SyncDoc Document" },
    },
    {
      id: "b-para-1",
      type: "paragraph",
      data: { text: "Initial paragraph text before Yjs edits." },
    },
    {
      id: "b-code-1",
      type: "code",
      data: { language: "typescript", code: "const sync = true;" },
    },
    {
      id: "b-list-1",
      type: "list",
      data: { ordered: true, items: ["Step 1", "Step 2"] },
    },
  ];

  let currentDoc: IDocument = {
    title: "Real-Time Collaboration Spec",
    ownerId: "user_author_1",
    version: 1,
    blocks: initialBlocks,
  };

  // Override documentService.getById to serve mock document cleanly
  const originalGetById = documentService.getById;
  const originalUpdate = documentService.update;

  documentService.getById = async (id: string): Promise<IDocument | null> => {
    if (id === TEST_DOC_ID) {
      return JSON.parse(JSON.stringify(currentDoc)) as IDocument;
    }
    return null;
  };

  documentService.update = async (id: string, input: { title?: string; blocks?: AstBlock[] }): Promise<IDocument | null> => {
    if (id === TEST_DOC_ID) {
      if (input.title !== undefined) currentDoc.title = input.title;
      if (input.blocks !== undefined) currentDoc.blocks = input.blocks;
      currentDoc.version += 1;
      return JSON.parse(JSON.stringify(currentDoc)) as IDocument;
    }
    return null;
  };

  try {
    // --- 2. AST <-> YJS CONVERSION UNIT TESTS ---
    console.log("\n--- 2. AST <-> YJS CONVERSION UNIT TESTS ---");
    {
      const yDoc = astToYDoc(initialBlocks);
      const extractedBlocks = yDocToAST(yDoc);

      assert(extractedBlocks.length === 4, "yDocToAST extracts exact 4 blocks");
      assert(extractedBlocks[0].id === "b-head-1", "Heading block ID preserved");
      assert(extractedBlocks[0].type === "heading", "Heading type preserved");
      assert((extractedBlocks[0].data as { text: string }).text === "Collaborative SyncDoc Document", "Heading text preserved");
      assert(extractedBlocks[2].type === "code", "Code block type preserved");
      assert((extractedBlocks[2].data as { language: string }).language === "typescript", "Code language preserved");
      assert(extractedBlocks[3].type === "list", "List block type preserved");
      assert((extractedBlocks[3].data as { items: string[] }).items.length === 2, "List items length preserved");
    }

    // --- 3. YJS PROTOCOL MESSAGING UNIT TESTS ---
    console.log("\n--- 3. YJS PROTOCOL MESSAGING UNIT TESTS ---");
    {
      const docA = astToYDoc(initialBlocks);
      const docB = new Y.Doc();

      const step1MsgB = createSyncStep1Message(docB);
      assert(step1MsgB[0] === MSG_SYNC_STEP1, "SyncStep1 message header byte is 0");

      const result1 = handleYjsMessage(docA, step1MsgB);
      assert(result1.type === MSG_SYNC_STEP1, "handleYjsMessage parses SyncStep1");
      assert(result1.reply !== undefined, "handleYjsMessage produces SyncStep2 reply");
      assert(result1.reply![0] === MSG_SYNC_STEP2, "SyncStep2 reply header byte is 1");

      const result2 = handleYjsMessage(docB, result1.reply!);
      assert(result2.type === MSG_SYNC_STEP2, "handleYjsMessage parses SyncStep2");

      const blocksB = yDocToAST(docB);
      assert(blocksB.length === 4, "docB synchronized with docA content");
      assert(blocksB[0].id === "b-head-1", "docB has correct heading block ID");
    }

    // --- 4. WEBSOCKET CONNECTION VALIDATION & REJECTIONS ---
    console.log("\n--- 4. WEBSOCKET CONNECTION VALIDATION & REJECTIONS ---");
    {
      // Missing documentId
      const wsMissing = new WebSocket(`ws://localhost:${PORT}/ws`);
      await new Promise<void>((resolve) => {
        wsMissing.on("unexpected-response", (_req, res) => {
          assert(res.statusCode === 400, "Missing documentId query parameter returns 400 Bad Request");
          resolve();
        });
        wsMissing.on("error", () => resolve());
      });

      // Malformed documentId format
      const wsInvalid = new WebSocket(`ws://localhost:${PORT}/ws?documentId=invalid-doc-id`);
      await new Promise<void>((resolve) => {
        wsInvalid.on("unexpected-response", (_req, res) => {
          assert(res.statusCode === 400, "Invalid documentId format returns 400 Bad Request");
          resolve();
        });
        wsInvalid.on("error", () => resolve());
      });

      // Non-existent documentId
      const wsNotFound = new WebSocket(`ws://localhost:${PORT}/ws?documentId=${NON_EXISTENT_DOC_ID}`);
      await new Promise<void>((resolve) => {
        wsNotFound.on("unexpected-response", (_req, res) => {
          assert(res.statusCode === 404, "Non-existent documentId returns 404 Not Found");
          resolve();
        });
        wsNotFound.on("error", () => resolve());
      });
    }

    // --- 5. TWO-CLIENT WEBSOCKET REAL-TIME SYNCHRONIZATION ---
    console.log("\n--- 5. TWO-CLIENT WEBSOCKET REAL-TIME SYNCHRONIZATION ---");
    {
      // Client A connects
      const clientA_yDoc = new Y.Doc();
      const wsA = new WebSocket(`ws://localhost:${PORT}/ws?documentId=${TEST_DOC_ID}`);

      const clientA_receivedMsgs: Uint8Array[] = [];

      wsA.on("message", (data: Buffer) => {
        const u8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        clientA_receivedMsgs.push(u8);
        handleYjsMessage(clientA_yDoc, u8);
      });

      await new Promise<void>((resolve) => wsA.on("open", resolve));
      assert(wsA.readyState === WebSocket.OPEN, "Client A connected successfully to WebSocket");

      // Give server time to send initial SyncStep1
      await new Promise((r) => setTimeout(r, 100));
      assert(roomManager.getRoom(TEST_DOC_ID) !== undefined, "Room Manager created DocumentRoom for TEST_DOC_ID");
      assert(roomManager.getRoom(TEST_DOC_ID)?.clientCount === 1, "Room client count is 1");

      // Send Client A's SyncStep1 to complete handshake
      wsA.send(createSyncStep1Message(clientA_yDoc));
      await new Promise((r) => setTimeout(r, 100));

      const blocksA_init = yDocToAST(clientA_yDoc);
      assert(blocksA_init.length === 4, "Client A received initial document state (4 blocks)");
      assert(blocksA_init[0].id === "b-head-1", "Client A heading block matches server initial AST");

      // Client B connects to SAME document
      const clientB_yDoc = new Y.Doc();
      const wsB = new WebSocket(`ws://localhost:${PORT}/ws?documentId=${TEST_DOC_ID}`);

      const clientB_receivedMsgs: Uint8Array[] = [];

      wsB.on("message", (data: Buffer) => {
        const u8 = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        clientB_receivedMsgs.push(u8);
        handleYjsMessage(clientB_yDoc, u8);
      });

      await new Promise<void>((resolve) => wsB.on("open", resolve));
      assert(wsB.readyState === WebSocket.OPEN, "Client B connected successfully to same room");
      assert(roomManager.getRoom(TEST_DOC_ID)?.clientCount === 2, "Room client count updated to 2");

      // Send Client B's SyncStep1 to complete handshake
      wsB.send(createSyncStep1Message(clientB_yDoc));
      await new Promise((r) => setTimeout(r, 100));

      const blocksB_init = yDocToAST(clientB_yDoc);
      assert(blocksB_init.length === 4, "Client B synchronized initial document state (4 blocks)");

      // --- Client A sends an update ---
      console.log("\n--- 6. REAL-TIME BROADCAST & CONCURRENCY EDITING ---");
      {
        const initialMsgCountB = clientB_receivedMsgs.length;

        // Client A modifies heading block text in its Y.Doc
        const yBlocksA = clientA_yDoc.getArray<Y.Map<unknown>>("blocks");
        const headingMapA = yBlocksA.get(0);
        const headingDataA = headingMapA.get("data") as Y.Map<unknown>;

        let updateFromA: Uint8Array | null = null;
        clientA_yDoc.once("update", (update: Uint8Array) => {
          updateFromA = update;
        });

        headingDataA.set("text", "Updated Heading by Client A");

        assert(updateFromA !== null, "Client A generated incremental Yjs update");

        // Client A sends update to WebSocket
        wsA.send(createUpdateMessage(updateFromA!));

        // Give WebSocket time to broadcast to Client B
        await new Promise((r) => setTimeout(r, 150));

        assert(clientB_receivedMsgs.length > initialMsgCountB, "Client B received broadcast update from Client A");

        const blocksB_updated = yDocToAST(clientB_yDoc);
        assert(
          (blocksB_updated[0].data as { text: string }).text === "Updated Heading by Client A",
          "Client B Y.Doc updated to 'Updated Heading by Client A'"
        );
      }

      // --- Client B sends an update ---
      {
        const initialMsgCountA = clientA_receivedMsgs.length;

        // Client B inserts a new paragraph block at index 1
        const yBlocksB = clientB_yDoc.getArray<Y.Map<unknown>>("blocks");

        let updateFromB: Uint8Array | null = null;
        clientB_yDoc.once("update", (update: Uint8Array) => {
          updateFromB = update;
        });

        const newBlockMap = new Y.Map<unknown>();
        newBlockMap.set("id", "b-para-2");
        newBlockMap.set("type", "paragraph");
        const newBlockData = new Y.Map<unknown>();
        newBlockData.set("text", "Inserted paragraph by Client B");
        newBlockMap.set("data", newBlockData);

        clientB_yDoc.transact(() => {
          yBlocksB.insert(1, [newBlockMap]);
        });

        assert(updateFromB !== null, "Client B generated incremental Yjs update");

        // Client B sends update to WebSocket
        wsB.send(createUpdateMessage(updateFromB!));

        // Give WebSocket time to broadcast to Client A
        await new Promise((r) => setTimeout(r, 150));

        assert(clientA_receivedMsgs.length > initialMsgCountA, "Client A received broadcast update from Client B");

        const blocksA_updated = yDocToAST(clientA_yDoc);
        assert(blocksA_updated.length === 5, "Client A Y.Doc block count updated to 5");
        assert(blocksA_updated[1].id === "b-para-2", "Client A received new block 'b-para-2' at index 1");
        assert((blocksA_updated[1].data as { text: string }).text === "Inserted paragraph by Client B", "Client A new block text matches Client B insert");
      }

      // --- CRDT State Convergence Check ---
      console.log("\n--- 7. CRDT STATE CONVERGENCE & ROOM CLEANUP ---");
      {
        const serverRoom = roomManager.getRoom(TEST_DOC_ID);
        assert(serverRoom !== undefined, "Server room exists");

        const serverBlocks = yDocToAST(serverRoom!.yDoc);
        const clientABlocks = yDocToAST(clientA_yDoc);
        const clientBBlocks = yDocToAST(clientB_yDoc);

        assert(JSON.stringify(clientABlocks) === JSON.stringify(clientBBlocks), "Client A and Client B AST states converged 100%");
        assert(JSON.stringify(serverBlocks) === JSON.stringify(clientABlocks), "Server Y.Doc state converges 100% with clients");

        // Client A disconnects
        wsA.close();
        await new Promise((r) => setTimeout(r, 100));
        assert(roomManager.getRoom(TEST_DOC_ID)?.clientCount === 1, "Room client count drops to 1 after Client A disconnect");

        // Client B disconnects -> room destruction & persistence flush
        wsB.close();
        await new Promise((r) => setTimeout(r, 300));
        assert(roomManager.getRoom(TEST_DOC_ID) === undefined, "Room cleaned up after final client disconnect");
      }
    }

    // --- 8. MONGODB PERSISTENCE & REST / EXPORT COMPATIBILITY ---
    console.log("\n--- 8. MONGODB PERSISTENCE & REST / EXPORT COMPATIBILITY ---");
    {
      const updatedDoc = await documentService.getById(TEST_DOC_ID);
      assert(updatedDoc !== null, "Persisted document retrieved via documentService");
      assert(updatedDoc!.blocks.length === 5, "Persisted document blocks count is 5");
      assert((updatedDoc!.blocks[0].data as { text: string }).text === "Updated Heading by Client A", "Persisted document heading updated");
      assert(updatedDoc!.blocks[1].id === "b-para-2", "Persisted document contains Client B inserted paragraph");
      assert(updatedDoc!.version === 2, "Persisted document version incremented to 2");

      // HTML Export Verification
      const htmlExport = await exportService.exportDocument(updatedDoc!.blocks, updatedDoc!.title, "html");
      assert(htmlExport.contentType === "text/html", "HTML export content type is text/html");
      assert(String(htmlExport.content).includes("Updated Heading by Client A"), "HTML export contains updated heading text");
      assert(String(htmlExport.content).includes("Inserted paragraph by Client B"), "HTML export contains Client B paragraph text");

      // PDF Export Verification
      const pdfExport = await exportService.exportDocument(updatedDoc!.blocks, updatedDoc!.title, "pdf");
      assert(pdfExport.contentType === "application/pdf", "PDF export content type is application/pdf");
      assert(Buffer.isBuffer(pdfExport.content), "PDF export content is a Buffer");
      assert((pdfExport.content as Buffer).toString("utf8", 0, 5) === "%PDF-", "PDF Buffer starts with %PDF- header");
    }

  } finally {
    // Restore original documentService methods & close servers
    documentService.getById = originalGetById;
    documentService.update = originalUpdate;

    await collaborationServer.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  console.log("\n==================================================");
  console.log(`REAL-TIME TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runRealtimeTests().catch((err) => {
  console.error("Realtime test runner failed:", err);
  process.exit(1);
});
