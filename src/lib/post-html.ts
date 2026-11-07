import sanitizeHtml from "sanitize-html";
import { mediaHtml, postMedia, responsiveMedia } from "./post-media.ts";

/** One bounded HTML contract for imports, CMS drafts, API writes and readers. */
export function sanitizePostHtml(value: string, responsive = false): string {
  const ancestors: string[] = [];
  const clean = sanitizeHtml(value, {
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
      "iframe",
      "video",
      "audio",
    ],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "width", "height", "loading", "srcset", "sizes"],
      aside: ["class", "aria-label"],
      div: ["class"],
      figure: ["class", "data-media-url"],
      iframe: [
        "src",
        "title",
        "loading",
        "allow",
        "allowfullscreen",
        "referrerpolicy",
      ],
      video: ["src", "controls", "preload", "playsinline"],
      audio: ["src", "controls", "preload"],
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
      figure: ["post-media", "post-media-audio"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    exclusiveFilter: (frame) =>
      ["iframe", "video", "audio"].includes(frame.tag) && !frame.attribs.src,
    transformTags: {
      iframe: (
        _name,
        attributes,
      ): { tagName: string; attribs: Record<string, string> } => {
        const media = postMedia(attributes.src ?? "");
        return {
          tagName: "iframe",
          attribs:
            media?.kind === "embed"
              ? {
                  src: media.src,
                  title: `${media.provider} player`,
                  loading: "lazy",
                  allow: "fullscreen; picture-in-picture; encrypted-media",
                  allowfullscreen: "",
                  referrerpolicy: "strict-origin-when-cross-origin",
                }
              : {},
        };
      },
      ...Object.fromEntries(
        ["video", "audio"].map((kind) => [
          kind,
          (_name: string, attributes: Record<string, string>) => {
            const media = postMedia(attributes.src ?? "");
            return {
              tagName: kind,
              attribs:
                media?.kind === kind
                  ? {
                      src: media.src,
                      controls: "",
                      preload: "metadata",
                      ...(kind === "video" ? { playsinline: "" } : {}),
                    }
                  : {},
            };
          },
        ]),
      ),
      // Older imports contain paragraphs directly inside lists. Preserve the
      // words while rendering real list items, without changing stored source.
      p: (name, attributes) => ({
        tagName: ["ul", "ol"].includes(ancestors.at(-2) ?? "") ? "li" : name,
        attribs: attributes,
      }),
      img: (tagName, attributes) => {
        const { srcset: _srcset, sizes: _sizes, ...image } = attributes;
        return {
          tagName,
          attribs: {
            ...image,
            ...(responsive && image.src
              ? responsiveMedia(
                  image.src,
                  "auto, (max-width: 760px) 92vw, 720px",
                )
              : {}),
            loading: "lazy",
          },
        };
      },
    },
  });
  // Only a whole URL paragraph becomes a block. Inline links remain prose.
  return clean.replace(
    /<p>\s*(?:<a href="([^"]+)"[^>]*>[^<]*<\/a>|(https:\/\/[^\s<]+))\s*<\/p>/g,
    (original, href: string | undefined, text: string | undefined) =>
      mediaHtml((href ?? text ?? "").replace(/&amp;/g, "&")) ?? original,
  );
}
