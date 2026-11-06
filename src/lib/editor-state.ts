import type { Editor } from "@tiptap/core";
export function setEditingAvailability(
  editor: Pick<Editor, "setEditable"> | null,
  busy: boolean,
): void {
  // Changing controls must not emit a content update or rewrite an imported article.
  editor?.setEditable(!busy, false);
}
