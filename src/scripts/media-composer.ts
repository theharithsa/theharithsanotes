import type { Editor } from "@tiptap/core";
import { postMedia } from "../lib/post-media";

/** An inline editor panel: retains the post selection and avoids nested forms. */
export function mediaComposer(editor: Editor, notify: (text: string) => void) {
  const panel = document.createElement("fieldset");
  panel.className = "cms-media-composer";
  panel.hidden = true;
  const legend = document.createElement("legend");
  legend.textContent = "Add or replace media";
  const label = document.createElement("label");
  label.textContent = "Video, audio or episode link";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Paste a YouTube, Vimeo, Spotify or media URL";
  input.autocomplete = "off";
  label.append(input);
  const help = document.createElement("p");
  help.textContent =
    "A supported link on its own line also embeds when pasted. Select an existing media block, then Embed media, to replace it. Add a caption as text beneath the block.";
  const actions = document.createElement("div");
  const insert = document.createElement("button");
  insert.type = "button";
  insert.className = "cms-primary";
  insert.textContent = "Insert media";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "cms-quiet-button";
  cancel.textContent = "Cancel";
  const close = () => {
    panel.hidden = true;
    if (!editor.isDestroyed) editor.commands.focus();
  };
  insert.addEventListener("click", () => {
    const media = postMedia(input.value.trim());
    if (!media) {
      notify(
        "Use a YouTube, Vimeo, Spotify, MP4, WebM, MP3, M4A or Ogg link. Other links can be added with Link.",
      );
      input.focus();
      return;
    }
    if (editor.isDestroyed) return;
    editor
      .chain()
      .focus()
      .insertContent({ type: "postMedia", attrs: { url: media.url } })
      .run();
    notify("");
    close();
  });
  cancel.addEventListener("click", close);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      insert.click();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  });
  actions.append(insert, cancel);
  panel.append(legend, label, help, actions);
  return {
    element: panel,
    open: () => {
      input.value = String(editor.getAttributes("postMedia").url ?? "");
      panel.hidden = false;
      input.focus();
    },
  };
}
