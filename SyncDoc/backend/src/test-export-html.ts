/**
 * Week 3 — AST → HTML Export Pipeline Tests
 *
 * Tests the AST-to-HTML transformation for correctness, ordering,
 * security (HTML injection prevention), and edge cases.
 *
 * Run: npx tsx src/test-export-html.ts
 */

import {
  escapeHtml,
  renderHeadingBlock,
  renderParagraphBlock,
  renderCodeBlock,
  renderListBlock,
  renderBlock,
  blocksToHtml,
  blocksToHtmlFragment,
} from "./utils/astToHtml.js";

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

function assertThrows(fn: () => void, message: string): void {
  try {
    fn();
    assert(false, `${message} (expected an error but none was thrown)`);
  } catch {
    assert(true, message);
  }
}

// ─── Test Data (matches existing AST contract) ─────────────────────────────

const headingBlock: HeadingBlock = {
  id: "block-h1",
  type: "heading",
  data: { text: "Introduction" },
};

const paragraphBlock: ParagraphBlock = {
  id: "block-p1",
  type: "paragraph",
  data: { text: "This is a paragraph of text." },
};

const codeBlock: CodeBlock = {
  id: "block-code1",
  type: "code",
  data: { language: "javascript", code: 'console.log("hello");' },
};

const unorderedListBlock: ListBlock = {
  id: "block-ul1",
  type: "list",
  data: { ordered: false, items: ["First item", "Second item", "Third item"] },
};

const orderedListBlock: ListBlock = {
  id: "block-ol1",
  type: "list",
  data: { ordered: true, items: ["Step one", "Step two", "Step three"] },
};

// ─── Test Suite: HTML Escaping ──────────────────────────────────────────────

console.log("\n═══════════════════════════════════════════════");
console.log("TEST SUITE: HTML Escaping (Security)");
console.log("═══════════════════════════════════════════════\n");

assert(escapeHtml("&") === "&amp;", "Escapes ampersand");
assert(escapeHtml("<") === "&lt;", "Escapes less-than");
assert(escapeHtml(">") === "&gt;", "Escapes greater-than");
assert(escapeHtml('"') === "&quot;", "Escapes double quote");
assert(escapeHtml("'") === "&#39;", "Escapes single quote");
assert(escapeHtml("Hello World") === "Hello World", "Leaves safe text unchanged");
assert(
  escapeHtml('<script>alert("xss")</script>') ===
    '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
  "Fully escapes XSS script tag"
);
assert(
  escapeHtml('a < b & c > d "e" \'f\'') ===
    'a &lt; b &amp; c &gt; d &quot;e&quot; &#39;f&#39;',
  "Escapes mixed special characters"
);

// ─── Test Suite: Individual Block Rendering ─────────────────────────────────

console.log("\n═══════════════════════════════════════════════");
console.log("TEST SUITE: Individual Block Rendering");
console.log("═══════════════════════════════════════════════\n");

// Heading
const headingHtml = renderHeadingBlock(headingBlock);
assertIncludes(headingHtml, "<h1>Introduction</h1>", "Heading renders as <h1>");

// Paragraph
const paragraphHtml = renderParagraphBlock(paragraphBlock);
assertIncludes(paragraphHtml, "<p>This is a paragraph of text.</p>", "Paragraph renders as <p>");

// Code block
const codeHtml = renderCodeBlock(codeBlock);
assertIncludes(codeHtml, "<pre>", "Code block has <pre> wrapper");
assertIncludes(codeHtml, "<code", "Code block has <code> element");
assertIncludes(codeHtml, 'class="language-javascript"', "Code block includes language class");
assertIncludes(codeHtml, 'console.log(&quot;hello&quot;)', "Code content is HTML-escaped");

// Unordered list
const ulHtml = renderListBlock(unorderedListBlock);
assertIncludes(ulHtml, "<ul>", "Unordered list uses <ul>");
assertIncludes(ulHtml, "<li>First item</li>", "List items render as <li>");
assertNotIncludes(ulHtml, "<ol>", "Unordered list does NOT use <ol>");

// Ordered list
const olHtml = renderListBlock(orderedListBlock);
assertIncludes(olHtml, "<ol>", "Ordered list uses <ol>");
assertIncludes(olHtml, "<li>Step one</li>", "Ordered list items render correctly");
assertNotIncludes(olHtml, "<ul>", "Ordered list does NOT use <ul>");

// ─── Test Suite: renderBlock dispatcher ─────────────────────────────────────

console.log("\n═══════════════════════════════════════════════");
console.log("TEST SUITE: renderBlock Dispatcher");
console.log("═══════════════════════════════════════════════\n");

assertIncludes(renderBlock(headingBlock), "<h1>", "renderBlock dispatches heading correctly");
assertIncludes(renderBlock(paragraphBlock), "<p>", "renderBlock dispatches paragraph correctly");
assertIncludes(renderBlock(codeBlock), "<pre>", "renderBlock dispatches code correctly");
assertIncludes(renderBlock(unorderedListBlock), "<ul>", "renderBlock dispatches list correctly");

// ─── Test Suite: Multiple Blocks Preserve Order ─────────────────────────────

console.log("\n═══════════════════════════════════════════════");
console.log("TEST SUITE: Block Ordering");
console.log("═══════════════════════════════════════════════\n");

const multiBlocks: AstBlock[] = [headingBlock, paragraphBlock, codeBlock, unorderedListBlock];
const fragment = blocksToHtmlFragment(multiBlocks);

const h1Pos = fragment.indexOf("<h1>");
const pPos = fragment.indexOf("<p>");
const prePos = fragment.indexOf("<pre>");
const ulPos = fragment.indexOf("<ul>");

