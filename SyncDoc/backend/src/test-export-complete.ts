/**
 * Week 3 Day 2 — Complete AST → HTML Export Verification
 *
 * This test covers:
 *   - Validated AST → HTML pipeline (validateDocumentAST → export)
 *   - Newlines and indentation in code blocks
 *   - Quotes and special characters in all block types
 *   - Multi-line paragraph content
 *   - Full document HTML structure with embedded CSS
 *   - Invalid AST rejection before export
 *   - Block ordering preservation across all types
 *   - Export service integration
 *
 * Run: npx tsx src/test-export-complete.ts
 */

import {
  escapeHtml,
  renderBlock,
  blocksToHtml,
  blocksToHtmlFragment,
} from "./utils/astToHtml.js";

import { validateDocumentAST } from "./validators/astValidator.js";
import exportService from "./services/exportService.js";

import type {
  HeadingBlock,
  ParagraphBlock,
  CodeBlock,
  ListBlock,
  AstBlock,
} from "./models/AstNode.js";

// ─── Test Helpers ───────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    failures.push(message);
    console.log(`  ❌ ${message}`);
  }
}

function assertIncludes(haystack: string, needle: string, message: string): void {
  assert(haystack.includes(needle), message);
}

function assertNotIncludes(haystack: string, needle: string, message: string): void {
  assert(!haystack.includes(needle), message);
}

// ─── Realistic document matching the real AST contract ──────────────────────

