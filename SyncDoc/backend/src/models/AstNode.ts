import { Schema } from "mongoose";
import { randomUUID } from "crypto";

export type BlockType = "heading" | "paragraph" | "code" | "list";

export const SUPPORTED_BLOCK_TYPES: readonly string[] = ["heading", "paragraph", "code", "list"];

export interface HeadingBlockData {
  text: string;
}

export interface ParagraphBlockData {
  text: string;
}

export interface CodeBlockData {
  language: string;
  code: string;
}

export interface ListBlockData {
  ordered: boolean;
  items: string[];
}

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  data: HeadingBlockData;
}

export interface ParagraphBlock extends BaseBlock {
  type: "paragraph";
  data: ParagraphBlockData;
}

export interface CodeBlock extends BaseBlock {
  type: "code";
  data: CodeBlockData;
}

export interface ListBlock extends BaseBlock {
  type: "list";
  data: ListBlockData;
}

export type AstBlock = HeadingBlock | ParagraphBlock | CodeBlock | ListBlock;

// Base schema for a block
export const BlockSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      default: () => randomUUID(),
    },
    type: {
      type: String,
      required: true,
      enum: ["heading", "paragraph", "code", "list"],
    },
  },
  {
    _id: false,
    discriminatorKey: "type",
  }
);

// Heading data schema
export const HeadingSchema = new Schema(
  {
    data: {
      text: {
        type: String,
        required: [true, "Heading block data requires text"],
      },
    },
  },
  { _id: false }
);

// Paragraph data schema
export const ParagraphSchema = new Schema(
  {
    data: {
      text: {
        type: String,
        default: "",
        validate: {
          validator: (val: unknown) => typeof val === "string",
          message: "Paragraph block data requires text to be a string",
        },
      },
    },
  },
  { _id: false }
);

// Code block data schema
export const CodeSchema = new Schema(
  {
    data: {
      language: {
        type: String,
        required: [true, "Code block data requires a language"],
      },
      code: {
        type: String,
        default: "",
        validate: {
          validator: (val: unknown) => typeof val === "string",
          message: "Code block data requires code to be a string",
        },
      },
    },
  },
  { _id: false }
);

// List block data schema
export const ListSchema = new Schema(
  {
    data: {
      ordered: {
        type: Boolean,
        required: [true, "List block data requires ordered flag"],
      },
      items: {
        type: [Schema.Types.Mixed],
        required: [true, "List block data requires items array"],
        validate: {
          validator: (val: unknown) => {
            if (!Array.isArray(val)) return false;
            return val.every((item) => typeof item === "string");
          },
          message: "List items must be an array of strings",
        },
      },
    },
  },
  { _id: false }
);
