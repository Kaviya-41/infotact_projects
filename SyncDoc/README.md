# SyncDoc - Real-Time Collaborative Document Platform & AST Engine

SyncDoc is a high-performance, real-time collaborative document management and editing platform powered by a structured **Abstract Syntax Tree (AST)** architecture, **Conflict-Free Replicated Data Types (CRDTs via Yjs)** over WebSockets, and an automated **HTML & PDF export pipeline** powered by Puppeteer.

---

## 1. Project Overview

SyncDoc redefines web document authoring by treating content not as a fragile monolithic text blob, but as a strongly-typed, hierarchical Abstract Syntax Tree (AST). Every paragraph, heading, code block, and list is a discrete AST node with a persistent identifier and schema-validated properties.

With integrated real-time synchronization, multi-user sessions are managed concurrently without merge conflicts. The platform includes a complete authentication system, a modern responsive workspace dashboard, rich block-level editing controls, and an enterprise-grade document export engine capable of generating standalone HTML5 and print-ready PDF files.

---

## 2. Problem It Solves

Traditional web document editors suffer from common structural and synchronization issues:

- **Monolithic Text & Concurrency Conflicts:** Standard text inputs or basic rich-text editors produce unstructured HTML/Markdown where concurrent edits easily cause race conditions, cursor jumps, and clobbered work.
- **Data Integrity & Schema Drift:** Without rigid typing, document structures degrade over time, leading to broken formatting and inconsistent styling.
- **Complex Real-Time Collaboration:** Implementing multi-user editing with simple polling or ad-hoc WebSockets leads to desynchronization and difficult conflict resolution.
- **Export Inconsistencies:** Converting web-based rich documents into clean, print-ready PDF or standalone HTML documents often results in broken layouts and missing styles.

**SyncDoc solves these challenges by:**
1. Storing documents as an ordered array of immutable/addressable **AST blocks** with stable unique IDs.
2. Synchronizing document state across clients using **Yjs CRDTs** over low-latency WebSockets with automatic conflict resolution.
3. Enforcing **pre-save Mongoose schema validation** and atomic AST mutation operations (`CREATE_BLOCK`, `UPDATE_BLOCK`, `DELETE_BLOCK`, `MOVE_BLOCK`).
4. Providing a dedicated server-side **Puppeteer rendering pipeline** that guarantees pixel-perfect PDF and HTML exports.

---

## 3. Key Features

- **Real-Time Collaboration:** Synchronous multi-client editing powered by Yjs and WebSockets with connection status monitoring.
- **Hierarchical AST Block Engine:** First-class support for Heading, Paragraph, Code (with language selection), and List blocks.
- **Atomic AST Changes API:** RESTful endpoint for granular block mutations with payload validation and automatic document versioning.
- **Export Pipeline:** One-click instant exports to clean HTML5 documents and publication-grade A4 PDF binaries.
- **Workspace Dashboard:** Centralized dashboard to search, organize, create, and manage documents with live metadata.
- **Full Authentication & Profile Suite:** Secure registration, login, profile management, and password update endpoints backed by bcrypt password hashing.
- **Enterprise Security:** Helmet HTTP headers, strict CORS controls, NoSQL injection filtering, Prototype Pollution prevention, XSS escaping, and Puppeteer SSRF defenses.

---

## 4. Technologies Used

### Frontend
- **React 19:** Modern component-driven UI with state hooks and optimized rendering.
- **Vite:** High-speed development server and optimized production bundler.
- **Yjs:** Conflict-free Replicated Data Type (CRDT) framework for real-time document state synchronization.
- **Vanilla CSS:** Custom design tokens, responsive CSS grid/flexbox layouts, and sleek dark-mode aesthetics.
- **Oxlint:** High-performance JavaScript/JSX linter for code health.

### Backend
- **Node.js & Express:** Robust REST API server with modular routing and middleware architecture.
- **TypeScript & tsx:** Strict static typing with live reload during development.
- **ws (WebSocket):** Lightweight, high-throughput WebSocket server handling real-time collaboration rooms (`/ws?documentId=...`).
- **Puppeteer:** Headless Chromium automation for generating print-ready PDF documents from rendered ASTs.
- **Bcryptjs:** Secure password hashing with salt rounds.
- **Helmet & CORS:** Security header hardening and cross-origin resource sharing protection.