assert(h1Pos < pPos, "Heading appears before paragraph in output");
assert(pPos < prePos, "Paragraph appears before code in output");
assert(prePos < ulPos, "Code appears before list in output");

// ─── Test Suite: Full HTML Document ─────────────────────────────────────────

console.log("\n═══════════════════════════════════════════════");
console.log("TEST SUITE: Full HTML Document Output");
console.log("═══════════════════════════════════════════════\n");

const fullHtml = blocksToHtml(multiBlocks, "Test Document");
assertIncludes(fullHtml, "<!DOCTYPE html>", "Full HTML starts with doctype");
assertIncludes(fullHtml, '<html lang="en">', "Full HTML has <html> with lang attribute");
assertIncludes(fullHtml, '<meta charset="UTF-8">', "Full HTML has charset meta");
assertIncludes(fullHtml, "<title>Test Document</title>", "Full HTML has correct <title>");
assertIncludes(fullHtml, "<body>", "Full HTML has <body>");
assertIncludes(fullHtml, "</body>", "Full HTML has closing </body>");
assertIncludes(fullHtml, "</html>", "Full HTML has closing </html>");

// ─── Test Suite: Special Characters in Content (Security) ───────────────────

console.log("\n═══════════════════════════════════════════════");
console.log("TEST SUITE: Special Characters & XSS Prevention");
console.log("═══════════════════════════════════════════════\n");

const xssHeading: HeadingBlock = {
  id: "xss-h1",
  type: "heading",
  data: { text: '<script>alert("XSS")</script>' },
};
const xssHtml = renderHeadingBlock(xssHeading);
assertNotIncludes(xssHtml, "<script>", "XSS script tag is escaped in heading");
assertIncludes(xssHtml, "&lt;script&gt;", "XSS script tag is properly entity-encoded");

const xssParagraph: ParagraphBlock = {
  id: "xss-p1",
  type: "paragraph",
  data: { text: '<img src=x onerror=alert(1)>' },
};
const xssPHtml = renderParagraphBlock(xssParagraph);
assertNotIncludes(xssPHtml, "<img", "XSS img tag is escaped in paragraph");

const xssCode: CodeBlock = {
  id: "xss-code1",
  type: "code",
  data: { language: '"><script>alert(1)</script>', code: '<div onclick="steal()">Click</div>' },
};
const xssCodeHtml = renderCodeBlock(xssCode);
assertNotIncludes(xssCodeHtml, "<script>", "XSS in code language attribute is escaped");
assertNotIncludes(xssCodeHtml, "<div", "XSS div tag in code content is escaped");
assertIncludes(xssCodeHtml, "&lt;div", "XSS div tag in code content is entity-encoded");

const xssList: ListBlock = {
  id: "xss-list1",
  type: "list",
  data: { ordered: false, items: ['<a href="javascript:void(0)">click</a>', "normal item"] },
};
const xssListHtml = renderListBlock(xssList);
assertNotIncludes(xssListHtml, "<a ", "XSS anchor tag is escaped in list items");
assertIncludes(xssListHtml, "&lt;a", "XSS anchor tag is entity-encoded in list items");

// Title injection in full document
const titleXssDoc = blocksToHtml([], '<script>alert("title")</script>');
assertNotIncludes(titleXssDoc, "<script>", "XSS in document title is escaped");

// ─── Test Suite: Edge Cases ─────────────────────────────────────────────────

console.log("\n═══════════════════════════════════════════════");
console.log("TEST SUITE: Edge Cases");
console.log("═══════════════════════════════════════════════\n");

// Empty blocks array
const emptyFragment = blocksToHtmlFragment([]);
assert(emptyFragment === "", "Empty blocks array produces empty fragment");

const emptyFullHtml = blocksToHtml([], "Empty Doc");
assertIncludes(emptyFullHtml, "<title>Empty Doc</title>", "Empty doc still has title");
assertIncludes(emptyFullHtml, "<body>\n\n</body>", "Empty doc has empty body");

// Invalid input
assertThrows(
  () => blocksToHtml(null as unknown as AstBlock[], "test"),
  "Null blocks array throws error"
);
assertThrows(
  () => blocksToHtmlFragment("not an array" as unknown as AstBlock[]),
  "Non-array blocks throws error"
);

// ─── Test Suite: Export Service ──────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n═══════════════════════════════════════════════");
  console.log("TEST SUITE: Export Service Integration");
  console.log("═══════════════════════════════════════════════\n");

  const exportResultHtml = await exportService.exportDocument(multiBlocks, "Service Test", "html");
  assert(exportResultHtml.format === "html", "Export service returns correct format");
  assert(exportResultHtml.contentType === "text/html", "Export service returns correct content type");
  assertIncludes(exportResultHtml.content as string, "<!DOCTYPE html>", "Export service produces full HTML doc");
  assertIncludes(exportResultHtml.content as string, "<title>Service Test</title>", "Export service includes document title");

  const exportResultFragment = await exportService.exportDocument(multiBlocks, "Fragment Test", "html-fragment");
  assert(exportResultFragment.format === "html-fragment", "Fragment format is returned");
  assertNotIncludes(exportResultFragment.content as string, "<!DOCTYPE", "Fragment does not include doctype");
  assertIncludes(exportResultFragment.content as string, "<h1>", "Fragment includes block content");

  // Default format
  const exportResultDefault = await exportService.exportDocument(multiBlocks, "Default Test");
  assert(exportResultDefault.format === "html", "Default format is 'html'");

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
    console.log("All export HTML transformation tests passed! ✅\n");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
