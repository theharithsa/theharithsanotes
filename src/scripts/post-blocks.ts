import { Node, nodePasteRule } from "@tiptap/core";
import { postMedia } from "../lib/post-media";

export const PostCallout = Node.create({
  name: "postCallout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      label: {
        default: "Note",
        parseHTML: (element) => element.getAttribute("aria-label") ?? "Note",
        renderHTML: (attributes) => ({
          "aria-label": String(attributes.label ?? "Note").slice(0, 80),
        }),
      },
    };
  },
  parseHTML: () => [{ tag: "aside.post-callout" }],
  renderHTML: ({ HTMLAttributes }) => [
    "aside",
    { ...HTMLAttributes, class: "post-callout" },
    0,
  ],
});

function mediaLayout(name: string, className: string) {
  return Node.create({
    name,
    group: "block",
    content: "block+",
    defining: true,
    parseHTML: () => [{ tag: `div.${className}` }],
    renderHTML: () => ["div", { class: className }, 0],
  });
}
export const PostImageGrid = mediaLayout("postImageGrid", "post-image-grid");
export const PostImageMosaic = mediaLayout(
  "postImageMosaic",
  "post-image-mosaic",
);

export const PostMediaBlock = Node.create({
  name: "postMedia",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ url: { default: "" } }),
  parseHTML: () =>
    ["figure.post-media", "iframe[src]", "video[src]", "audio[src]"].map(
      (tag) => ({
        tag,
        getAttrs: (element: HTMLElement) => {
          const media = postMedia(
            element.getAttribute("data-media-url") ??
              element.getAttribute("src") ??
              "",
          );
          return media ? { url: media.url } : false;
        },
      }),
    ),
  renderHTML: ({ node }) => {
    const media = postMedia(String(node.attrs.url));
    if (!media) return ["p", "Unsupported media link"];
    const player =
      media.kind === "embed"
        ? [
            "iframe",
            {
              src: media.src,
              title: `${media.provider} player`,
              loading: "lazy",
              allow: "fullscreen; picture-in-picture; encrypted-media",
              allowfullscreen: "",
              referrerpolicy: "strict-origin-when-cross-origin",
            },
          ]
        : [
            media.kind,
            {
              src: media.src,
              controls: "",
              preload: "metadata",
              ...(media.kind === "video" ? { playsinline: "" } : {}),
            },
          ];
    return [
      "figure",
      {
        class: `post-media${media.provider === "Spotify" ? " post-media-audio" : ""}`,
        "data-media-url": media.url,
      },
      player,
      ["figcaption", ["a", { href: media.url }, `Open ${media.provider}`]],
    ];
  },
  addPasteRules() {
    return [
      nodePasteRule({
        find: /^https:\/\/[^\s]+$/g,
        type: this.type,
        getAttributes: (match) => {
          const media = postMedia(match[0]);
          return media ? { url: media.url } : false;
        },
      }),
    ];
  },
});