### Database
- **MongoDB & Mongoose:** Document database with typed schemas, subdocument validation, indexation, and optimistic concurrency versioning.

---

## 5. System Architecture

```
+-----------------------------------------------------------------------------+
|                             SyncDoc Frontend                                |
|  (React 19, Vite, Workspace Dashboard, Block Editor, Yjs Realtime Client)  |
+-----------------------------------------------------------------------------+
         |                                                 ^
         | HTTP REST (CRUD, Auth, Export)                  | WebSocket (/ws)
         v                                                 v
+-----------------------------------------------------------------------------+
|                             SyncDoc Backend                                 |
|  (Express + TypeScript + WebSocket Collaboration Server + Puppeteer Engine) |
+-----------------------------------------------------------------------------+
         |                                                 |
         | Mongoose ODM                                    | Headless Chromium
         v                                                 v
+------------------------------------+          +-----------------------------+
|         MongoDB Database           |          |      Puppeteer Export       |
|  (Users, Documents, AST Subnodes)  |          |  (HTML5 Standalone / PDF)   |
+------------------------------------+          +-----------------------------+
```

---

## 6. Frontend Architecture & Components

The frontend is structured into modular, reusable components:

- **`App.jsx`**: Top-level coordinator managing authentication state, active view routing (`login`, `workspace`, `editor`, `settings`), and toast notifications.
- **`WorkspaceDashboard.jsx`**: Central document management view with document search, recent files, template creation, and document cards.
- **`DocumentSidebar.jsx`**: Left drawer for quick document navigation, document renaming, and safe deletion confirmation dialogs.
- **`EditorHeader.jsx`**: Header bar featuring editable document title, real-time connection status indicator, and export buttons.
- **`EditorBlock.jsx`**: Core block renderer allowing live text manipulation, code language toggling, and list item management.
- **`AddBlockMenu.jsx`**: Interactive floating action bar to insert new AST blocks (Heading, Paragraph, Code, List) at any position.
- **`ConnectionStatus.jsx`**: Visual badge displaying real-time WebSocket connectivity (`Connected`, `Connecting`, `Disconnected`).
- **`LoginPage.jsx`**: Clean tabbed authentication interface supporting user login and registration.
- **`SettingsPage.jsx`**: User account configuration view for updating personal information and changing security passwords.
- **`useYjsDocument.js`**: Custom React hook synchronizing local editor state with Yjs shared types and remote WebSockets.
- **`astAdapter.js`**: Bidirectional mapper transforming backend AST structures into Yjs CRDT shared arrays.

---

## 7. Backend Architecture & AST Engine

The backend implements a decoupled layered architecture:

- **Controllers:** `authController.ts`, `documentController.ts`, `exportController.ts`.
- **Services:** `authService.ts`, `documentService.ts`, `exportService.ts`, `pdfService.ts`.
- **Realtime Layer:** `collaborationServer.ts`, `roomManager.ts`, `documentRoom.ts`, `yjsSync.ts`, `astYjsMap.ts`, `persistence.ts`.
- **Validation & Security:** `validationMiddleware.ts`, `astValidator.ts`, `astChangeValidator.ts`.

### AST Node Structure
Every document content element conforms to the `AstBlock` interface:
```typescript
interface AstBlock {
  id: string; // Unique persistent identifier (e.g., "b1", "uuid")
  type: "heading" | "paragraph" | "code" | "list";
  data:
    | { text: string } // Heading & Paragraph
    | { language: string; code: string } // Code Block
    | { ordered: boolean; items: string[] }; // List Block
}
```

### Supported Change Operations (`POST /api/documents/:id/changes`)
- `CREATE_BLOCK`: Appends or inserts a new block at a specified target index.
- `UPDATE_BLOCK`: Modifies the content payload of an existing block while keeping its ID.
- `DELETE_BLOCK`: Safely removes a block from the document AST.
- `MOVE_BLOCK`: Reorders an existing block to a new position.

