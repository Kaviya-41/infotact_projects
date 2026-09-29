import mongoose from "mongoose";
import Document, { type IDocument } from "../models/Document.js";
import type { AstBlock } from "../models/AstNode.js";
import type { ASTChange, ASTChangeResult } from "../types/astChangeTypes.js";
import { applyASTChange } from "../utils/astChangeUtils.js";

export interface CreateDocumentInput {
  title: string;
  ownerId: string;
  blocks?: AstBlock[];
}

export interface UpdateDocumentInput {
  title?: string;
  blocks?: AstBlock[];
}

export interface DocumentListQuery {
  ownerId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult {
  documents: IDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// In-Memory fallback store when MongoDB database is unavailable or IP is unwhitelisted
const inMemoryDocsMap = new Map<string, IDocument>();

function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

function generateId(): string {
  return new mongoose.Types.ObjectId().toHexString();
}

function getDefaultBlocks(): AstBlock[] {
  return [
    {
      id: generateId(),
      type: "heading",
      data: { text: "" },
    },
    {
      id: generateId(),
      type: "paragraph",
      data: { text: "" },
    },
  ];
}

function getSampleDemoBlocks(): AstBlock[] {
  return [
    {
      id: generateId(),
      type: "heading",
      data: { text: "🚀 Getting Started with SyncDoc" },
    },
    {
      id: generateId(),
      type: "paragraph",
      data: {
        text: "SyncDoc is a real-time collaborative document editor powered by AST nodes and Yjs. You can write rich text, format code blocks, and create interactive lists simultaneously with your team.",
      },
    },
    {
      id: generateId(),
      type: "code",
      data: {
        language: "javascript",
        code: "// Real-time Collaboration Engine\nfunction syncDocument(docId, change) {\n  console.log(`Applying change to ${docId}:`, change);\n  return { status: 'synced', timestamp: Date.now() };\n}",
      },
    },
    {
      id: generateId(),
      type: "list",
      data: {
        ordered: false,
        items: [
          "⚡ Real-time AST & Yjs synchronization",
          "📄 One-click export to HTML & PDF",
          "🎨 Soft pastel UI with responsive split-screen support",
        ],
      },
    },
  ];
}

const documentService = {
  async create(input: CreateDocumentInput): Promise<IDocument> {
    const blocksToUse = (input.blocks && input.blocks.length > 0) ? input.blocks : getDefaultBlocks();

    if (isDbConnected()) {
      const doc = new Document({
        title: input.title,
        ownerId: input.ownerId,
        blocks: blocksToUse,
        version: 1,
      });
      const saved = await doc.save();
      return saved.toObject() as IDocument;
    }

    // In-memory fallback
    const now = new Date();
    const docId = generateId();
    const newDoc: IDocument = {
      _id: docId,
      title: input.title,
      ownerId: input.ownerId,
      blocks: blocksToUse,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryDocsMap.set(docId, newDoc);
    return newDoc;
  },

  async getById(id: string): Promise<IDocument | null> {
    if (isDbConnected()) {
      const doc = await Document.findById(id).lean<IDocument>();
      return doc;
    }

    return inMemoryDocsMap.get(id) ?? null;
  },

  async list(query: DocumentListQuery): Promise<PaginatedResult> {
    const MAX_LIMIT = 100;
    const DEFAULT_LIMIT = 20;

    let page = query.page ?? 1;
    if (!Number.isFinite(page) || page < 1) page = 1;
    page = Math.floor(page);

    let limit = query.limit ?? DEFAULT_LIMIT;
    if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
    limit = Math.min(Math.floor(limit), MAX_LIMIT);

    if (isDbConnected()) {
      const skip = (page - 1) * limit;
      const filter: Record<string, string> = {};
      if (query.ownerId) {
        filter.ownerId = query.ownerId;
      }

      let [documents, total] = await Promise.all([
        Document.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean<IDocument[]>(),
        Document.countDocuments(filter),
      ]);

      if (total === 0) {
        const initDoc = await this.create({
          title: "Untitled Document",
          ownerId: query.ownerId || "frontend-user",
          blocks: getSampleDemoBlocks(),
        });
        documents = [initDoc];
        total = 1;
      }

      return {
        documents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

    // In-memory fallback
    let docs = Array.from(inMemoryDocsMap.values());
    if (query.ownerId) {
      docs = docs.filter((d) => d.ownerId === query.ownerId);
    }
    docs.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

    // If memory store is empty, automatically create initial document with sample demo blocks
    if (docs.length === 0) {
      const initDoc = await this.create({
        title: "Untitled Document",
        ownerId: query.ownerId || "frontend-user",
        blocks: getSampleDemoBlocks(),
      });
      docs = [initDoc];
    }

    const total = docs.length;
    const skip = (page - 1) * limit;
    const paginatedDocs = docs.slice(skip, skip + limit);

    return {
      documents: paginatedDocs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async update(id: string, input: UpdateDocumentInput): Promise<IDocument | null> {
    if (isDbConnected()) {
      const doc = await Document.findById(id);
      if (!doc) return null;

      if (input.title !== undefined) doc.title = input.title;
      if (input.blocks !== undefined) doc.blocks = input.blocks;
      doc.version += 1;

      const saved = await doc.save();
      return saved.toObject() as IDocument;
    }

    // In-memory fallback
    const doc = inMemoryDocsMap.get(id);
    if (!doc) return null;

    if (input.title !== undefined) doc.title = input.title;
    if (input.blocks !== undefined) doc.blocks = input.blocks;
    doc.version = (doc.version || 1) + 1;
    doc.updatedAt = new Date();

    inMemoryDocsMap.set(id, doc);
    return doc;
  },

  async delete(id: string): Promise<boolean> {
    if (isDbConnected()) {
      const result = await Document.findByIdAndDelete(id);
      return result !== null;
    }

    return inMemoryDocsMap.delete(id);
  },

  async applyChange(id: string, change: ASTChange): Promise<ASTChangeResult> {
    let docObj: IDocument | null = null;

    if (isDbConnected()) {
      const doc = await Document.findById(id);
      if (!doc) {
        return {
          success: false,
          message: `Document '${id}' not found`,
          errors: [{ path: "id", message: "Document not found" }],
        };
      }
      docObj = doc.toObject();
    } else {
      docObj = inMemoryDocsMap.get(id) ?? null;
      if (!docObj) {
        return {
          success: false,
          message: `Document '${id}' not found`,
          errors: [{ path: "id", message: "Document not found" }],
        };
      }
    }

    const changeResult = applyASTChange(docObj, change);
    if (!changeResult.success) {
      return changeResult;
    }

    if (isDbConnected()) {
      const doc = await Document.findById(id);
      if (doc) {
        doc.blocks = changeResult.ast.blocks;
        doc.version = (doc.version || 1) + 1;
        const saved = await doc.save();
        return {
          success: true,
          ast: saved.toObject() as IDocument,
        };
      }
    }

    docObj.blocks = changeResult.ast.blocks;
    docObj.version = (docObj.version || 1) + 1;
    docObj.updatedAt = new Date();
    inMemoryDocsMap.set(id, docObj);

    return {
      success: true,
      ast: docObj,
    };
  },
};

export default documentService;