const realisticDocument = {
  title: "SyncDoc Export Test",
  ownerId: "user-member1",
  version: 3,
  blocks: [
    {
      id: "blk-heading-1",
      type: "heading",
      data: { text: "Getting Started with SyncDoc" },
    },
    {
      id: "blk-para-1",
      type: "paragraph",
      data: { text: "SyncDoc is a collaborative document editing engine built with AST-based content representation." },
    },
    {
      id: "blk-code-1",
      type: "code",
      data: {
        language: "typescript",
        code: `import express from "express";\n\nconst app = express();\napp.listen(5000, () => {\n  console.log("Server running");\n});`,
      },
    },
    {
      id: "blk-list-ol-1",
      type: "list",
      data: {
        ordered: true,
        items: ["Install dependencies", "Configure MongoDB", "Run the server"],
      },
    },
    {
      id: "blk-para-2",
      type: "paragraph",
      data: { text: "The architecture uses a layered approach: routes → controllers → services → models." },
    },
    {
      id: "blk-list-ul-1",
      type: "list",
      data: {
        ordered: false,
        items: ["Express.js", "Mongoose", "TypeScript"],
      },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 1: Validate → Export pipeline (real AST flow)
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════");
console.log("SUITE 1: Validate → Export Pipeline");
console.log("═══════════════════════════════════════════════\n");

const validationResult = validateDocumentAST(realisticDocument);
assert(validationResult.isValid === true, "Realistic document passes AST validation");
assert(validationResult.errors.length === 0, "No validation errors on realistic document");

// Only export if validation passed
if (validationResult.isValid) {
  const blocks = realisticDocument.blocks as AstBlock[];
  const html = blocksToHtml(blocks, realisticDocument.title);

  assertIncludes(html, "<!DOCTYPE html>", "Validated AST export produces DOCTYPE");
  assertIncludes(html, "<title>SyncDoc Export Test</title>", "Title from validated document is used");
  assertIncludes(html, "<h1>Getting Started with SyncDoc</h1>", "Heading block exported correctly");
  assertIncludes(html, "<p>SyncDoc is a collaborative document editing engine", "Paragraph block exported");
  assertIncludes(html, '<code class="language-typescript">', "Code block has correct language class");
  assertIncludes(html, "<ol>", "Ordered list exported as <ol>");
  assertIncludes(html, "<ul>", "Unordered list exported as <ul>");
  assertIncludes(html, "<li>Install dependencies</li>", "Ordered list items preserved");
  assertIncludes(html, "<li>Express.js</li>", "Unordered list items preserved");
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 2: Invalid AST rejected before export
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════");
console.log("SUITE 2: Invalid AST Rejection");
console.log("═══════════════════════════════════════════════\n");

const invalidDoc1 = { title: "", ownerId: "user1", blocks: [] };
const result1 = validateDocumentAST(invalidDoc1);
assert(result1.isValid === false, "Empty title rejected by validator");

const invalidDoc2 = {
  title: "Test",
  ownerId: "user1",
  blocks: [{ id: "b1", type: "unknown", data: {} }],
};
const result2 = validateDocumentAST(invalidDoc2);
assert(result2.isValid === false, "Unknown block type rejected by validator");

const invalidDoc3 = {
  title: "Test",
  ownerId: "user1",
  blocks: [{ id: "b1", type: "heading", data: {} }],
};
const result3 = validateDocumentAST(invalidDoc3);
assert(result3.isValid === false, "Heading without text rejected by validator");

const invalidDoc4 = {
  title: "Test",
  ownerId: "user1",
  blocks: [{ id: "b1", type: "list", data: { ordered: true, items: [] } }],
};
const result4 = validateDocumentAST(invalidDoc4);
assert(result4.isValid === false, "Empty list items rejected by validator");

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 3: Code block — newlines, indentation, special characters
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════");
console.log("SUITE 3: Code Block Newlines & Indentation");
console.log("═══════════════════════════════════════════════\n");

const multiLineCode: CodeBlock = {
  id: "code-multiline",
  type: "code",
  data: {
    language: "python",
    code: `def greet(name):\n    if name:\n        print(f"Hello, {name}!")\n    else:\n        print("Hello, World!")`,
  },
};

const codeHtml = renderBlock(multiLineCode);
assertIncludes(codeHtml, "<pre>", "Multi-line code wrapped in <pre>");
assertIncludes(codeHtml, "\n    if name:", "Indentation preserved in code output");
assertIncludes(codeHtml, "\n        print(", "Nested indentation preserved in code output");
assertIncludes(codeHtml, 'class="language-python"', "Code language class is correct");

// Code with tabs and various whitespace
const tabbedCode: CodeBlock = {
  id: "code-tabs",
  type: "code",
  data: {
    language: "go",
    code: "func main() {\n\tfmt.Println(\"Hello\")\n}",
  },
};
const tabbedHtml = renderBlock(tabbedCode);
assertIncludes(tabbedHtml, "\t", "Tab characters preserved in code output");

// Code with HTML-like content that must not execute
const htmlInCode: CodeBlock = {
  id: "code-html",
  type: "code",
  data: {
    language: "html",
    code: '<div class="container">\n  <script>alert("xss")</script>\n  <p>Hello &amp; World</p>\n</div>',
  },
};
const htmlCodeOutput = renderBlock(htmlInCode);
assertNotIncludes(htmlCodeOutput, '<div class="container">', "HTML tags in code content are escaped");
assertNotIncludes(htmlCodeOutput, "<script>", "Script tags in code content are escaped");
assertIncludes(htmlCodeOutput, "&lt;div", "HTML tags in code content are entity-encoded");
assertIncludes(htmlCodeOutput, "&amp;amp;", "Ampersands in code content are double-escaped correctly");

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 4: Quotes and special characters across block types
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════");
console.log("SUITE 4: Quotes & Special Characters");
console.log("═══════════════════════════════════════════════\n");

// Heading with quotes
const quotedHeading: HeadingBlock = {
  id: "h-quotes",
  type: "heading",
  data: { text: 'Chapter 1: "Introduction" & Overview' },
};
const quotedHtml = renderBlock(quotedHeading);
assertIncludes(quotedHtml, "&quot;Introduction&quot;", "Double quotes escaped in heading");
assertIncludes(quotedHtml, "&amp;", "Ampersand escaped in heading");

// Paragraph with single quotes, angles, mixed
const specialParagraph: ParagraphBlock = {
  id: "p-special",
  type: "paragraph",
  data: { text: "It's a < b && b > c scenario with \"edge cases\"" },
};
const specialPHtml = renderBlock(specialParagraph);
assertIncludes(specialPHtml, "&#39;s a &lt; b &amp;&amp; b &gt; c", "Mixed special chars escaped in paragraph");
assertIncludes(specialPHtml, "&quot;edge cases&quot;", "Double quotes escaped in paragraph");

// List with special characters in items
const specialList: ListBlock = {
  id: "l-special",
  type: "list",
  data: {
    ordered: true,
    items: [
      "Use <strong> tags carefully",
      "Escape & sanitize input",
      'Avoid "innerHTML" injection',
    ],
  },
};
const specialListHtml = renderBlock(specialList);
assertIncludes(specialListHtml, "&lt;strong&gt;", "Angle brackets escaped in list items");
assertIncludes(specialListHtml, "&amp; sanitize", "Ampersand escaped in list items");
assertIncludes(specialListHtml, "&quot;innerHTML&quot;", "Quotes escaped in list items");

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 5: Block ordering with all types mixed
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════");
console.log("SUITE 5: Block Ordering (All Types)");
console.log("═══════════════════════════════════════════════\n");

const orderedBlocks: AstBlock[] = [
  { id: "o1", type: "paragraph", data: { text: "First paragraph" } },
  { id: "o2", type: "heading", data: { text: "Middle heading" } },
  { id: "o3", type: "code", data: { language: "js", code: "// third" } },
  { id: "o4", type: "list", data: { ordered: false, items: ["fourth item"] } },
  { id: "o5", type: "paragraph", data: { text: "Fifth paragraph" } },
];

const orderedHtml = blocksToHtmlFragment(orderedBlocks);
const positions = [
  orderedHtml.indexOf("First paragraph"),
  orderedHtml.indexOf("Middle heading"),
  orderedHtml.indexOf("// third"),
  orderedHtml.indexOf("fourth item"),
  orderedHtml.indexOf("Fifth paragraph"),
];

assert(positions.every((p) => p !== -1), "All 5 blocks present in output");
assert(
  positions.every((p, i) => i === 0 || p > positions[i - 1]),
  "All 5 blocks appear in original AST order"
);

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 6: Full HTML document structure (Day 2 — with CSS)
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════");
console.log("SUITE 6: Full HTML Document Structure & CSS");
console.log("═══════════════════════════════════════════════\n");

const fullDoc = blocksToHtml(realisticDocument.blocks as AstBlock[], realisticDocument.title);

assertIncludes(fullDoc, "<!DOCTYPE html>", "Full doc has HTML5 doctype");
assertIncludes(fullDoc, '<html lang="en">', "Full doc has lang attribute");
assertIncludes(fullDoc, '<meta charset="UTF-8">', "Full doc has charset");
assertIncludes(fullDoc, '<meta name="viewport"', "Full doc has viewport meta");
assertIncludes(fullDoc, "<style>", "Full doc has embedded CSS");
assertIncludes(fullDoc, "font-family:", "CSS includes font-family");
assertIncludes(fullDoc, "max-width:", "CSS includes max-width for readability");
assertIncludes(fullDoc, "</style>", "CSS block is properly closed");
assertIncludes(fullDoc, "<body>", "Full doc has body");
assertIncludes(fullDoc, "</body>", "Full doc has closing body");
assertIncludes(fullDoc, "</html>", "Full doc has closing html");

// Verify it's a valid standalone file (no external deps)
assertNotIncludes(fullDoc, '<link rel="stylesheet"', "No external CSS dependencies");
assertNotIncludes(fullDoc, '<script src="', "No external JS dependencies");

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 7: Script injection prevention (comprehensive)
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════");
console.log("SUITE 7: Script Injection Prevention");
console.log("═══════════════════════════════════════════════\n");

const xssVectors: AstBlock[] = [
  {
    id: "xss1",
    type: "heading",
    data: { text: '<script>document.cookie</script>' },
  },
  {
    id: "xss2",
    type: "paragraph",
    data: { text: '<img src=x onerror="fetch(\'//evil.com\')"><b>bold</b>' },
  },
  {
    id: "xss3",
    type: "code",
    data: {
      language: "javascript",
      code: 'document.write("<script>alert(1)</script>")',
    },
  },
  {
    id: "xss4",
    type: "list",
    data: {
      ordered: false,
      items: [
        '<a href="javascript:alert(1)">click</a>',
        '"><img src=x onerror=alert(1)>',
      ],
    },
  },
];

const xssHtml = blocksToHtmlFragment(xssVectors);
// Count raw <script> occurrences — should be 0
const rawScriptCount = (xssHtml.match(/<script>/g) || []).length;
assert(rawScriptCount === 0, "Zero raw <script> tags in XSS test output");
assertNotIncludes(xssHtml, '<img src=x', "No raw img tags with event handlers in output");
assertIncludes(xssHtml, "&lt;img", "Img tag is entity-encoded (safe)");
assertNotIncludes(xssHtml, '<a href="javascript:', "No javascript: URLs in output");

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 8: Export service integration (validate → service → output)
// ═══════════════════════════════════════════════════════════════════════════

async function runAsyncSuites(): Promise<void> {
  console.log("\n═══════════════════════════════════════════════");
  console.log("SUITE 8: Export Service Full Pipeline");
  console.log("═══════════════════════════════════════════════\n");

  // Simulate the real flow: validate first, then export only if valid
  const serviceValidation = validateDocumentAST(realisticDocument);
  assert(serviceValidation.isValid === true, "Document passes validation before service export");

  if (serviceValidation.isValid) {
    const blocks = realisticDocument.blocks as AstBlock[];

    // Full HTML format
    const htmlResult = await exportService.exportDocument(blocks, realisticDocument.title, "html");
    assert(htmlResult.format === "html", "Service returns html format");
    assert(htmlResult.contentType === "text/html", "Service returns text/html content type");
    assertIncludes(htmlResult.content as string, "<!DOCTYPE html>", "Service output is full HTML document");
    assertIncludes(htmlResult.content as string, "<style>", "Service output includes embedded CSS");

    // Fragment format
    const fragmentResult = await exportService.exportDocument(blocks, realisticDocument.title, "html-fragment");
    assert(fragmentResult.format === "html-fragment", "Service returns html-fragment format");
    assertNotIncludes(fragmentResult.content as string, "<!DOCTYPE", "Fragment has no doctype");
    assertNotIncludes(fragmentResult.content as string, "<style>", "Fragment has no CSS");
    assertIncludes(fragmentResult.content as string, "<h1>", "Fragment contains rendered blocks");

    // Default format
    const defaultResult = await exportService.exportDocument(blocks, realisticDocument.title);
    assert(defaultResult.format === "html", "Default export format is html");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST SUITE 9: Edge cases — empty content, whitespace
  // ═══════════════════════════════════════════════════════════════════════════

  console.log("\n═══════════════════════════════════════════════");
  console.log("SUITE 9: Edge Cases");
  console.log("═══════════════════════════════════════════════\n");

  // Empty blocks array produces valid HTML
  const emptyDoc = blocksToHtml([], "Empty Document");
  assertIncludes(emptyDoc, "<!DOCTYPE html>", "Empty doc still has doctype");
  assertIncludes(emptyDoc, "<title>Empty Document</title>", "Empty doc has title");
  assertIncludes(emptyDoc, "<body>", "Empty doc has body");

  // Paragraph with empty string (allowed by validator)
  const emptyParagraph: ParagraphBlock = {
    id: "p-empty",
    type: "paragraph",
    data: { text: "" },
  };
  const emptyPHtml = renderBlock(emptyParagraph);
  assert(emptyPHtml === "<p></p>", "Empty paragraph renders as empty <p> tag");

  // Code block with empty code (allowed — validator only requires field presence)
  const emptyCode: CodeBlock = {
    id: "c-empty",
    type: "code",
    data: { language: "text", code: "" },
  };
  const emptyCHtml = renderBlock(emptyCode);
  assertIncludes(emptyCHtml, '<code class="language-text"></code>', "Empty code renders with empty content");

  // Title with special characters
  const specialTitle = blocksToHtml([], 'My Doc <"Best & Greatest">');
  assertIncludes(specialTitle, "My Doc &lt;&quot;Best &amp; Greatest&quot;&gt;", "Special chars in title are escaped");

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST SUITE 10: escapeHtml edge patterns
  // ═══════════════════════════════════════════════════════════════════════════

  console.log("\n═══════════════════════════════════════════════");
  console.log("SUITE 10: escapeHtml Edge Patterns");
  console.log("═══════════════════════════════════════════════\n");

  assert(escapeHtml("") === "", "Empty string returns empty");
  assert(escapeHtml("   ") === "   ", "Whitespace-only string preserved");
  assert(escapeHtml("a\nb\tc") === "a\nb\tc", "Newlines and tabs are NOT escaped (preserved)");
  assert(escapeHtml("&amp;") === "&amp;amp;", "Already-escaped entities are double-escaped (correct behavior)");
  assert(
    escapeHtml("<<>>''\"\"&&") === "&lt;&lt;&gt;&gt;&#39;&#39;&quot;&quot;&amp;&amp;",
    "Consecutive special chars all escaped"
  );

  // ─── Results ────────────────────────────────────────────────────────────────

  console.log("\n═══════════════════════════════════════════════");
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log("═══════════════════════════════════════════════\n");

  if (failures.length > 0) {
    console.log("FAILURES:");
    failures.forEach((f) => console.log(`  ❌ ${f}`));
    console.log();
    process.exit(1);
  } else {
    console.log("All Week 3 Day 2 export tests passed! ✅\n");
    process.exit(0);
  }
}

runAsyncSuites().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
