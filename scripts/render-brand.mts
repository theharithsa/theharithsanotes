import sharp from "sharp";
import { readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const directory = new URL("../public/brand/v1/", import.meta.url);
async function render(
  name: string,
  output: string,
  width: number,
  background?: string,
): Promise<void> {
  const source = await readFile(new URL(name, directory));
  let pipeline = sharp(source, { density: 144 }).resize({ width });
  if (background) pipeline = pipeline.flatten({ background });
  await pipeline.png().toFile(fileURLToPath(new URL(output, directory)));
}
await render("identity-sheet.svg", "identity-sheet.png", 1920);
await render("social-card.svg", "social-card.png", 1200);
for (const layout of ["horizontal", "vertical"]) {
  for (const treatment of ["ink", "inverse", "black", "white"]) {
    await render(
      `logo-${layout}-${treatment}.svg`,
      `logo-${layout}-${treatment}.png`,
      layout === "horizontal" ? 3200 : 2000,
    );
  }
}
for (const treatment of ["ink", "inverse", "black", "white"]) {
  await render(`mark-${treatment}.svg`, `mark-${treatment}.png`, 1024);
}
await render("profile.svg", "profile-1024.png", 1024);
await render("profile.svg", "profile-512.png", 512);
await render("icon-paper.svg", "icon-paper-512.png", 512);
for (const size of [192, 512]) {
  await render("app-icon.svg", `app-icon-${size}.png`, size);
  await render("app-icon-maskable.svg", `app-icon-maskable-${size}.png`, size);
}
await render("app-icon.svg", "apple-touch-icon.png", 180);
const pngSizes: Array<{ size: number; bytes: Buffer }> = [];
for (const size of [16, 32, 48]) {
  const filename = `favicon-${size}.png`;
  await render("favicon.svg", filename, size);
  pngSizes.push({ size, bytes: await readFile(new URL(filename, directory)) });
}
// ICO supports PNG-compressed entries; offsets and sizes refer to exact image bytes.
const header = Buffer.alloc(6 + 16 * pngSizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngSizes.length, 4);
let offset = header.length;
pngSizes.forEach(({ size, bytes }, index) => {
  const at = 6 + 16 * index;
  header[at] = size;
  header[at + 1] = size;
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(bytes.length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += bytes.length;
});
await writeFile(
  new URL("favicon.ico", directory),
  Buffer.concat([header, ...pngSizes.map((entry) => entry.bytes)]),
);
await writeFile(
  new URL("../public/favicon.ico", import.meta.url),
  Buffer.concat([header, ...pngSizes.map((entry) => entry.bytes)]),
);
const { createHash } = await import("node:crypto");
const manifest: {
  exports: Array<{ file: string; sha256: string }>;
  [key: string]: unknown;
} = JSON.parse(await readFile(new URL("identity.json", directory), "utf8"));
manifest.exports = await Promise.all(
  (await readdir(directory))
    .filter((file) => file !== "identity.json")
    .sort()
    .map(async (file) => ({
      file,
      sha256: createHash("sha256")
        .update(await readFile(new URL(file, directory)))
        .digest("hex"),
    })),
);
await writeFile(
  new URL("identity.json", directory),
  JSON.stringify(manifest, null, 2) + "\n",
);
