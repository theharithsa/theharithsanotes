import test from "node:test";
import assert from "node:assert/strict";
import { sanitizePostHtml } from "../src/lib/post-html.ts";

test("legacy paragraph lists become real list items without changing nested prose", () => {
  const html = sanitizePostHtml(
    '<p>Before</p><ul><p>First <strong>point</strong><br />continued</p><li><p>Existing item</p><ul><p>Nested point</p></ul></li><p>Last <img src="/sample.webp" alt="sample" /> point</p></ul><ol start="4"><p>Fourth</p></ol><p>After</p>',
  );
  assert.match(
    html,
    /<ul><li>First <strong>point<\/strong><br \/>continued<\/li>/,
  );
  assert.match(
    html,
    /<li><p>Existing item<\/p><ul><li>Nested point<\/li><\/ul><\/li>/,
  );
  assert.match(html, /<li>Last <img[^>]*\/> point<\/li>/);
  assert.match(html, /<ol start="4"><li>Fourth<\/li><\/ol><p>After<\/p>/);
  assert.equal(sanitizePostHtml(html), html);
});

test("post formatting keeps semantic blocks and only approved layout classes", () => {
  const source =
    '<aside class="post-callout cms-sidebar" aria-label="Key idea"><p>A <strong>useful</strong> note.</p></aside><div class="post-image-mosaic fixed"><figure><img src="/media/sample/800.webp" alt="A sample" /><figcaption>A caption</figcaption></figure></div><ol start="4"><li value="6"><em>Six</em> and <s>old</s></li></ol><blockquote><p>A quotation.</p><cite>Its source</cite></blockquote><table><tr><th colspan="2">Heading</th></tr><tr><td rowspan="2">Value</td></tr></table>';
  const html = sanitizePostHtml(source);
  assert.match(html, /class="post-callout" aria-label="Key idea"/);
  assert.match(html, /class="post-image-mosaic"/);
  assert.match(html, /alt="A sample" loading="lazy"/);
  for (const expected of [
    "<strong>useful</strong>",
    "<figcaption>A caption</figcaption>",
    '<ol start="4">',
    '<li value="6">',
    "<em>Six</em>",
    "<s>old</s>",
    "<cite>Its source</cite>",
    'colspan="2"',
    'rowspan="2"',
  ])
    assert.ok(html.includes(expected), expected);
  assert.doesNotMatch(html, /cms-sidebar|fixed/);
  assert.equal(
    sanitizePostHtml(html),
    html,
    "Repeated CMS/import sanitizing must not change approved blocks",
  );
});

test("post layouts cannot introduce executable markup or arbitrary presentation", () => {
  const html = sanitizePostHtml(
    '<aside class="post-callout" style="position:fixed" onclick="steal()"><script>steal()</script><p>Safe</p><img src="javascript:steal()" onerror="steal()" /></aside><div class="cms-workspace post-image-grid"><a href="javascript:steal()">Link</a><iframe src="https://example.com"></iframe></div>',
  );
  assert.match(html, /<p>Safe<\/p>/);
  assert.match(html, /class="post-image-grid"/);
  assert.doesNotMatch(
    html,
    /steal|javascript:|onclick|onerror|style=|iframe|cms-workspace/,
  );
});
