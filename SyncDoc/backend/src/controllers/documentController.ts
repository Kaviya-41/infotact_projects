import type { Request, Response, NextFunction } from "express";
import documentService from "../services/documentService.js";
import type { CreateDocumentRequest, UpdateDocumentRequest } from "../types/apiTypes.js";

function getParamId(req: Request): string {
  const id = req.params.id;
  if (Array.isArray(id)) return id[0];
  return id ?? "";
}

const documentController = {
  /** POST /api/documents */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, ownerId, blocks } = req.body as CreateDocumentRequest;

      const doc = await documentService.create({
        title,
        ownerId,
        blocks,
      });

      res.status(201).json({
        success: true,
        message: "Document created successfully",
        data: doc,
      });
    } catch (error: unknown) {
      next(error);
    }
  },

  /** GET /api/documents/:id */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doc = await documentService.getById(getParamId(req));

      if (!doc) {
        res.status(404).json({
          success: false,
          message: "Document not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Document retrieved successfully",
        data: doc,
      });
    } catch (error: unknown) {
      next(error);
    }
  },

  /** GET /api/documents */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawOwnerId = req.query.ownerId;
      const rawPage = req.query.page;
      const rawLimit = req.query.limit;

      // Extract string representations safely to prevent MongoDB query operator injection
      const ownerId = typeof rawOwnerId === "string" ? rawOwnerId : undefined;
      const pageStr = typeof rawPage === "string" ? rawPage : undefined;
      const limitStr = typeof rawLimit === "string" ? rawLimit : undefined;

      const result = await documentService.list({
        ownerId,
        page: pageStr ? Number(pageStr) : undefined,
        limit: limitStr ? Number(limitStr) : undefined,
      });

      res.status(200).json({
        success: true,
        message: "Documents retrieved successfully",
        data: result.documents,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error: unknown) {
      next(error);
    }
  },

  /** PUT /api/documents/:id */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, blocks } = req.body as UpdateDocumentRequest;

      const doc = await documentService.update(getParamId(req), {
        title,
        blocks,
      });

      if (!doc) {
        res.status(404).json({
          success: false,
          message: "Document not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Document updated successfully",
        data: doc,
      });
    } catch (error: unknown) {
      next(error);
    }
  },

  /** DELETE /api/documents/:id */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await documentService.delete(getParamId(req));

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Document not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error: unknown) {
      next(error);
    }
  },

  /** POST /api/documents/:id/changes */
  async applyChange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const change = req.body as import("../types/astChangeTypes.js").ASTChange;
      const docId = getParamId(req);
      if (change && typeof change === "object" && !change.documentId) {
        change.documentId = docId;
      }

      const result = await documentService.applyChange(docId, change);

      if (!result.success) {
        const isNotFound = result.message.includes("not found");
        res.status(isNotFound ? 404 : 400).json(result);
        return;
      }

      res.status(200).json({
        success: true,
        message: "AST change applied successfully",
        data: result.ast,
      });
    } catch (error: unknown) {
      next(error);
    }
  },
};

export default documentController;
