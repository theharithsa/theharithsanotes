import type { Editor } from "@tiptap/core";

type Tool = {
  label: string;
  icon: string;
  node?: string;
  level?: number;
  key?: string;
};

const groups: { label: string; tools: Tool[] }[] = [
  {
    label: "Text style",
    tools: [
      { label: "Text", icon: "¶", node: "paragraph" },
      { label: "Heading", icon: "H₂", node: "heading", level: 2 },
      { label: "Small heading", icon: "H₃", node: "heading", level: 3 },
    ],
  },
  {
    label: "Inline formatting",
    tools: [
      { label: "Bold", icon: "B", node: "bold", key: "B" },
      { label: "Italic", icon: "I", node: "italic", key: "I" },
      { label: "Strike", icon: "S", node: "strike" },
      {
        label: "Link",
        icon: "<path d='M10 13a4 4 0 0 0 6 .4l3-3a4 4 0 0 0-6-6l-1.5 1.5M14 11a4 4 0 0 0-6-.4l-3 3a4 4 0 0 0 6 6l1.5-1.5' />",
        node: "link",
      },
    ],
  },
  {
    label: "Blocks",
    tools: [
      {
        label: "List",
        icon: "<path d='M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01' />",
        node: "bulletList",
      },
      {
        label: "Numbered",
        icon: "<path d='M10 6h11M10 12h11M10 18h11M4 4v5M3 4h1M3 9h3M3 14a1.5 1.5 0 1 1 3 0c0 1-3 3-3 5h3' />",
        node: "orderedList",
      },
      { label: "Quote", icon: "❝", node: "blockquote" },
      {
        label: "Code",
        icon: "<path d='m8 7-5 5 5 5m8-10 5 5-5 5m-2-14-4 18' />",
        node: "codeBlock",
      },
      {
        label: "Callout",
        icon: "<rect x='4' y='4' width='16' height='16' rx='3'/><path d='M12 8v5m0 3h.01' />",
        node: "postCallout",
      },
      { label: "Divider", icon: "<path d='M4 12h16' />" },
      {
        label: "Table",
        icon: "<rect x='3' y='4' width='18' height='16' rx='2'/><path d='M3 9h18M3 14h18M9 4v16m6-16v16'/>",
      },
    ],
  },
  {
    label: "Media and layout",
    tools: [
      {
        label: "Image",
        icon: "<rect x='3' y='4' width='18' height='16' rx='2'/><circle cx='8' cy='9' r='1.5'/><path d='m21 16-5-5-8 9'/>",
      },
      {
        label: "Embed media",
        icon: "<rect x='3' y='5' width='18' height='14' rx='2'/><path d='m10 9 5 3-5 3z'/>",
      },
      {
        label: "Upload video/audio",
        icon: "<path d='M12 16V4m-4 4 4-4 4 4M4 15v5h16v-5'/>",
      },
      {
        label: "Image grid",
        icon: "<rect x='4' y='4' width='16' height='16' rx='1'/><path d='M4 12h16M12 4v16' />",
        node: "postImageGrid",
      },
      {
        label: "Mosaic",
        icon: "<rect x='4' y='4' width='16' height='16' rx='1'/><path d='M13 4v16m0-8h7' />",
        node: "postImageMosaic",
      },
    ],
  },
];

export function populateEditorToolbar(
  toolbar: HTMLElement,
  editor: Editor,
  commands: Map<string, (editor: Editor) => void>,
) {
  const active: { tool: Tool; button: HTMLButtonElement }[] = [];
  toolbar.setAttribute("role", "group");
  toolbar.setAttribute("aria-label", "Article formatting");
  for (const { label, tools } of groups) {
    const group = document.createElement("div");
    group.className = "cms-tool-group";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", label);
    for (const tool of tools) {
      const run = commands.get(tool.label);
      if (!run) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.title = tool.label;
      button.setAttribute("aria-label", tool.label);
      if (tool.key)
        button.setAttribute(
          "aria-keyshortcuts",
          `Control+${tool.key} Meta+${tool.key}`,
        );
      button.dataset.tool = tool.node ?? "insert";
      const icon = document.createElement("span");
      icon.setAttribute("aria-hidden", "true");
      if (tool.icon.startsWith("<")) {
        // The SVG paths are fixed toolbar assets, independent of entry content.
        icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${tool.icon}</svg>`;
      } else icon.textContent = tool.icon;
      button.append(icon);
      button.addEventListener("click", () => {
        if (editor.isEditable && !editor.isDestroyed) run(editor);
      });
      group.append(button);
      if (tool.node) active.push({ tool, button });
    }
    if (group.childElementCount) toolbar.append(group);
  }
  const update = () => {
    for (const { tool, button } of active) {
      const attrs = tool.level ? { level: tool.level } : undefined;
      button.setAttribute(
        "aria-pressed",
        String(editor.isActive(tool.node!, attrs)),
      );
    }
  };
  editor.on("transaction", update);
  update();
}
