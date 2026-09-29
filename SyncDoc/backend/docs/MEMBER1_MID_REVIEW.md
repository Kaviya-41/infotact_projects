# SyncDoc — Member 1 Mid-Review Documentation

## 1. What Member 1 Implemented

Member 1 is responsible for the **backend foundation and AST document engine** of SyncDoc:

- Express + TypeScript REST API server
- MongoDB Atlas integration via Mongoose
- Document model with AST-based block structure
- AST validation engine (recursive, type-aware)
- AST normalization pipeline
- AST recursive utility functions
- AST mutation engine (CREATE, UPDATE, DELETE, MOVE blocks)
- Document CRUD API endpoints
- Document versioning (auto-increment on changes)
- Request validation middleware (ObjectId, create, update)
- Security: MongoDB operator injection rejection
- Update-field restriction (only `title` and `blocks` allowed)

---

## 2. Backend Architecture

```
React Editor (Member 3)
        |
        | HTTP / REST
        v
Express REST API (Member 1)
        |
        v
Express Routes (/api/documents)
        |
        v
Validation Middleware
    - validateObjectId()
    - validateCreateDocument()
    - validateUpdateDocument()
        |
        v
Document Controller
        |
        v
Document Service / AST Utilities
        |
        v
Mongoose Document Model
    - Pre-save normalization
    - Pre-save AST validation
        |
        v
MongoDB Atlas (ClusterSync)
```

---

## 3. Request Flow

### Create Document Flow
```
POST /api/documents
    → validateCreateDocument middleware
        → normalizeAST(req.body)
        → validateDocument(req.body)
        → if invalid → HTTP 400 + error details
    → documentController.create()
        → documentService.create()
            → new Document(payload)
            → doc.save()
                → Mongoose pre-save hook
                    → normalizeAST()
                    → validateDocumentAST()
                → MongoDB Atlas persistence
    → HTTP 201 + { success, data }
```

### Update Document Flow
```
PUT /api/documents/:id
    → validateObjectId middleware
    → validateUpdateDocument middleware
        → reject MongoDB operators ($set, $inc, etc.)
        → reject unsupported fields (only title/blocks allowed)
        → normalizeAST(req.body)
        → validate provided fields
    → documentController.update()
        → documentService.update()
            → find document by ID
            → apply title/blocks changes
            → increment version
            → doc.save() → pre-save validation
    → HTTP 200 + { success, data }
```

---

## 4. AST Structure

A SyncDoc document stores its content as an array of typed AST blocks:

```json
{
    "title": "Document Title",
    "ownerId": "user-id",
    "version": 1,
    "blocks": [
        {
            "id": "block-1",
            "type": "heading",
            "data": { "text": "Section Title" }
        },
        {
            "id": "block-2",
            "type": "paragraph",
            "data": { "text": "Body text content." }
        },
        {
            "id": "block-3",
            "type": "code",
            "data": { "language": "typescript", "code": "const x = 1;" }
        },
        {
            "id": "block-4",
            "type": "list",
            "data": { "ordered": true, "items": ["Item 1", "Item 2"] }
        }
    ]
}
```

### Supported Block Types (Single Source of Truth: `AstNode.ts`)

| Type | Data Fields |
|-----------|--------------------------------------|
| heading | `text` (non-empty string) |
| paragraph | `text` (string) |
| code | `language` (non-empty string), `code` (string) |
| list | `ordered` (boolean), `items` (non-empty string array) |

Each block has a stable unique `id` that persists across edits.

---

## 5. Validation Flow

The AST validator (`astValidator.ts`) checks:

- Document payload is a valid object
- `title` is a non-empty string
- `ownerId` is a non-empty string
- `version` (if present) is a non-negative integer
- `blocks` is a valid array
- Each block has a non-empty `id`
- Block IDs are unique across the entire document tree
- Each block has a supported `type`
- Each block has a valid `data` payload matching its type
- Nested children (if present) are recursively validated

If validation fails, the API returns HTTP 400 with structured error details:

```json
{
    "success": false,
    "message": "Invalid AST document structure",
    "errors": [
        { "path": "blocks[0].id", "message": "Block ID is required" }
    ]
}
```

---

## 6. Normalization Flow

The normalizer (`astUtils.ts → normalizeAST()`) runs before validation:

- Trims `title` whitespace
- Trims `ownerId` whitespace
- Trims block `id` whitespace
- Trims block `type` whitespace
- Trims code block `language` metadata
- Preserves user text content exactly (no trimming of document text)
- Preserves block ordering
- Recursively normalizes nested children
- Is idempotent (running twice produces the same result)

---

## 7. CRUD Flow

| Method | Endpoint | Description |
|--------|--------------------------------------|--------------------------------------|
| GET | `/api/health` | Health check |
| POST | `/api/documents` | Create document (validated AST) |
| GET | `/api/documents` | List documents (with pagination) |
| GET | `/api/documents/:id` | Get document by ObjectId |
| PUT | `/api/documents/:id` | Update document (title/blocks only) |
| POST | `/api/documents/:id/changes` | Apply AST mutation operation |
| DELETE | `/api/documents/:id` | Delete document |

---

## 8. AST Change Operations

The mutation engine (`astChangeUtils.ts`) supports four operations:

```
Client
    |
    v
POST /api/documents/:id/changes
    |
    v
validateASTChange()
    |
    v
applyASTChange()
    |
    v
validate resulting AST
    |
    v
increment version
    |
    v
MongoDB persistence
```

### Supported Operations

| Operation | Description |
|----------------|-----------------------------------------------------|
| CREATE_BLOCK | Adds a new block to the document |
| UPDATE_BLOCK | Updates an existing block's data payload |
| DELETE_BLOCK | Removes a block by its ID |
| MOVE_BLOCK | Moves a block to a different position in the array |

After every operation, the resulting AST is re-validated to ensure structural integrity.

---

## 9. MongoDB Persistence

- Database: MongoDB Atlas (cluster: `ClusterSync`)
- Connection: `MONGO_URI` environment variable (never exposed)
- ODM: Mongoose with schema discriminators for block types
- Document schema uses `timestamps: true` for `createdAt`/`updatedAt`
- Pre-save hook runs normalization and validation before every write

---

## 10. Versioning

- Every document starts at `version: 1`
- Each successful update increments `version` by 1
- Each successful AST change operation also increments `version`
- Version is read-only through the update API (cannot be manually set by clients)

---

## 11. Security Protections

### ObjectId Validation
- `validateObjectId()` middleware checks `:id` params before database access
- Invalid ObjectIds return HTTP 400: `{ success: false, message: "Invalid document ID" }`

### Update Field Restriction
- Only `title` and `blocks` are allowed in PUT requests
- Fields like `ownerId`, `version`, `_id`, `createdAt`, `updatedAt` are rejected

### MongoDB Operator Injection Prevention
- Request bodies containing keys starting with `$` (e.g., `$set`, `$inc`, `$push`) are rejected with HTTP 400
- This prevents clients from passing raw MongoDB update operators through the REST API

---

## 12. API Routes

Defined in `documentRoutes.ts`:

```
POST   /                → validateCreateDocument → controller.create
GET    /                → controller.list
GET    /:id             → validateObjectId → controller.getById
PUT    /:id             → validateObjectId → validateUpdateDocument → controller.update
POST   /:id/changes     → validateObjectId → controller.applyChange
DELETE /:id             → validateObjectId → controller.delete
```

---

## 13. How Member 2 Integrates

Member 2 (Yjs / CRDT real-time sync layer) integrates with Member 1's backend through:

- **ASTChange contract**: Member 2 sends change operations using the `POST /api/documents/:id/changes` endpoint with `{ blockId, operation, version, payload }` payloads
- **Document retrieval**: Member 2 fetches the current document state via `GET /api/documents/:id`
- **Conflict resolution**: Member 1's backend applies changes sequentially; final conflict resolution between concurrent edits is delegated to Member 2's CRDT layer

---

## 14. How Member 3 Integrates

Member 3 (React frontend) integrates through:

- **REST API consumption**: All CRUD operations via the documented REST endpoints
- **Response DTO format**: Every response includes `{ success, message, data }` with the document containing `{ _id, title, ownerId, version, blocks, createdAt, updatedAt }`
- **Block rendering**: Member 3 maps the `blocks` array to React components based on `type` (heading → h1/h2, paragraph → p, code → pre/code, list → ol/ul)

---

## 15. What to Explain During Mid-Review

### Opening Statement
> "My contribution as Member 1 is mainly the backend and AST/document layer of SyncDoc. I implemented the Express REST APIs, MongoDB persistence using Mongoose, AST models and validation, normalization, document CRUD operations, and the AST mutation engine. The mutation engine supports create, update, delete and move operations. I also added ObjectId validation, update-field restrictions, MongoDB operator rejection and version handling."

### If Asked: "What happens when a document is created?"
> "The POST request enters the Express route, passes through the validation middleware where the AST is normalized and validated recursively, then reaches the controller which calls the service layer to persist it through the Mongoose model into MongoDB Atlas."

### If Asked: "Why AST?"
> "SyncDoc represents documents as structured typed nodes with stable IDs rather than treating them as plain text. This allows individual elements to be identified and modified in a controlled way, which is essential for collaborative editing."

### If Asked: "How do you protect the update API?"
> "The update middleware only allows title and blocks fields. It rejects any unsupported fields and MongoDB operators like $set or $inc, preventing direct database manipulation through the API."

### If Asked: "What happens with an invalid document?"
> "The validation middleware rejects it before it reaches the database, returning HTTP 400 with structured error details showing exactly which field or block failed validation."

---

## 16. Week 3 — AST → HTML Export Pipeline

### Architecture

```
GET /api/documents/:id/export?format=html
    → validateObjectId middleware
    → exportController.exportDocument()
        → documentService.getById(id)
        → exportService.exportDocument(blocks, title, format)
            → astToHtml.blocksToHtml(blocks, title)
                → renderBlock() for each block
                    → escapeHtml() on all user content
            → return { format, content, contentType }
        → HTTP 200 with text/html content
```

### Supported Block Transformations

| AST Block Type | HTML Output | Data Fields Used |
|---------------|-------------|-----------------|
| `heading` | `<h1>escaped text</h1>` | `data.text` |
| `paragraph` | `<p>escaped text</p>` | `data.text` |
| `code` | `<pre><code class="language-xxx">escaped code</code></pre>` | `data.language`, `data.code` |
| `list` (ordered) | `<ol><li>...</li></ol>` | `data.ordered`, `data.items` |
| `list` (unordered) | `<ul><li>...</li></ul>` | `data.ordered`, `data.items` |

### HTML Escaping / Security

All user-provided content is HTML entity-escaped before embedding:

| Character | Escaped To |
|-----------|-----------|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#39;` |

This prevents XSS injection — content like `<script>alert("xss")</script>` is rendered as visible text, not executed.

### Block Ordering

Block ordering from the AST `blocks[]` array is strictly preserved. Blocks are rendered sequentially — no sorting, filtering, or reordering occurs during transformation.

### Standalone HTML Generation

The `html` format produces a complete HTML5 document:
- `<!DOCTYPE html>` declaration
- UTF-8 charset and viewport meta tags
- Escaped document title in `<title>` tag
- Embedded CSS for professional appearance (no external dependencies)
- All blocks rendered inside `<body>`

The `html-fragment` format produces body-only content for embedding.

### Export API Endpoint

```
GET /api/documents/:id/export
    ?format=html          (default: full HTML5 document)
    ?format=html-fragment (body-only HTML fragment)
    ?download=true        (triggers Content-Disposition: attachment)
```

### PDF Preparation

The architecture is structured for future PDF support:
```
AST → HTML → PDF
```
The `ExportFormat` union type in `exportService.ts` can be extended to `"pdf"` without rewriting AST transformation logic. The HTML output serves as the intermediate representation for PDF conversion.

### Export Route

```
GET /:id/export → validateObjectId → exportController.exportDocument
```
