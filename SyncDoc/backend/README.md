# SyncDoc Backend API & AST Engine

SyncDoc is a high-performance, real-time collaborative document engine backend built with **Node.js**, **Express**, **TypeScript**, **MongoDB/Mongoose**, and **Puppeteer**.

Member 1 is responsible for the **Backend + AST/Document layer**, providing a structured hierarchical Abstract Syntax Tree (AST), validation and normalization engines, atomic AST change operations, automatic versioning, and an export pipeline (HTML & PDF).

---

## 1. Project Purpose

The SyncDoc backend serves as the core persistence, validation, and transformation authority for collaborative document editing. It manages structured hierarchical document ASTs, enforces strict block-level schemas, applies safe atomic change operations, auto-increments version metadata, and exports documents into print-ready HTML and PDF formats.

---

## 2. Backend Architecture

The backend follows a clean, decoupled layered architecture:

```
                                 ┌──────────────────────┐
                                 │   Client Requests    │
                                 └──────────┬───────────┘
                                            │
                                            ▼
                                 ┌──────────────────────┐
                                 │ Express App / Router │ (app.ts, documentRoutes.ts)
                                 └──────────┬───────────┘
                                            │
                                            ▼
                                 ┌──────────────────────┐
                                 │ Security & Validation│ (helmet, cors, validationMiddleware.ts)
                                 │      Middleware      │
                                 └──────────┬───────────┘
                                            │
                                            ▼
                                 ┌──────────────────────┐
                                 │     Controllers      │ (documentController.ts, exportController.ts)
                                 └──────────┬───────────┘
                                            │
                                            ▼
                                 ┌──────────────────────┐
                                 │       Services       │ (documentService.ts, exportService.ts, pdfService.ts)
                                 └──────────┬───────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
         ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
         │ AST Engine & Utils  │ │  Mongoose Models    │ │   Export Engine     │
         │ (astUtils, astToHtml│ │ (Document, AstNode) │ │ (Puppeteer / HTML)  │
         │  astChangeUtils)    │ └──────────┬──────────┘ └─────────────────────┘
         └─────────────────────┘            │
                                            ▼
                                 ┌──────────────────────┐
                                 │    MongoDB Database  │
                                 └──────────────────────┘
```

### Architectural Layers
- **Routes (`src/routes/`)**: Map REST API endpoints to middleware and controller handlers.
- **Middleware (`src/middleware/`)**: Handles security headers, CORS, body parsing limits, ObjectId validation, AST structure validation, MongoDB injection defense, and global error handling.
- **Controllers (`src/controllers/`)**: Parse HTTP requests, extract parameters safely, invoke business services, and format standardized JSON or binary HTTP responses.
- **Services (`src/services/`)**: Implement business logic for document CRUD, atomic AST change application, and export transformations.
- **Models (`src/models/`)**: Define Mongoose schemas, discriminators for block types, and pre-save validation hooks.
- **AST Utilities & Change Engine (`src/utils/`, `src/validators/`)**: Perform AST traversal, node lookup, deep normalization, schema validation, and safe block mutations (`CREATE_BLOCK`, `UPDATE_BLOCK`, `DELETE_BLOCK`, `MOVE_BLOCK`).
- **Export Pipeline (`src/services/exportService.ts`, `src/services/pdfService.ts`)**: Render AST blocks into complete HTML documents or print-ready PDF buffers via headless Chromium.

---

## 3. Folder Structure