---

## 8. Export Pipeline

SyncDoc provides server-side document compilation:

1. **HTML Export (`GET /api/documents/:id/export?format=html`):**
   - Traverses the document AST and translates each block to semantic HTML5 elements.
   - Injects clean, responsive CSS typography and syntax container styles.
   - Automatically sanitizes user content to prevent XSS.

2. **PDF Export (`GET /api/documents/:id/export?format=pdf`):**
   - Compiles the AST into an HTML document.
   - Spawns a headless Puppeteer browser instance.
   - Intercepts requests to block unauthorized network or file access (`file://`, `ftp://`).
   - Renders and streams an A4 binary PDF file attachment with sanitized filename headers.

---

## 9. Security Implementation

- **NoSQL Injection Defense:** Middleware scans and strips MongoDB operator keys (`$gt`, `$ne`, etc.) from incoming requests.
- **Prototype Pollution Prevention:** Rejects malicious payloads containing `__proto__`, `constructor`, or `prototype`.
- **Strict Input Validation:** Enforces MongoDB 24-character hexadecimal ObjectId format and validated block schemas.
- **Payload Size Limits:** Express JSON body parser and WebSocket frames are capped at 1MB to prevent Denial of Service (DoS).
- **HTTP Security Headers:** Integrated `helmet` middleware configures XSS filtering, frameguard, and content security policies.
- **SSRF Interception:** Puppeteer page requests block local filesystem and arbitrary protocol access.

---

## 10. Installation & Setup

### Prerequisites
- **Node.js** (v18.x or higher recommended)
- **npm** (v9.x or higher)
- **MongoDB** (Local instance or MongoDB Atlas connection string)

### 1. Backend Setup

```bash
cd SyncDoc/backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `SyncDoc/backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/syncdoc
FRONTEND_ORIGIN=http://localhost:5173
```

### 2. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `SyncDoc/frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_WS_BASE_URL=ws://localhost:5000
```

---

## 11. How to Run Locally

### Run Backend Server
```bash
cd SyncDoc/backend
npm run dev
```
*The backend API server and WebSocket endpoint will start at `http://localhost:5000`.*

### Run Frontend Development Server
```bash
cd SyncDoc/frontend
npm run dev
```
*The Vite development server will start at `http://localhost:5173` (or the port specified in terminal).*

### Running Verification Tests
```bash
cd SyncDoc/backend

# Typecheck TypeScript codebase
npm run typecheck

# Execute core AST engine test suite
npm run test

# Run export pipeline tests
npm run test:export:api
npm run test:export:complete
npm run test:export:pdf

# Run security test suite
npm run test:security
```

---

## 12. Screenshots Section

| Screen / Feature | Description |
|---|---|
| **Workspace Dashboard** | Central overview displaying user documents, search filtering, and quick-create options. |
| **AST Block Editor** | Rich block-level editor with Heading, Paragraph, Code, and List elements with real-time sync. |
| **Live Collaboration** | Instant synchronization between concurrent browser tabs with connection status badge. |
| **HTML & PDF Export** | Exported document previews demonstrating clean typography and publication-ready formatting. |
| **Account & Profile Settings** | User settings interface for updating personal details and managing credentials. |

*(Screenshots can be added under `docs/screenshots/` or embedded in project documentation).*

---

## 13. Future Improvements

- **Inline Rich Text Formatting:** Add inline bold, italic, underline, strikethrough, and hyperlinking within blocks.
- **Granular Permissions & Sharing:** Role-based access control (Owner, Editor, Viewer, Commenter) with shareable invite links.
- **Visual Version History:** Interactive timeline slider to view historical revisions and restore earlier document snapshots.
- **Live User Presence & Cursor Tracking:** Display real-time remote user avatars and cursor position markers.
- **Image & Asset Storage:** Cloud storage integration (AWS S3 / Cloudinary) for drag-and-drop image and media blocks.
- **Markdown & Notion Importer:** Import existing documents directly from Markdown (.md) and Notion workspace exports.
- **Offline Mode & PWA:** Local IndexedDB caching with automatic conflict-free synchronization upon reconnecting.