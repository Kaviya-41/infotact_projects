# SyncDoc AST Contract — Backend API Reference

This document defines the complete AST contract for **Member 2 (Yjs / CRDT)** and **Member 3 (React Block Editor)** to integrate with the **Member 1 Backend + AST Engine**.

---

## 1. Stable Identifiers

Every document and block has a stable identity that must be preserved across all operations.

| Identifier | Type | Source | Mutability |
|------------|------|--------|------------|
| `_id` | `string` (MongoDB ObjectId) | Server-generated | Immutable after creation |
| `block.id` | `string` | Client-provided | Immutable after creation |
| `version` | `number` (integer) | Server-managed | Auto-incremented on update |

### Key Rules:
- **Block IDs are never regenerated** — updating content does not change `block.id`
- **Block order is document order** — the array index of `blocks[]` is the render order
- **Duplicate block IDs are rejected** — the backend validates uniqueness at creation and update
- **Version increments on every successful update** — failed updates do not change version

---

## 2. Document Structure

```json
{
  "_id": "64f9bf410e340e4f20bfac8a",
  "title": "Aircraft Technical Specification",
  "ownerId": "user001",
  "version": 1,
  "blocks": [
    {
      "id": "b1",
      "type": "heading",
      "data": { "text": "Introduction" }
    },
    {
      "id": "b2",
      "type": "paragraph",
      "data": { "text": "Aircraft design requires multiple engineering disciplines." }
    },
    {
      "id": "b3",
      "type": "code",
      "data": { "language": "python", "code": "print('SyncDoc')" }
    },
    {
      "id": "b4",
      "type": "list",
      "data": { "ordered": false, "items": ["Aerodynamics", "Structures", "Propulsion"] }
    }
  ],
  "createdAt": "2026-08-26T10:00:00.000Z",
  "updatedAt": "2026-08-26T10:00:00.000Z"
}
```

---

## 3. Block Type Reference

| Block Type | Data Interface | Required Fields |
|------------|---------------|-----------------|
| `"heading"` | `{ text: string }` | `text` (non-empty) |
| `"paragraph"` | `{ text: string }` | `text` (can be empty) |
| `"code"` | `{ language: string, code: string }` | `language` (non-empty), `code` |
| `"list"` | `{ ordered: boolean, items: string[] }` | `ordered`, `items` (non-empty array of non-empty strings) |

---

## 4. REST API Endpoints

### POST /api/documents
Create a new document.

**Request:**
```json
{
  "title": "My Document",
  "ownerId": "user001",
  "blocks": [ ... ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Document created successfully",
  "data": { "_id": "...", "title": "...", "ownerId": "...", "version": 1, "blocks": [...] }
}
```

### GET /api/documents/:id
Retrieve a document by ID. Returns the full AST.

**Response (200):**
```json
{
  "success": true,
  "message": "Document retrieved successfully",
  "data": { "_id": "...", "title": "...", "ownerId": "...", "version": 1, "blocks": [...] }
}
```

### GET /api/documents
List documents with pagination.

**Query Parameters:** `ownerId`, `page`, `limit`

**Response (200):**
```json
{
  "success": true,
  "message": "Documents retrieved successfully",
  "data": [ ... ],
  "pagination": { "total": 10, "page": 1, "limit": 20, "totalPages": 1 }
}
```

### PUT /api/documents/:id
Update a document. Only `title` and `blocks` may be updated.

**Request:**
```json
{
  "title": "Updated Title",
  "blocks": [ ... ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": { "_id": "...", "title": "Updated Title", "version": 2, "blocks": [...] }
}
```

> **Note:** `version` auto-increments on every successful update.  
> `_id`, `ownerId`, `version`, `createdAt`, `updatedAt` cannot be set via PUT.

### DELETE /api/documents/:id
Delete a document.

**Response (200):**
```json
{ "success": true, "message": "Document deleted successfully" }
```