```
backend/
├── .env.example              # Environment variables template (placeholders only)
├── .gitignore                 # Git ignore rules (node_modules, dist, .env)
├── package.json               # Package manifests and script definitions
├── tsconfig.json              # Strict TypeScript compiler options
├── docs/                      # Technical documentation & integration contracts
│   ├── API.md                 # Full API specification & JSON contracts
│   ├── INTEGRATION_CONTRACT.md# AST schema & team integration reference
│   ├── HANDOFF_MEMBER2_MEMBER3.md # Integration guide for Member 2 & 3
│   ├── MEMBER1_MID_REVIEW.md  # Architectural overview document
│   └── SECURITY.md            # Backend security policies & controls
└── src/                       # Source TypeScript codebase
    ├── app.ts                 # Express application configuration & routing
    ├── server.ts              # Server startup & DB connection launcher
    ├── config/
    │   └── db.ts              # MongoDB Mongoose connection utility
    ├── controllers/
    │   ├── documentController.ts  # Document CRUD & AST change HTTP handlers
    │   └── exportController.ts    # HTML and PDF export HTTP handlers
    ├── middleware/
    │   ├── errorHandler.ts        # Centralized Express error handling
    │   └── validationMiddleware.ts# ObjectId, AST payload & security validation
    ├── models/
    │   ├── AstNode.ts             # Mongoose schemas & discriminators for block types
    │   └── Document.ts            # Mongoose Document model with pre-save hooks
    ├── routes/
    │   └── documentRoutes.ts      # Express router for /api/documents
    ├── services/
    │   ├── documentService.ts     # Document database operations & versioning logic
    │   ├── exportService.ts       # AST → HTML/PDF transformation orchestrator
    │   └── pdfService.ts          # Puppeteer PDF buffer generator
    ├── types/
    │   ├── apiTypes.ts            # Request/response TypeScript definitions
    │   └── astChangeTypes.ts      # AST change operation TypeScript interfaces
    ├── utils/
    │   ├── astChangeUtils.ts      # Atomic AST block change operation engine
    │   ├── astToHtml.ts           # AST → HTML transformer with XSS escaping
    │   └── astUtils.ts            # AST traversal, lookup, and normalization
    └── validators/
        ├── astChangeValidator.ts  # Validation rules for AST change payloads
        └── astValidator.ts        # Recursive document AST schema validator
```

---

## 4. Technology Stack

- **Runtime & Language**: Node.js (v18+), TypeScript 5.0+ (strict mode enabled).
- **Web Framework**: Express.js (v5.x).
- **Database & ORM**: MongoDB (v6.0+), Mongoose (v9.x).
- **Export Pipeline**: Puppeteer (v25.x) headless Chromium for PDF generation.
- **Security & Utilities**: Helmet (HTTP security headers), CORS, Dotenv, TSX (TypeScript execution).

---

## 5. Environment Variables

Create a `.env` file in the `backend/` directory by copying `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/syncdoc
FRONTEND_ORIGIN=http://localhost:3000
```

### Environment Variable Descriptions
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Optional | `5000` | Port number for Express HTTP server |
| `MONGO_URI` | **Required** | N/A | MongoDB connection string (local or MongoDB Atlas) |
| `FRONTEND_ORIGIN` | Optional | `*` | Allowed origin header for CORS requests |

---

## 6. How to Install Dependencies

Execute the following command in the `backend/` directory:

```bash
npm install
```

---

## 7. How to Start Development Server

Run the development server with live reload powered by `tsx`:

```bash
npm run dev
```

The server will start at `http://localhost:5000`.

---

## 8. How to Build for Production

Compile TypeScript into production JavaScript in the `dist/` directory:

```bash
npm run build
```

To run the built production server:

```bash
npm run start
```

---

## 9. How to Run Tests & Verification

### Typechecking
Verify TypeScript types strictly without emitting JavaScript:

```bash
npm run typecheck
```

### Test Suites
Run existing backend test scripts:

```bash
# Run core AST engine and document tests
npm run test

# Run export pipeline tests
npm run test:export:api
npm run test:export:complete
npm run test:export:pdf

# Run security test suite
npm run test:security
```

---

## 10. MongoDB Setup Requirement

The backend requires an active MongoDB database instance (MongoDB Atlas cluster or local MongoDB server):

1. **Local MongoDB**: Install MongoDB Community Server and start the service (`mongodb://localhost:27017/syncdoc`).
2. **MongoDB Atlas**: Create a free cluster, create a database user, whitelist your IP address, and copy the connection URI into `.env`.

