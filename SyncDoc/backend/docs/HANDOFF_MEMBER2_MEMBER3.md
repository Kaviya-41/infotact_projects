# Member 1 Handoff Notes for Member 2 & Member 3

This document serves as the official handoff reference from **Member 1 (Backend + AST Engine)** to **Member 2 (Yjs / WebSocket Real-time Synchronization)** and **Member 3 (React Block Editor UI)**.

---

## 1. Document API & Document ID

- **Base Endpoint**: `/api/documents`
- **Document ID Format**: Server-assigned 24-character hexadecimal MongoDB ObjectId string (`_id`).
  - Example: `"64f9bf410e340e4f20bfac8a"`
- **Available Operations**:
  - `POST /api/documents`: Create a document (`{ title, ownerId, blocks }`). Returns `201 Created`.
  - `GET /api/documents`: List documents with pagination (`?ownerId=...&page=1&limit=20`). Returns `200 OK`.
  - `GET /api/documents/:id`: Fetch full document AST by ID. Returns `200 OK`.
  - `PUT /api/documents/:id`: Save document updates (`{ title, blocks }`). Returns `200 OK`.
  - `POST /api/documents/:id/changes`: Apply atomic block AST change operation. Returns `200 OK`.
  - `DELETE /api/documents/:id`: Delete document by ID. Returns `200 OK`.

---

## 2. AST Structure & Supported Block Types

Every document stored and returned by the backend has an array of blocks (`blocks: AstBlock[]`). Every block has a unique client- or server-assigned `id` string that remains stable across edits and reordering.

### Block Type Contracts

#### 1. Heading Block (`"heading"`)
```json
{
  "id": "b-head-1",
  "type": "heading",
  "data": {
    "text": "SyncDoc Architecture"
  }
}
```
- `data.text` (string): Required. Non-empty trimmed text.

#### 2. Paragraph Block (`"paragraph"`)
```json
{
  "id": "b-para-1",
  "type": "paragraph",
  "data": {
    "text": "A real-time collaborative document engine."
  }
}
```
- `data.text` (string): Required. Can be empty string `""`.

#### 3. Code Block (`"code"`)
```json
{
  "id": "b-code-1",
  "type": "code",
  "data": {
    "language": "typescript",
    "code": "console.log('Hello SyncDoc');"
  }
}
```
- `data.language` (string): Required non-empty string tag (e.g., `"typescript"`, `"javascript"`, `"python"`).
- `data.code` (string): Required string.

#### 4. List Block (`"list"`)
```json
{
  "id": "b-list-1",
  "type": "list",
  "data": {
    "ordered": false,
    "items": [
      "Item 1",
      "Item 2"
    ]
  }
}
```
- `data.ordered` (boolean): Required explicit boolean (`true` for ordered `<ol>`, `false` for unordered `<ul>`).
- `data.items` (array of strings): Required non-empty array (`length >= 1`) containing non-empty strings.

---

## 3. AST Change Operations API

**Endpoint**: `POST /api/documents/:id/changes`

Used to apply fine-grained atomic block operations to a document AST without resending the entire blocks array.

### Supported Change Operations

#### `CREATE_BLOCK`
Inserts a new block at `payload.targetIndex` (or appends to end if omitted).
```json
{
  "blockId": "b-new-10",
  "operation": "CREATE_BLOCK",
  "payload": {
    "type": "paragraph",
    "data": { "text": "Newly inserted paragraph" },
    "targetIndex": 1
  }
}
```

#### `UPDATE_BLOCK`
Modifies content or properties of an existing block matching `blockId`.
```json
{
  "blockId": "b-para-1",
  "operation": "UPDATE_BLOCK",
  "payload": {
    "data": { "text": "Updated paragraph text" }
  }
}
```

#### `DELETE_BLOCK`
Removes the block matching `blockId` from the document AST.
```json
{
  "blockId": "b-para-1",
  "operation": "DELETE_BLOCK"
}
```

#### `MOVE_BLOCK`
Moves an existing block matching `blockId` to a new 0-based index (`payload.targetIndex`).
```json
{
  "blockId": "b-para-1",
  "operation": "MOVE_BLOCK",
  "payload": {
    "targetIndex": 0
  }
}
```

---

## 4. Version Field Semantics

- **Initial State**: Every created document starts at `version: 1`.
- **Auto-Increment**:
  - `PUT /api/documents/:id` increments `version` by `+1` on successful save.
  - `POST /api/documents/:id/changes` increments `version` by `+1` on successful save.
- **Persistence Safety**: Failed operations or validation errors do NOT increment document version.

---

## 5. Export API Usage

- **HTML Export**: `GET /api/documents/:id/export?format=html`
  - Returns: `200 OK` with standalone HTML5 document (`Content-Type: text/html`).
- **PDF Export**: `GET /api/documents/:id/export?format=pdf`
  - Returns: `200 OK` with binary PDF Buffer download (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="<sanitized_title>.pdf"`).
- **Download Param**: Pass `&download=true` to force attachment disposition on HTML export.

---

## 6. Validation Behavior & Standard Error Responses

The backend enforces strict schema validation and security checks:

### Validation Rules
1. **Immutable Fields**: Rejects requests attempting to modify `_id`, `ownerId`, or `version` via `PUT`.
2. **Security Checks**: Rejects payload keys starting with `$` (MongoDB operator injection) or containing `__proto__`, `constructor`, `prototype` (prototype pollution).
3. **Unique Block IDs**: Rejects documents or changes containing duplicate block IDs.

### Standardized Error Format
All HTTP error responses return standard JSON:

```json
{
  "success": false,
  "message": "Invalid AST document structure",
  "errors": [
    {
      "path": "blocks[0].data.text",
      "message": "Heading block text is required and cannot be empty"
    }
  ]
}
```

### HTTP Status Codes Summary
- `200 OK`: Successful GET, PUT, POST change, or DELETE.
- `201 Created`: Successful POST document creation.
- `400 Bad Request`: Validation failure, invalid ObjectId format, missing/unsupported query format.
- `404 Not Found`: Target document or block does not exist.
- `500 Internal Server Error`: Unhandled server exception.

---

## 7. Integration Boundaries

- **Member 1 (Backend + AST Engine)**: Fully implements document CRUD, AST change operations, validation, Mongoose models, auto-versioning, HTML & PDF exports, and API security.
- **Member 2 (Yjs / WebSocket)**: Member 2 handles Yjs document synchronization (`Y.Doc` -> `_id`, `Y.Array` -> `blocks`), CRDT updates, and WebSocket broadcasting. The Member 1 backend is ready for Yjs persistence syncs.
- **Member 3 (React UI)**: Member 3 builds the front-end block editor UI and connects component rendering to the backend AST schema and REST endpoints.
