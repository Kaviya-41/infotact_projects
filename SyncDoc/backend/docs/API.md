# SyncDoc Backend API Documentation & Integration Reference

This document serves as the official API contract and integration reference for **Member 2 (Yjs / Real-time Sync)** and **Member 3 (React Block Editor UI)** to interact with the **Member 1 Backend + AST Engine**.

---

## 1. System Overview

The SyncDoc backend is built with Express.js, TypeScript, and MongoDB/Mongoose. It manages structured hierarchical document ASTs (Abstract Syntax Trees), enforces block validation and normalization, handles atomic block-level AST change operations, and provides HTML & PDF export pipelines.

---

## 2. API Endpoints Reference

### 1. Health Check
- **HTTP Method**: `GET`
- **URL**: `/api/health`
- **Purpose**: Verify backend API service health and operational status.
- **Request Body**: None
- **Query Parameters**: None
- **Path Parameters**: None
- **Success Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "SyncDoc API is running"
  }
  ```
- **Error Response**: N/A
- **Example Request**:
  `GET /api/health`
- **Example Response**:
  ```json
  {
    "success": true,
    "message": "SyncDoc API is running"
  }
  ```

---

### 2. Create Document
- **HTTP Method**: `POST`
- **URL**: `/api/documents`
- **Purpose**: Create a new document with an initial AST block array.
- **Request Body**: `CreateDocumentRequest` (JSON)
  - `title` (string, required): Document title (trimmed, non-empty).
  - `ownerId` (string, required): Unique identifier of document owner (trimmed, non-empty).
  - `blocks` (array of AstBlock, optional): Initial array of AST blocks (defaults to `[]` if omitted).
- **Query Parameters**: None
- **Path Parameters**: None
- **Success Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Document created successfully",
    "data": {
      "_id": "64f9bf410e340e4f20bfac8a",
      "title": "SyncDoc Architecture",
      "ownerId": "user_456",
      "version": 1,
      "blocks": [
        {
          "id": "b-1",
          "type": "heading",
          "data": { "text": "SyncDoc Specification" }
        }
      ],
      "createdAt": "2026-09-12T20:15:00.000Z",
      "updatedAt": "2026-09-12T20:15:00.000Z"
    }
  }
  ```
- **Error Response**: `400 Bad Request`
  ```json
  {
    "success": false,
    "message": "Invalid AST document structure",
    "errors": [
      { "path": "title", "message": "Document title is required and cannot be empty" }
    ]
  }
  ```
- **Example Request**:
  `POST /api/documents`
  ```json
  {
    "title": "SyncDoc Architecture",
    "ownerId": "user_456",
    "blocks": [
      {
        "id": "b-1",
        "type": "heading",
        "data": { "text": "SyncDoc Specification" }
      },
      {
        "id": "b-2",
        "type": "paragraph",
        "data": { "text": "A real-time collaborative document engine." }
      }
    ]
  }
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "message": "Document created successfully",
    "data": {
      "_id": "64f9bf410e340e4f20bfac8a",
      "title": "SyncDoc Architecture",
      "ownerId": "user_456",
      "version": 1,
      "blocks": [
        {
          "id": "b-1",
          "type": "heading",
          "data": { "text": "SyncDoc Specification" }
        },
        {
          "id": "b-2",
          "type": "paragraph",
          "data": { "text": "A real-time collaborative document engine." }
        }
      ],
      "createdAt": "2026-09-12T20:15:00.000Z",
      "updatedAt": "2026-09-12T20:15:00.000Z"
    }
  }
  ```

---

### 3. List Documents
- **HTTP Method**: `GET`
- **URL**: `/api/documents`
- **Purpose**: Retrieve a paginated list of documents, optionally filtered by `ownerId`.
- **Request Body**: None
- **Query Parameters**:
  - `ownerId` (string, optional): Filter documents belonging to a specific owner.
  - `page` (number, optional): Page number (1-based integer, default: 1).
  - `limit` (number, optional): Items per page (integer 1..100, default: 20).
