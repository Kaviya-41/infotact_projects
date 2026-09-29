import { Schema, model, type Document as MongooseDocument, type Types } from "mongoose";
import {
  type AstBlock,
  BlockSchema,
  HeadingSchema,
  ParagraphSchema,
  CodeSchema,
  ListSchema,
} from "./AstNode.js";
import { validateDocumentAST } from "../validators/astValidator.js";
import { normalizeAST } from "../utils/astUtils.js";

export interface IDocument {
  _id?: string | Types.ObjectId;
  title: string;
  ownerId: string;
  version: number;
  blocks: AstBlock[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type DocumentDocument = IDocument & MongooseDocument;

const DocumentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
    },
    ownerId: {
      type: String,
      required: [true, "Document ownerId is required"],
      trim: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    blocks: [BlockSchema],
  },
  {
    timestamps: true,
  }
);

// Apply discriminators to the blocks array path
const blocksArray = DocumentSchema.path("blocks") as Schema.Types.DocumentArray;

blocksArray.discriminator("heading", HeadingSchema);
blocksArray.discriminator("paragraph", ParagraphSchema);
blocksArray.discriminator("code", CodeSchema);
blocksArray.discriminator("list", ListSchema);

// Mongoose Pre-Save Hook for AST Normalization & Recursive Validation
DocumentSchema.pre("save", function () {
  const docObj = this.toObject();
  const normalized = normalizeAST(docObj as unknown as Record<string, unknown>);

  if (typeof normalized.title === "string") this.title = normalized.title;
  if (typeof normalized.ownerId === "string") this.ownerId = normalized.ownerId;
  if (Array.isArray(normalized.blocks)) this.blocks = normalized.blocks as AstBlock[];

  const validationResult = validateDocumentAST(this.toObject());

  if (!validationResult.isValid) {
    const errorMsg = validationResult.errors.map((e) => `${e.path}: ${e.message}`).join("; ");
    const err = new Error(`AST Validation Failed: ${errorMsg}`);
    err.name = "ValidationError";
    (err as unknown as Record<string, unknown>).errorsArray = validationResult.errors;
    throw err;
  }
});

export const Document = model<IDocument>("Document", DocumentSchema);
export default Document;
