import type {
  BlockType,
  HeadingBlockData,
  ParagraphBlockData,
  CodeBlockData,
  ListBlockData,
} from "../models/AstNode.js";

/**
 * Supported AST Change Operations.
 */
export type ASTOperation =
  | "CREATE_BLOCK"
  | "UPDATE_BLOCK"
  | "DELETE_BLOCK"
  | "MOVE_BLOCK";

// Alias for camelCase / PascalCase consistency
export type AstOperation = ASTOperation;

/**
 * Payload for CREATE_BLOCK operation.
 */
export interface CreateBlockPayload {
  type: BlockType;
  data: HeadingBlockData | ParagraphBlockData | CodeBlockData | ListBlockData;
  targetIndex?: number;
}

/**
 * Payload for UPDATE_BLOCK operation.
 */
export interface UpdateBlockPayload {
  type?: BlockType;
  data?: Partial<HeadingBlockData | ParagraphBlockData | CodeBlockData | ListBlockData> | Record<string, unknown>;
  text?: string;
  language?: string;
  code?: string;
  ordered?: boolean;
  items?: string[];
  [key: string]: unknown;
}

/**
 * Payload for DELETE_BLOCK operation (optional or empty object).
 */
export interface DeleteBlockPayload {
  [key: string]: unknown;
}

/**
 * Payload for MOVE_BLOCK operation.
 */
export interface MoveBlockPayload {
  targetIndex: number;
}

/**
 * Union of operation-specific payloads.
 */
export type ASTChangePayload =
  | CreateBlockPayload
  | UpdateBlockPayload
  | DeleteBlockPayload
  | MoveBlockPayload;

/**
 * Strongly typed AST Change representation for block-level modifications.
 */
export interface ASTChange {
  documentId: string;
  blockId: string;
  operation: ASTOperation;
  version?: number;
  payload?: ASTChangePayload;
}

export type AstChange = ASTChange;

/**
 * Result returned when an AST change succeeds.
 */
export interface ASTChangeSuccessResult {
  success: true;
  ast: import("../models/Document.js").IDocument;
}

/**
 * Result returned when an AST change fails validation or application.
 */
export interface ASTChangeErrorResult {
  success: false;
  message: string;
  errors?: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Predictable result envelope for applyASTChange().
 */
export type ASTChangeResult = ASTChangeSuccessResult | ASTChangeErrorResult;
export type AstChangeResult = ASTChangeResult;