---

## 5. Error Response Contract

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Invalid AST document structure",
  "errors": [
    { "path": "blocks[0].data.text", "message": "Heading text is required" }
  ]
}
```

| HTTP Status | Meaning |
|-------------|---------|
| `400` | Validation failure, invalid ID, or rejected field modification |
| `404` | Document not found |
| `500` | Internal server error (no stack traces exposed) |

---

## 6. Processing Pipeline

Every write operation follows this pipeline:

```
HTTP Request
    ↓
Route → Middleware (validateCreateDocument / validateUpdateDocument)
    ↓
normalizeAST()          ← trims metadata, preserves content & IDs
    ↓
validateDocumentAST()   ← validates structure, types, uniqueness
    ↓
Controller → Service
    ↓
Mongoose pre-save hook  ← normalize + validate again (defense-in-depth)
    ↓
MongoDB
```

---

## 7. Member 2 Contract — Real-time Synchronization (Yjs / CRDT)

### Targeting Blocks
Edits target specific blocks by stable `id`:
```javascript
const block = document.blocks.find(b => b.id === targetBlockId);
```

### Conceptual Future Operation Format
```json
{
  "documentId": "64f9bf410e340e4f20bfac8a",
  "blockId": "b2",
  "operation": "UPDATE_BLOCK",
  "payload": {
    "text": "Updated paragraph text"
  }
}
```

### CRDT Binding Guidance
| SyncDoc Concept | Yjs Type |
|-----------------|----------|
| Document (`_id`) | `Y.Doc` |
| `blocks` array | `Y.Array` |
| Block `data.text` / `data.code` | `Y.Text` |
| Block `data` (structured) | `Y.Map` |
| `data.items` (list) | `Y.Array<string>` |

> **Note:** Yjs/WebSocket integration is NOT implemented by Member 1.  
> The backend provides REST persistence with stable identifiers that Yjs can reference.

---

## 8. Member 3 Contract — React Block Editor UI

### Block Rendering Matrix

```
GET /api/documents/:id → response.data.blocks.map(block => {
  switch (block.type) {
    case "heading":   → <HeadingBlock   id={block.id} text={block.data.text} />
    case "paragraph": → <ParagraphBlock id={block.id} text={block.data.text} />
    case "code":      → <CodeBlock      id={block.id} language={block.data.language} code={block.data.code} />
    case "list":      → <ListBlock      id={block.id} ordered={block.data.ordered} items={block.data.items} />
  }
})
```

### Frontend Consumption Pattern
```typescript
// Fetch document
const response = await fetch(`/api/documents/${documentId}`);
const { data } = await response.json();

// data = {
//   _id: string,
//   title: string,
//   ownerId: string,
//   version: number,
//   blocks: Array<{
//     id: string,
//     type: "heading" | "paragraph" | "code" | "list",
//     data: HeadingData | ParagraphData | CodeData | ListData
//   }>
// }