- **Path Parameters**: None
- **Success Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Documents retrieved successfully",
    "data": [
      {
        "_id": "64f9bf410e340e4f20bfac8a",
        "title": "SyncDoc Architecture",
        "ownerId": "user_456",
        "version": 1,
        "blocks": [ ... ],
        "createdAt": "2026-09-12T20:15:00.000Z",
        "updatedAt": "2026-09-12T20:15:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
  ```
- **Error Response**: `500 Internal Server Error`
- **Example Request**:
  `GET /api/documents?ownerId=user_456&page=1&limit=10`
- **Example Response**:
  ```json
  {
    "success": true,
    "message": "Documents retrieved successfully",
    "data": [
      {
        "_id": "64f9bf410e340e4f20bfac8a",
        "title": "SyncDoc Architecture",
        "ownerId": "user_456",
        "version": 1,
        "blocks": [
          { "id": "b-1", "type": "heading", "data": { "text": "SyncDoc Specification" } }
        ],
        "createdAt": "2026-09-12T20:15:00.000Z",
        "updatedAt": "2026-09-12T20:15:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

---

### 4. Get Document by ID
- **HTTP Method**: `GET`
- **URL**: `/api/documents/:id`
- **Purpose**: Fetch a single document's metadata and full AST block hierarchy by its 24-hex ObjectId.
- **Request Body**: None
- **Query Parameters**: None
- **Path Parameters**:
  - `id` (string, required): 24-character hexadecimal MongoDB ObjectId string.
- **Success Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Document retrieved successfully",
    "data": {
      "_id": "64f9bf410e340e4f20bfac8a",
      "title": "SyncDoc Architecture",
      "ownerId": "user_456",
      "version": 1,
      "blocks": [ ... ],
      "createdAt": "2026-09-12T20:15:00.000Z",
      "updatedAt": "2026-09-12T20:15:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (Invalid ObjectId format):
    ```json
    {
      "success": false,
      "message": "Invalid document ID"
    }
    ```
  - `404 Not Found` (Document does not exist):
    ```json
    {
      "success": false,
      "message": "Document not found"
    }
    ```
- **Example Request**:
  `GET /api/documents/64f9bf410e340e4f20bfac8a`
- **Example Response**:
  ```json
  {
    "success": true,
    "message": "Document retrieved successfully",
    "data": {
      "_id": "64f9bf410e340e4f20bfac8a",
      "title": "SyncDoc Architecture",
      "ownerId": "user_456",
      "version": 1,
      "blocks": [
        { "id": "b-1", "type": "heading", "data": { "text": "SyncDoc Specification" } }
      ],
      "createdAt": "2026-09-12T20:15:00.000Z",
      "updatedAt": "2026-09-12T20:15:00.000Z"
    }
  }
  ```

---

### 5. Update Document
- **HTTP Method**: `PUT`
- **URL**: `/api/documents/:id`
- **Purpose**: Update document `title` or replace full `blocks` array. Automatically increments document `version`.
- **Request Body**: `UpdateDocumentRequest` (JSON)
  - `title` (string, optional): Updated document title.
  - `blocks` (array of AstBlock, optional): Complete updated AST blocks array.
  - *Note*: Immutable fields (`_id`, `ownerId`, `version`, `createdAt`, `updatedAt`, `$set`, `$inc`) are strictly rejected with HTTP 400.
- **Query Parameters**: None
- **Path Parameters**:
  - `id` (string, required): MongoDB ObjectId string.
- **Success Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Document updated successfully",
    "data": {
      "_id": "64f9bf410e340e4f20bfac8a",
      "title": "SyncDoc Architecture (Updated)",
      "ownerId": "user_456",
      "version": 2,
      "blocks": [ ... ],
      "createdAt": "2026-09-12T20:15:00.000Z",
      "updatedAt": "2026-09-12T20:25:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (Immutable field error or AST validation error):
    ```json
    {
      "success": false,
      "message": "Cannot modify immutable field 'ownerId'"
    }
    ```
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Document not found"
    }
    ```
- **Example Request**:
  `PUT /api/documents/64f9bf410e340e4f20bfac8a`
  ```json
  {
    "title": "SyncDoc Architecture (Updated)"
  }
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "message": "Document updated successfully",
    "data": {
      "_id": "64f9bf410e340e4f20bfac8a",
      "title": "SyncDoc Architecture (Updated)",
      "ownerId": "user_456",
      "version": 2,
      "blocks": [
        { "id": "b-1", "type": "heading", "data": { "text": "SyncDoc Specification" } }
      ],
      "createdAt": "2026-09-12T20:15:00.000Z",
      "updatedAt": "2026-09-12T20:25:00.000Z"
    }
  }
  ```

---

### 6. Apply AST Change Operation
- **HTTP Method**: `POST`
- **URL**: `/api/documents/:id/changes`
- **Purpose**: Apply a single atomic block-level AST change (`CREATE_BLOCK`, `UPDATE_BLOCK`, `DELETE_BLOCK`, `MOVE_BLOCK`).
- **Request Body**: `ASTChange` (JSON)
  - `documentId` (string, optional/inferred): Target document ObjectId (inferred from path parameter if omitted).
  - `blockId` (string, required): Stable block identifier targeted by the change operation.
  - `operation` (string, required): One of `"CREATE_BLOCK"`, `"UPDATE_BLOCK"`, `"DELETE_BLOCK"`, `"MOVE_BLOCK"`.
  - `version` (number, optional): Client-side document version baseline.
  - `payload` (object, optional/required depending on operation): Operation parameters.
- **Query Parameters**: None
- **Path Parameters**:
  - `id` (string, required): Target document ObjectId string.
- **Success Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "AST change applied successfully",
    "data": {
      "_id": "64f9bf410e340e4f20bfac8a",
      "title": "SyncDoc Architecture",
      "ownerId": "user_456",
      "version": 2,
      "blocks": [ ... ]
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (Invalid operation, non-existent target block, out-of-bounds index, or invalid payload):
    ```json
    {
      "success": false,
      "message": "Target block ID 'non-existent-b9' not found in document",
      "errors": [
        { "path": "blockId", "message": "Block 'non-existent-b9' does not exist" }
      ]
    }
    ```
  - `404 Not Found` (Target document does not exist):
    ```json
    {
      "success": false,
      "message": "Document '64f9bf410e340e4f20bfac8a' not found",
      "errors": [
        { "path": "id", "message": "Document not found" }
      ]
    }
    ```
- **Example Request**:
  `POST /api/documents/64f9bf410e340e4f20bfac8a/changes`
  ```json
  {
    "blockId": "b-new-1",
    "operation": "CREATE_BLOCK",
    "payload": {
      "type": "code",
      "data": {
        "language": "typescript",
        "code": "console.log('Hello SyncDoc');"
      },
      "targetIndex": 1
    }
  }
  ```
- **Example Response**:
  ```json
  {
    "success": true,
    "message": "AST change applied successfully",
    "data": {
      "_id": "64f9bf410e340e4f20bfac8a",
      "title": "SyncDoc Architecture",
      "ownerId": "user_456",
      "version": 2,
      "blocks": [
        { "id": "b-1", "type": "heading", "data": { "text": "SyncDoc Specification" } },
        { "id": "b-new-1", "type": "code", "data": { "language": "typescript", "code": "console.log('Hello SyncDoc');" } },
        { "id": "b-2", "type": "paragraph", "data": { "text": "A real-time collaborative document engine." } }
      ],
      "createdAt": "2026-09-12T20:15:00.000Z",
      "updatedAt": "2026-09-12T20:30:00.000Z"
    }
  }
  ```

---

### 7. Delete Document
- **HTTP Method**: `DELETE`
- **URL**: `/api/documents/:id`
- **Purpose**: Permanently remove a document by ID.
- **Request Body**: None
- **Query Parameters**: None
- **Path Parameters**:
  - `id` (string, required): MongoDB ObjectId string.
- **Success Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Document deleted successfully"
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (Invalid ObjectId format).
  - `404 Not Found` (Document not found):
    ```json
    {
      "success": false,
      "message": "Document not found"
    }
    ```
- **Example Request**:
  `DELETE /api/documents/64f9bf410e340e4f20bfac8a`
- **Example Response**:
  ```json
  {
    "success": true,
    "message": "Document deleted successfully"
  }
  ```

---

### 8. Export Document (HTML / PDF)
- **HTTP Method**: `GET`
- **URL**: `/api/documents/:id/export`
- **Purpose**: Render and export document's AST as HTML or binary PDF.
- **Request Body**: None
- **Query Parameters**:
  - `format` (string, required): Supported formats: `"html"` or `"pdf"`.
  - `download` (string, optional): Set to `"true"` to force attachment disposition on HTML.
- **Path Parameters**:
  - `id` (string, required): Document ObjectId string.
- **Success Response**: `200 OK`
  - For `format=html`: Returns HTML5 string (`Content-Type: text/html; charset=utf-8`).
  - For `format=pdf`: Returns binary PDF Buffer (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="<sanitized_title>.pdf"`).
- **Error Responses**:
  - `400 Bad Request` (Missing or invalid `format` parameter):
    ```json
    {
      "success": false,
      "message": "Invalid export format 'docx'. Supported formats: html, pdf"
    }
    ```
  - `404 Not Found` (Document not found):
    ```json
    {
      "success": false,
      "message": "Document not found"
    }
    ```
- **Example Request**:
  `GET /api/documents/64f9bf410e340e4f20bfac8a/export?format=pdf`
- **Example Response**:
  Binary PDF stream download.

---

## 3. Document & AST Structural Contract

Every document stored and returned by the backend conforms to the following schema:

```typescript
interface IDocument {
  _id: string;          // MongoDB 24-char ObjectId string (server-assigned, immutable)
  title: string;        // Document title string (trimmed, non-empty)
  ownerId: string;      // Document owner ID string (trimmed, non-empty)
  version: number;      // Auto-incrementing integer version baseline (starts at 1)
  blocks: AstBlock[];   // Ordered array of AST blocks
  createdAt?: string;   // ISO-8601 creation timestamp
  updatedAt?: string;   // ISO-8601 update timestamp
}
```

### Supported AST Block Types & Required `data` Contracts

#### 1. Heading Block (`"heading"`)
- **Structure**:
  ```json
  {
    "id": "b-head-1",
    "type": "heading",
    "data": {
      "text": "Chapter 1: Overview"
    }
  }
  ```
- **Rules**:
  - `data.text` (string): **Required**. Non-whitespace heading text.

#### 2. Paragraph Block (`"paragraph"`)
- **Structure**:
  ```json
  {
    "id": "b-para-1",
    "type": "paragraph",
    "data": {
      "text": "This paragraph contains regular text."
    }
  }
  ```
- **Rules**:
  - `data.text` (string): **Required**. Can be empty string `""`.

#### 3. Code Block (`"code"`)
- **Structure**:
  ```json
  {
    "id": "b-code-1",
    "type": "code",
    "data": {
      "language": "javascript",
      "code": "const x = 42;"
    }
  }
  ```
- **Rules**:
  - `data.language` (string): **Required**. Non-empty language tag (e.g., `"javascript"`, `"python"`, `"typescript"`).
  - `data.code` (string): **Required**. Code content string (can be empty).

#### 4. List Block (`"list"`)
- **Structure**:
  ```json
  {
    "id": "b-list-1",
    "type": "list",
    "data": {
      "ordered": false,
      "items": [
        "First item",
        "Second item"
      ]
    }
  }
  ```
- **Rules**:
  - `data.ordered` (boolean): **Required**. Explicit boolean (`true` for ordered `<ol>`, `false` for unordered `<ul>`).
  - `data.items` (array of strings): **Required**. Non-empty array (`length >= 1`) containing non-empty strings.

---

## 4. AST Change API Contract

**Endpoint**: `POST /api/documents/:id/changes`

### AST Change Object Schema
```typescript
interface ASTChange {
  documentId?: string;     // Target document ObjectId (inferred from path parameter if omitted)
  blockId: string;        // Stable target block ID (trimmed, non-empty)
  operation: ASTOperation;// "CREATE_BLOCK" | "UPDATE_BLOCK" | "DELETE_BLOCK" | "MOVE_BLOCK"
  version?: number;       // Optional version baseline
  payload?: ASTChangePayload; // Operation-specific payload
}
```

### Supported Operations & Payloads

#### 1. `CREATE_BLOCK`
Inserts a new block with a client-provided stable `blockId`.
```json
{
  "blockId": "b-new-99",
  "operation": "CREATE_BLOCK",
  "payload": {
    "type": "paragraph",
    "data": { "text": "Newly inserted text" },
    "targetIndex": 2
  }
}
```

#### 2. `UPDATE_BLOCK`
Modifies data fields or type of an existing block by `blockId`.
```json
{
  "blockId": "b-para-1",
  "operation": "UPDATE_BLOCK",
  "payload": {
    "data": {
      "text": "Updated paragraph content"
    }
  }
}
```

#### 3. `DELETE_BLOCK`
Removes a single block matching `blockId`.
```json
{
  "blockId": "b-para-1",
  "operation": "DELETE_BLOCK"
}
```

#### 4. `MOVE_BLOCK`
Reorders an existing block to a new 0-based index.
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

## 5. Versioning Contract

1. **Initial Version**: Every document starts at `version = 1` upon creation.
2. **Version Increments**:
   - `PUT /api/documents/:id` increments `version` by `+1` on successful save.
   - `POST /api/documents/:id/changes` increments `version` by `+1` on successful save.
3. **Persistence Bound**: Version increments occur **strictly after** successful validation and MongoDB save. Failed requests do NOT increment `version`.

---

## 6. Export Pipeline Contract

1. **Supported Formats**: `"html"` and `"pdf"`.
2. **HTML Export**:
   - URL: `GET /api/documents/:id/export?format=html`
   - Header: `Content-Type: text/html; charset=utf-8`
3. **PDF Export**:
   - URL: `GET /api/documents/:id/export?format=pdf`
   - Header: `Content-Type: application/pdf`
   - Header: `Content-Disposition: attachment; filename="<sanitized_title>.pdf"`
   - Uses Puppeteer headless browser with local file interception for security.
4. **Filename Sanitization**: Document title sanitized (CR/LF stripped, unsafe symbols converted to underscores).

---

## 7. Integration Readiness Assessment for Member 2 & Member 3

- **Member 2 (Real-Time Yjs / CRDT Synchronization)**:
  - Stable `block.id` strings are preserved across all CRUD and AST change operations.
  - Yjs state vectors can map `Y.Doc` -> `_id`, `Y.Array` -> `blocks`, and `Y.Text` / `Y.Map` -> block `data`.
  - `POST /api/documents/:id/changes` provides an atomic REST endpoint for applying block operations.
- **Member 3 (React Block Editor UI)**:
  - Clear block rendering matrix:
    - `"heading"` -> `<HeadingBlock id={b.id} text={b.data.text} />`
    - `"paragraph"` -> `<ParagraphBlock id={b.id} text={b.data.text} />`
    - `"code"` -> `<CodeBlock id={b.id} language={b.data.language} code={b.data.code} />`
    - `"list"` -> `<ListBlock id={b.id} ordered={b.data.ordered} items={b.data.items} />`
  - Predictable error structure (`400 Bad Request` with `errors: [{ path, message }]`).
