import * as Y from "yjs";
import type {
  AstBlock,
  BlockType,
  HeadingBlock,
  ParagraphBlock,
  CodeBlock,
  ListBlock,
} from "../models/AstNode.js";

/**
 * Converts a plain JS AST Block object into a Y.Map representation.
 */
export function astBlockToYMap(block: AstBlock): Y.Map<unknown> {
  const yBlock = new Y.Map<unknown>();
  yBlock.set("id", block.id);
  yBlock.set("type", block.type);

  const yData = new Y.Map<unknown>();
  const data = (block.data as unknown) as Record<string, unknown>;

  if (block.type === "heading" || block.type === "paragraph") {
    yData.set("text", typeof data.text === "string" ? data.text : "");
  } else if (block.type === "code") {
    yData.set("language", typeof data.language === "string" ? data.language : "text");
    yData.set("code", typeof data.code === "string" ? data.code : "");
  } else if (block.type === "list") {
    yData.set("ordered", Boolean(data.ordered));
    const yItems = new Y.Array<string>();
    if (Array.isArray(data.items)) {
      yItems.insert(0, data.items.map((i) => String(i)));
    }
    yData.set("items", yItems);
  }

  yBlock.set("data", yData);
  return yBlock;
}

/**
 * Converts a Y.Map representation of a block into a plain TypeScript AstBlock object.
 */
export function yMapToAstBlock(yBlock: Y.Map<unknown>): AstBlock | null {
  const id = yBlock.get("id");
  const type = yBlock.get("type");
  const yData = yBlock.get("data");

  if (typeof id !== "string" || typeof type !== "string") {
    return null;
  }

  let dataObj: Record<string, unknown> = {};

  if (yData instanceof Y.Map) {
    const rawMap = yData.toJSON() as Record<string, unknown>;
    dataObj = { ...rawMap };
    const itemsVal = yData.get("items");
    if (itemsVal instanceof Y.Array) {
      dataObj.items = itemsVal.toArray().map((item) => String(item));
    }
  } else if (yData && typeof yData === "object") {
    dataObj = { ...(yData as Record<string, unknown>) };
  }

  const blockType = type as BlockType;

  switch (blockType) {
    case "heading": {
      return {
        id,
        type: "heading",
        data: {
          text: typeof dataObj.text === "string" ? dataObj.text : "",
        },
      } as HeadingBlock;
    }
    case "paragraph": {
      return {
        id,
        type: "paragraph",
        data: {
          text: typeof dataObj.text === "string" ? dataObj.text : "",
        },
      } as ParagraphBlock;
    }
    case "code": {
      return {
        id,
        type: "code",
        data: {
          language: typeof dataObj.language === "string" ? dataObj.language : "text",
          code: typeof dataObj.code === "string" ? dataObj.code : "",
        },
      } as CodeBlock;
    }
    case "list": {
      const items = Array.isArray(dataObj.items)
        ? dataObj.items.map((i) => String(i))
        : [];
      return {
        id,
        type: "list",
        data: {
          ordered: Boolean(dataObj.ordered),
          items,
        },
      } as ListBlock;
    }
    default:
      return null;
  }
}

/**
 * Populates a Y.Doc instance with an array of AST blocks.
 * Overwrites existing content in the Y.Doc's "blocks" Y.Array.
 */
export function astToYDoc(blocks: AstBlock[], doc?: Y.Doc): Y.Doc {
  const yDoc = doc ?? new Y.Doc();
  const yBlocks = yDoc.getArray<Y.Map<unknown>>("blocks");

  yDoc.transact(() => {
    if (yBlocks.length > 0) {
      yBlocks.delete(0, yBlocks.length);
    }
    const yMapArray = blocks.map((b) => astBlockToYMap(b));
    yBlocks.insert(0, yMapArray);
  });

  return yDoc;
}

/**
 * Extracts an array of typed AST blocks from a Y.Doc instance.
 */
export function yDocToAST(yDoc: Y.Doc): AstBlock[] {
  const yBlocks = yDoc.getArray<Y.Map<unknown>>("blocks");
  const result: AstBlock[] = [];

  for (let i = 0; i < yBlocks.length; i++) {
    const yBlock = yBlocks.get(i);
    if (yBlock instanceof Y.Map) {
      const block = yMapToAstBlock(yBlock);
      if (block) {
        result.push(block);
      }
    }
  }

  return result;
}