// Save changes
await fetch(`/api/documents/${documentId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: data.title, blocks: data.blocks })
});
```

---

## 9. Normalization Guarantees

The backend normalizes input before validation:

| What | Action |
|------|--------|
| `title`, `ownerId` | Trimmed |
| `block.id`, `block.type` | Trimmed |
| `code.data.language` | Trimmed |
| `paragraph.data.text` | **NOT trimmed** (content) |
| `code.data.code` | **NOT trimmed** (content) |
| `list.data.items` | **NOT modified** |
| Block order | **Preserved exactly** |
| Block IDs | **Never regenerated** |

---

## 10. Validation Rules Summary

| Rule | Behavior |
|------|----------|
| Missing title | 400 rejection |
| Missing ownerId | 400 rejection |
| Missing blocks | 400 rejection |
| Invalid block type | 400 rejection |
| Missing block ID | 400 rejection |
| Duplicate block ID | 400 rejection |
| Invalid block data | 400 rejection (type-specific messages) |
| Invalid nested children | 400 rejection (recursive) |

---

## 11. AST Change Contract (Week 2 Day 4)

SyncDoc provides a strongly-typed AST change model (`ASTChange`) for block-level updates. This contract is consumed by Member 2 (Real-time Sync) and Member 3 (Editor UI) to describe deterministic document modifications.

### Change Structure
```typescript
interface ASTChange {
  documentId: string;       // ID of target document
  blockId: string;          // Stable ID of target block
  operation: ASTOperation;  // "CREATE_BLOCK" | "UPDATE_BLOCK" | "DELETE_BLOCK" | "MOVE_BLOCK"
  version?: number;         // Document version / state version
  payload?: ASTChangePayload;
}
```

### Supported Operations & Schemas

#### 1. CREATE_BLOCK
Inserts a new block with a stable ID into the document.
```json
{
  "documentId": "doc-001",
  "blockId": "b3",
  "operation": "CREATE_BLOCK",
  "version": 1,
  "payload": {
    "type": "paragraph",
    "data": { "text": "New paragraph content" },
    "targetIndex": 2
  }
}
```
*Rules:*
- `change.blockId` MUST be preserved as the new block's ID.
- `payload.type` and `payload.data` are required and validated.
- `payload.targetIndex` is optional (appends to end if omitted).

#### 2. UPDATE_BLOCK
Updates the content/data of an existing block by stable `blockId`.
```json
{
  "documentId": "doc-001",
  "blockId": "b1",
  "operation": "UPDATE_BLOCK",
  "version": 2,
  "payload": {
    "text": "Updated paragraph content"
  }
}
```
*Rules:*
- Targets the block identified by `blockId`.
- Preserves the existing block `id` and array position.
- Only modifies specified fields inside block `data`.

#### 3. DELETE_BLOCK
Deletes exactly one block identified by `blockId`.
```json
{
  "documentId": "doc-001",
  "blockId": "b2",
  "operation": "DELETE_BLOCK",
  "version": 2
}
```
*Rules:*
- Removes the matching block from the document.
- Payload may be omitted or empty.
- Preserves array order of remaining blocks.

#### 4. MOVE_BLOCK
Reorders an existing block to a specified array index.
```json
{
  "documentId": "doc-001",
  "blockId": "b3",
  "operation": "MOVE_BLOCK",
  "version": 3,
  "payload": {
    "targetIndex": 0
  }
}
```
*Rules:*
- Requires `payload.targetIndex` (valid integer within bounds `0..blocks.length - 1`).
- `MOVE_BLOCK` is the ONLY operation that intentionally reorders blocks.

---

## 12. Member 2 Integration Contract

Member 1 provides the core AST change specification, validation (`validateASTChange()`), and in-memory application utility (`applyASTChange()`).

### Division of Ownership:
- **Member 1 (Backend + AST):** Provides AST change types, validation, stable ID preservation, AST normalization, result validation, and REST persistence.
- **Member 2 (Sync / CRDT):** Maps collaborative Yjs / CRDT updates into AST changes and handles:
  - Network transport
  - WebSocket / Socket.io connections
  - Yjs shared data structures
  - Conflict resolution algorithms
  - Presence and cursor synchronization
  - Distributed locking (if any)

> **Integration Rule:** Final conflict resolution is delegated to Member 2's CRDT layer. Member 1 provides pure deterministic AST change validation and application (`validateASTChange` & `applyASTChange`).

### Application Pipeline:
```
Yjs / WebSocket Event
         │
         ▼
  Map to ASTChange
         │
         ▼
 validateASTChange(change, doc)
         │
         ▼
  applyASTChange(doc, change)
         │
         ▼
  validateDocumentAST()
         │
         ▼
    Updated AST
```

---

## 13. Member 3 Integration Contract

Member 3 (React Block Editor) maps editor UI actions directly to AST Change operations:

| Editor Action | AST Operation | Contract Mapping |
|---------------|---------------|------------------|
| **Insert Block** | `CREATE_BLOCK` | Client generates stable `blockId`, specifies `type` and initial `data` |
| **Edit Block Content** | `UPDATE_BLOCK` | Targets existing `blockId`, sends updated text / code / list items in `payload` |
| **Delete Block** | `DELETE_BLOCK` | Targets existing `blockId` to remove |
| **Drag & Drop / Reorder** | `MOVE_BLOCK` | Targets existing `blockId`, specifies new `targetIndex` in `payload` |

---

---

## 15. Safe Change Pipeline Architecture (Week 2 Day 5)

Every incoming AST change is validated, checked for identity & block constraints, applied in-memory, normalized, and strictly validated before persistence:

```
                CLIENT
                   │
                   ▼
             AST CHANGE
                   │
                   ▼
         validateASTChange()
                   │
                   ▼
         documentId check
                   │
                   ▼
           blockId check
                   │
                   ▼
          applyASTChange()
                   │
                   ▼
         validateDocumentAST()
                   │
             ┌─────┴─────┐
             ▼           ▼
           FAIL         PASS
             │           │
             ▼           ▼
           Reject     Mongoose
                         │
                         ▼
                      MongoDB
```

### Future Collaboration Integration Flow:
```
Clients
  │
  ▼
Yjs / CRDT
  │
  ▼
AST Change
  │
  ▼
Member 1 AST Layer
  │
  ▼
Validated AST
  │
  ▼
MongoDB
```

---

## 16. Detailed Integration Boundaries

### Member 1 Ownership:
- Deterministic AST types & schemas
- AST structural validation (`validateDocumentAST()`)
- AST normalization (`normalizeAST()`)
- AST change validation (`validateASTChange()`)
- In-memory AST change application (`applyASTChange()`)
- Stable block ID and document ID preservation
- Persistence protection (invalid AST never written to MongoDB)

### Member 2 Ownership (Sync & CRDT Layer):
- Yjs state vectors and CRDT data bindings
- Network transport (WebSocket / Socket.io)
- Client-to-client real-time synchronization
- Distributed conflict resolution algorithms
- Presence and cursor tracking

### Member 3 Ownership (React Block Editor):
- UI component rendering mapped to AST block types
- Dispatching AST operations on user editing events
- Preserving stable block IDs across UI lifecycle

---

## 17. Markdown → AST Review Artifact

Example mapping from raw Markdown content to SyncDoc AST structure:

### Input Markdown:
```markdown
# Introduction

SyncDoc is a collaborative document engine.

```python
print("SyncDoc")
```

* AST
* MongoDB
* CRDT
```

### Resulting AST JSON:
```json
{
  "title": "Document Title",
  "ownerId": "user001",
  "version": 1,
  "blocks": [
    {
      "id": "b1",
      "type": "heading",
      "data": { "text": "Introduction" }
    },
    {
      "id": "b2",
      "type": "paragraph",
      "data": { "text": "SyncDoc is a collaborative document engine." }
    },
    {
      "id": "b3",
      "type": "code",
      "data": { "language": "python", "code": "print(\"SyncDoc\")" }
    },
    {
      "id": "b4",
      "type": "list",
      "data": { "ordered": false, "items": ["AST", "MongoDB", "CRDT"] }
    }
  ]
}
```

---

## 18. Review Demonstration AST Model

Review document used for verification:

- **Title**: `Aircraft Technical Specification`
- **AST Blocks**:
  1. `heading` (`b1`): `"Introduction"`
  2. `paragraph` (`b2`): `"Aircraft design requires multiple engineering disciplines."`
  3. `code` (`b3`): `language: "python"`, `code: "print(\"SyncDoc\")"`
  4. `list` (`b4`): `ordered: false`, `items: ["Aerodynamics", "Structures", "Propulsion"]`


