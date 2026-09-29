import { Router } from "express";
import documentController from "../controllers/documentController.js";
import exportController from "../controllers/exportController.js";
import {
  validateObjectId,
  validateCreateDocument,
  validateUpdateDocument,
  validateChangeBody,
} from "../middleware/validationMiddleware.js";

const router = Router();

router.post("/", validateCreateDocument, documentController.create);
router.get("/", documentController.list);
router.get("/:id", validateObjectId, documentController.getById);
router.put("/:id", validateObjectId, validateUpdateDocument, documentController.update);
router.post("/:id/changes", validateObjectId, validateChangeBody, documentController.applyChange);
router.delete("/:id", validateObjectId, documentController.delete);

// Week 3: Export pipeline routes
router.get("/:id/export", validateObjectId, exportController.exportDocument);

export default router;

