import sanitizeHtml from "sanitize-html";

/** One bounded HTML contract for imports, CMS drafts, API writes and readers. */
export function sanitizePostHtml(value: string): string {
  const ancestors: string[] = [];
  return sanitizeHtml(value, {
    onOpenTag: (name) => {
      ancestors.push(name);
    },
    onCloseTag: (name) => {
      const index = ancestors.lastIndexOf(name);
      if (index >= 0) ancestors.length = index;
    },
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img",
      "figure",
      "figcaption",
      "br",
      "hr",
    ],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "width", "height", "loading"],
      aside: ["class", "aria-label"],
      div: ["class"],
      figure: ["class"],
      code: ["class"],
      pre: ["class"],
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      ol: ["start", "reversed"],
      li: ["value"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedClasses: {
      aside: ["post-callout"],
      div: ["post-image-grid", "post-image-mosaic"],
      figure: [],
    },
    allowedSchemes: ["https", "http", "mailto"],
    transformTags: {
      // Older imports contain paragraphs directly inside lists. Preserve the
      // words while rendering real list items, without changing stored source.
      p: (name, attributes) => ({
        tagName: ["ul", "ol"].includes(ancestors.at(-2) ?? "") ? "li" : name,
        attribs: attributes,
      }),
      img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }),
    },
  });
}
