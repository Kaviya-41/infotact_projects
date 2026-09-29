# SyncDoc AST Integration Contract & Mid-Project Review Guide

This document establishes the official integration contract between **Member 1 (Backend + AST Engine)**, **Member 2 (Yjs / CRDT Real-time Synchronization)**, and **Member 3 (React Block Editor UI)**.

---

## 1. Document & AST Structural Contract

Every SyncDoc document is stored and returned as a single JSON object containing metadata and an ordered array of AST blocks:

```json
{
  "_id": "64f9bf410e340e4f20bfac8a",
  "title": "Aircraft Technical Specification",
  "ownerId": "user001",
  "version": 1,
  "blocks": [
    {
      "id": "block-001",
      "type": "heading",
      "data": {
        "text": "Introduction"
      }
    },
    {
      "id": "block-002",
      "type": "paragraph",
      "data": {
        "text": "SyncDoc is a collaborative document engine."
      }
    },
    {
      "id": "block-003",
      "type": "code",
      "data": {
        "language": "javascript",
        "code": "console.log('SyncDoc');"
      }
    },
    {
      "id": "block-004",
      "type": "list",
      "data": {
        "ordered": false,
        "items": [
          "AST",
          "MongoDB",
          "CRDT"
        ]
      }
    }
  ],
  "createdAt": "2026-08-21T10:00:00.000Z",
  "updatedAt": "2026-08-21T10:00:00.000Z"
}
```

### Key Structural Guarantees:
1. **Stable Block ID (`id`)**: Every block has a unique string `id`. Modifying block content or order MUST NOT change the block `id`.
2. **Preserved Order**: The array order of `blocks` directly reflects document presentation. The backend preserves block order strictly.
3. **Unique IDs**: Duplicate block IDs anywhere in the document tree are rejected by Mongoose pre-save hooks and Express validation middleware.

---

## 2. Member 2 Integration Contract — Real-time Synchronization (Yjs / CRDT)

Member 2 handles real-time concurrent edits, cursor indicators, and Yjs synchronization.

### Synchronization Boundaries:
- **Targeting**: Edits target specific `blockId` fields (`blocks.find(b => b.id === targetId)`).
- **CRDT Binding**:
  - `Y.Doc` maps to the SyncDoc document (`_id`).
  - `Y.Array` maps to the document `blocks` array.
  - `Y.Map` or `Y.Text` maps to individual block `data` fields (`text`, `code`, `items`).
- **Version Tracking**: The `version` metadata integer increments predictably during persistence syncs to serve as a revision baseline.

---

## 3. Member 3 Integration Contract — React Block Editor UI

Member 3 renders the block-based rich text editor and captures user interactions.

### Block Rendering Matrix:

| AST `type` | Data Payload Interface | Target React Component |
|------------|------------------------|-----------------------|
| `"heading"` | `{ text: string }` | `<HeadingBlock id={id} text={data.text} />` |
| `"paragraph"` | `{ text: string }` | `<ParagraphBlock id={id} text={data.text} />` |
| `"code"` | `{ language: string, code: string }` | `<CodeBlock id={id} language={data.language} code={data.code} />` |
| `"list"` | `{ ordered: boolean, items: string[] }` | `<ListBlock id={id} ordered={data.ordered} items={data.items} />` |

### API Endpoints for Frontend Consumption:
- `POST /api/documents`: Create a new document (`{ title, ownerId, blocks }`).
- `GET /api/documents`: List documents.
- `GET /api/documents/:id`: Load document AST by ID.
- `PUT /api/documents/:id`: Save document updates (`{ title, blocks }`).
- `DELETE /api/documents/:id`: Remove document.

---

## 4. Mid-Project Review Demonstration — Markdown to AST JSON Mapping

For the Mid-Project Review, below is the conceptual mapping demonstrating how raw document text transforms into SyncDoc's AST structure:

### Source Markdown Text:
```markdown
# Introduction

SyncDoc is a collaborative document engine.

```javascript
console.log("SyncDoc");
```

- AST
- MongoDB
- CRDT
```

### Transformed SyncDoc AST JSON Output:
```json
{
  "title": "SyncDoc Architecture Overview",
  "ownerId": "review-user-01",
  "version": 1,
  "blocks": [
    {
      "id": "b1",
      "type": "heading",
      "data": {
        "text": "Introduction"
      }
    },
    {
      "id": "b2",
      "type": "paragraph",
      "data": {
        "text": "SyncDoc is a collaborative document engine."
      }
    },
    {
      "id": "b3",
      "type": "code",
      "data": {
        "language": "javascript",
        "code": "console.log(\"SyncDoc\");"
      }
    },
    {
      "id": "b4",
      "type": "list",
      "data": {
        "ordered": false,
        "items": [
          "AST",
          "MongoDB",
          "CRDT"
        ]
      }
    }
  ]
}
```
