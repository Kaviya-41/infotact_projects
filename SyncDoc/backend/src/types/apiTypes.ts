import type { AstBlock, BlockType, HeadingBlockData, ParagraphBlockData, CodeBlockData, ListBlockData } from "../models/AstNode.js";
import type { IDocument } from "../models/Document.js";

// ─── Request DTOs ───────────────────────────────────────────────────────────

/**
 * Request body for POST /api/documents
 * Must include all required document fields.
 */
export interface CreateDocumentRequest {
  title: string;
  ownerId: string;
  blocks: AstBlock[];
}

/**
 * Request body for PUT /api/documents/:id
 * All fields are optional — only provided fields are updated.
 * Immutable fields (_id, createdAt, updatedAt, ownerId) must NOT be accepted.
 */
export interface UpdateDocumentRequest {
  title?: string;
  blocks?: AstBlock[];
}

// ─── Response DTOs ──────────────────────────────────────────────────────────

/**
 * Standard block response matching the AST contract.
 * This mirrors the AstBlock union but is documented here for API consumers.
 */
export interface BlockResponse {
  id: string;
  type: BlockType;
  data: HeadingBlockData | ParagraphBlockData | CodeBlockData | ListBlockData;
}

/**
 * Single document response payload returned by GET /api/documents/:id
 * and included in POST/PUT responses.
 */
export interface DocumentResponse {
  _id: string;
  title: string;
  ownerId: string;
  version: number;
  blocks: BlockResponse[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Paginated list response returned by GET /api/documents
 */
export interface DocumentListResponse {
  success: boolean;
  message: string;
  data: DocumentResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Standard success response envelope wrapping a single document.
 */
export interface SingleDocumentResponse {
  success: boolean;
  message: string;
  data: DocumentResponse;
}

/**
 * Standard error response returned for validation failures and not-found errors.
 */
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    path: string;
    message: string;
  }>;
}

// Re-export AST types for convenience so consumers only need one import
export type { AstBlock, BlockType, HeadingBlockData, ParagraphBlockData, CodeBlockData, ListBlockData, IDocument };
export type {
  ASTOperation,
  AstOperation,
  ASTChange,
  AstChange,
  ASTChangePayload,
  ASTChangeResult,
  AstChangeResult,
  CreateBlockPayload,
  UpdateBlockPayload,
  DeleteBlockPayload,
  MoveBlockPayload,
} from "./astChangeTypes.js";

