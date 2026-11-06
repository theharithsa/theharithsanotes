import { Node } from "@tiptap/core";

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
