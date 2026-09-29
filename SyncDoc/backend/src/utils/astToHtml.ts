import type {
  AstBlock,
  HeadingBlock,
  ParagraphBlock,
  CodeBlock,
  ListBlock,
} from "../models/AstNode.js";

/**
 * Escapes special HTML characters to prevent XSS injection.
 * This is the standard approach for safely embedding user-provided
 * text content within generated HTML output.
 *
 * Characters escaped: & < > " '
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Converts a heading block to an HTML heading element.
 * Uses <h1> since the AST schema does not include a heading level field.
 * If a `level` field is later added to the AST, this should be updated.
 */
export function renderHeadingBlock(block: HeadingBlock): string {
  const escapedText = escapeHtml(block.data.text);
  return `<h1>${escapedText}</h1>`;
}

/**
 * Converts a paragraph block to an HTML <p> element.
 */
export function renderParagraphBlock(block: ParagraphBlock): string {
  const escapedText = escapeHtml(block.data.text);
  return `<p>${escapedText}</p>`;
}

/**
 * Converts a code block to an HTML <pre><code> structure.
 * The language is included as a CSS class following the common
 * `language-xxx` convention (compatible with Prism.js, highlight.js, etc.).
 */
export function renderCodeBlock(block: CodeBlock): string {
  const escapedCode = escapeHtml(block.data.code);
  const escapedLanguage = escapeHtml(block.data.language);
  return `<pre><code class="language-${escapedLanguage}">${escapedCode}</code></pre>`;
}

/**
 * Converts a list block to an HTML <ol> or <ul> element
 * based on the `ordered` flag in the AST data.
 */
export function renderListBlock(block: ListBlock): string {
  const tag = block.data.ordered ? "ol" : "ul";
  const items = block.data.items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  return `<${tag}>${items}</${tag}>`;
}

/**
 * Renders a single AST block to its HTML representation.
 * Throws an error for unsupported block types to prevent
 * silent data loss during transformation.
 */
export function renderBlock(block: AstBlock): string {
  switch (block.type) {
    case "heading":
      return renderHeadingBlock(block);
    case "paragraph":
      return renderParagraphBlock(block);
    case "code":
      return renderCodeBlock(block);
    case "list":
      return renderListBlock(block);
    default: {
      // Exhaustive check — TypeScript will error if a new BlockType
      // is added to the union without being handled here
      const _exhaustive: never = block;
      throw new Error(`Unsupported block type: ${((_exhaustive) as { type: string }).type}`);
    }
  }
}

/**
 * Transforms an array of AST blocks into a complete HTML document string.
 *
 * Produces a valid HTML5 document with:
 *   - UTF-8 charset declaration
 *   - Document title from the provided `title` parameter
 *   - All blocks rendered in order as the document body
 *
 * Block ordering is strictly preserved from the source AST.
 *
 * @param blocks - Array of validated AST blocks
 * @param title - Document title for the <title> tag
 * @returns Complete HTML5 document string
 */
export function blocksToHtml(blocks: AstBlock[], title: string): string {
  if (!Array.isArray(blocks)) {
    throw new Error("blocks must be an array");
  }

  const bodyContent = blocks.map((block) => renderBlock(block)).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
    color: #1a1a1a;
    background: #fff;
  }
  h1 { font-size: 1.8rem; margin: 1.5rem 0 0.75rem; border-bottom: 1px solid #e5e5e5; padding-bottom: 0.3rem; }
  p { margin: 0.75rem 0; }
  pre {
    background: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 1rem;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 0.9rem;
  }
  code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; }
  ol, ul { padding-left: 1.5rem; margin: 0.75rem 0; }
  li { margin: 0.25rem 0; }
</style>
</head>
<body>
${bodyContent}
</body>
</html>`;
}

/**
 * Transforms an array of AST blocks into an HTML fragment (body-only, no wrapper).
 * Useful when embedding the output inside another template or for API responses
 * where only the content portion is needed.
 *
 * @param blocks - Array of validated AST blocks
 * @returns HTML fragment string (no <html>/<head>/<body> wrapper)
 */
export function blocksToHtmlFragment(blocks: AstBlock[]): string {
  if (!Array.isArray(blocks)) {
    throw new Error("blocks must be an array");
  }

  return blocks.map((block) => renderBlock(block)).join("\n");
}
