import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

test("filter initialization preserves an early mobile disclosure choice and restores desktop controls", async () => {
  const source = await readFile(
    new URL("../src/scripts/filter-panels.ts", import.meta.url),
    "utf8",
  );
  const script = ts
    .transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    })
    .outputText.replace(/export \{\};?\s*$/, "");
  const panels = [{ open: true }, { open: false }];
  let resize;
  const media = {
    matches: true,
    addEventListener: (_event, handler) => {
      resize = handler;
    },
  };
  vm.runInNewContext(script, {
    window: { matchMedia: () => media },
    document: { querySelectorAll: () => panels },
  });
  assert.deepEqual(
    panels.map((panel) => panel.open),
    [true, false],
  );
  media.matches = false;
  resize();
  assert.ok(panels.every((panel) => panel.open));
  media.matches = true;
  resize();
  assert.ok(panels.every((panel) => !panel.open));
});
