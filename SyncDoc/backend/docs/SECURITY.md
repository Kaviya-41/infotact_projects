# SyncDoc Security Architecture & Hardening Specification

## Overview

SyncDoc Backend (Member 1 Responsibility) enforces a defense-in-depth security model to protect the collaborative document engine, AST structural integrity, MongoDB persistence, and export pipeline (HTML & PDF) against production threats.

---

## Security Architecture Summary

```
                       ┌────────────────────────────────────────┐
                       │           HTTP Request                 │
                       └───────────────────┬────────────────────┘
                                           │
                                           ▼
                       ┌────────────────────────────────────────┐
                       │ Express Security & Core Middleware     │
                       │ - Helmet (HTTP Security Headers)       │
                       │ - CORS (Configurable Origin)           │
                       │ - express.json({ limit: "1mb" })       │
                       └───────────────────┬────────────────────┘
                                           │
                                           ▼
                       ┌────────────────────────────────────────┐
                       │ Input & Route Validation Layer         │
                       │ - validateObjectId (24-hex ObjectId)   │
                       │ - sanitizeFilename (CRLF/Header Guard) │
                       │ - containsMongoOperator (Recursive $)  │
                       │ - queryParamSanitization (ownerId/page)│
                       └───────────────────┬────────────────────┘
                                           │
                                           ▼
                       ┌────────────────────────────────────────┐
                       │ AST Validation & Normalization Engine  │
                       │ - normalizeAST (Prototype Key Guard)   │
                       │ - validateDocument / validateBlocks    │
                       │ - validateASTChange (Immutable ID)     │
                       └───────────────────┬────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
      ┌───────────────────────────────────┐ ┌───────────────────────────────────┐
      │     MongoDB Persistence Layer     │ │      Export Pipeline Layer        │
      │ - DocumentSchema Pre-Save Hook    │ │ - escapeHtml (XSS Entity Encoding)│
      │ - Mongoose Schema Discriminators  │ │ - Puppeteer Sandbox & Net Intercept│
      └───────────────────────────────────┘ └───────────────────────────────────┘
```

---

## Core Security Mechanisms

### 1. HTTP Security & Headers
- **Helmet**: Adds standard security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`, `X-DNS-Prefetch-Control`).
- **CORS**: Origin configuration managed dynamically via `process.env.FRONTEND_ORIGIN` (defaults to wildcard `*` in local dev).
- **Request Body Limit**: Explicitly configured to `1mb` (`express.json({ limit: "1mb" })`) to prevent Denial-of-Service (DoS) memory exhaustion.

### 2. Input Validation & Injection Protections
- **MongoDB Operator Injection Protection**: 
  - `containsMongoOperator()` recursively checks request body keys for `$` operators (`$set`, `$inc`, `$push`, `$where`, etc.) and rejects payloads containing them with HTTP 400 Bad Request.
  - Query parameters (e.g. `GET /api/documents?ownerId[...]`) are strictly typed as string primitives in `documentController.list()`, preventing object-based query injection.
- **ObjectId Validation**: `validateObjectId` enforces 24-character hexadecimal ObjectId format prior to routing.
- **Update Field Restriction**: `PUT /api/documents/:id` restricts updatable fields strictly to `title` and `blocks`. Immutable fields (`ownerId`, `version`, `_id`) are rejected.

### 3. Prototype Pollution Guards
- `normalizeAST` and `normalizeBlock` filter out unsafe property keys (`__proto__`, `constructor`, `prototype`) during object copying and normalization.

### 4. AST Structural Security
- **Strict Block Types**: Accepts only `heading`, `paragraph`, `code`, `list`.
- **Recursive Structural Validation**: Validates block IDs, required data fields, and array structures without altering valid user text.
- **Idempotent Normalization**: Whitespace metadata trimming without data loss or coercion.

### 5. Export & PDF Generation Security
- **XSS Prevention**: `escapeHtml()` entity-encodes `&`, `<`, `>`, `"`, `'` across all document content and document titles before HTML compilation.
- **HTTP Response Header Injection Prevention**: `sanitizeFilename()` strips carriage returns (`\r`) and newlines (`\n`) and replaces non-alphanumeric symbols in Content-Disposition header filenames.
- **Puppeteer Sandboxing & Request Interception**:
  - Puppeteer launches Chromium with `--no-sandbox`, `--disable-setuid-sandbox`, and `--disable-dev-shm-usage`.
  - Request interception (`page.setRequestInterception(true)`) blocks requests attempting to access local files (`file://`), FTP, or gopher protocols.
  - Browser process termination is strictly enforced via `finally` blocks.

### 6. Error Response Sanitization
- Global error handler (`errorHandler.ts`) catches all errors and returns sanitized HTTP responses.
- Stack traces, database connection strings (`MONGO_URI`), internal file paths, and environment secrets are never returned to clients.

---

## Authentication & Authorization Boundary (Milestone Limitation)

> [!IMPORTANT]
> **Authentication/Authorization Status**:
> Authentication and permission enforcement (`JWT`, `OAuth`, `session`, `ownerId` ownership check) are **outside Member 1's current milestone responsibility**. `ownerId` is currently accepted as a client-provided string. User authentication will be integrated in subsequent project milestones.

---

## Verified Security Test Suite

The security implementation is verified by `npm run test:security`, testing:
1. MongoDB operator injection
2. Invalid ObjectId rejection
3. Invalid AST block type rejection
4. Missing required code block language
5. Missing list ordered flag
6. Unsupported AST change operation
7. HTML/script tag escaping
8. Unsafe document title sanitization
9. Header injection prevention
10. Unexpected update field rejection
11. `$set` / `$inc` update injection rejection
12. Nested dangerous keys and prototype pollution filtering
13. Request body limits
14. Stack trace suppression in 500 error responses
15. Sensitive credentials (MONGO_URI) suppression in error responses
16. Puppeteer local file (`file://`) access blocking