---

## 11. API Overview

All API endpoints return JSON formatted as `{ "success": boolean, "message": string, "data"?: ... }` except for export endpoints which return rendered HTML or binary PDF downloads.

| Method | Endpoint | Description | Status Codes |
|--------|----------|-------------|--------------|
| `GET` | `/api/health` | Service health check | `200` |
| `POST` | `/api/documents` | Create document with initial AST blocks | `201`, `400` |
| `GET` | `/api/documents` | List documents (supports `ownerId`, `page`, `limit`) | `200`, `500` |
| `GET` | `/api/documents/:id` | Get document by 24-hex ObjectId | `200`, `400`, `404` |
| `PUT` | `/api/documents/:id` | Update document title or blocks (increments version) | `200`, `400`, `404` |
| `POST` | `/api/documents/:id/changes` | Apply atomic AST change operation (`CREATE_BLOCK`, `UPDATE_BLOCK`, `DELETE_BLOCK`, `MOVE_BLOCK`) | `200`, `400`, `404` |
| `DELETE` | `/api/documents/:id` | Delete document by ID | `200`, `400`, `404` |
| `GET` | `/api/documents/:id/export?format=html` | Export AST as HTML5 document string | `200`, `400`, `404` |
| `GET` | `/api/documents/:id/export?format=pdf` | Export AST as print-ready PDF binary download | `200`, `400`, `404` |

---

## 12. AST & Block Engine Overview

SyncDoc documents store content as an ordered array of typed AST blocks (`AstBlock`).

### Supported Block Types
1. **Heading (`"heading"`)**: `{ "id": "b1", "type": "heading", "data": { "text": "Heading text" } }`
2. **Paragraph (`"paragraph"`)**: `{ "id": "b2", "type": "paragraph", "data": { "text": "Paragraph text" } }`
3. **Code (`"code"`)**: `{ "id": "b3", "type": "code", "data": { "language": "typescript", "code": "const x = 1;" } }`
4. **List (`"list"`)**: `{ "id": "b4", "type": "list", "data": { "ordered": false, "items": ["Item 1", "Item 2"] } }`

### Guarantees
- **Stable IDs**: Every block has a persistent string `id` preserved across edits and reordering.
- **Strict Order**: Block ordering is strictly preserved during database operations and exports.
- **Pre-Save Validation**: Mongoose `pre("save")` hooks validate block schemas and reject duplicate block IDs.

---

## 13. Export Functionality

The export pipeline transforms document ASTs into formatted documents:

- **HTML Export**: `GET /api/documents/:id/export?format=html` generates a valid standalone HTML5 document embedded with clean responsive CSS.
- **PDF Export**: `GET /api/documents/:id/export?format=pdf` uses Puppeteer headless Chromium to render the generated HTML into an A4 PDF binary stream (`Content-Disposition: attachment; filename="<sanitized_title>.pdf"`).

---

## 14. Security Considerations

1. **HTTP Security Headers**: Enforced via `helmet()`.
2. **CORS Configuration**: Configurable origin restriction via `FRONTEND_ORIGIN`.
3. **Body Size Limiting**: `express.json({ limit: "1mb" })` prevents memory exhaustion attacks.
4. **NoSQL Injection & Prototype Pollution Defense**: Middleware recursively inspects incoming JSON payloads and rejects dangerous keys containing MongoDB operators (`$`) or prototype properties (`__proto__`, `constructor`, `prototype`).
5. **XSS Protection**: HTML rendering pipeline escapes text using `escapeHtml()` (`& < > " '`).
6. **HTTP Response Header Injection Defense**: Filenames in `Content-Disposition` headers strip CR (`\r`) and LF (`\n`) characters before setting headers.
7. **Puppeteer Local File Access Defense**: Puppeteer browser instance intercepts page requests and blocks `file://`, `ftp://`, and `gopher://` schemes.
