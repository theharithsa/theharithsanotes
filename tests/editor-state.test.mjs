import test from "node:test";
import assert from "node:assert/strict";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { setEditingAvailability } from "../src/lib/editor-state.ts";
test("changing editor availability never creates a draft content update", () => {
  const original = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Original article body" }],
      },
    ],
  };
  const editor = new Editor({
    element: null,
    extensions: [StarterKit],
    content: original,
  });
  let updates = 0;
  editor.on("update", () => updates++);
  try {
    editor.setEditable(true);
    assert.equal(updates, 1);
    for (const busy of [false, true, true, false, false])
      setEditingAvailability(editor, busy);
    assert.equal(updates, 1);
    assert.deepEqual(editor.getJSON(), original);
  } finally {
    editor.destroy();
  }
});
