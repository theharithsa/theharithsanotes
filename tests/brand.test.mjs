import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";

const root = new URL("../dist/", import.meta.url);
const asset = (file) => readFile(new URL(`brand/v1/${file}`, root));

test("brand exports are complete, self-contained and connected to the public document", async () => {
  const manifest = JSON.parse(await asset("identity.json"));
  for (const entry of manifest.exports) {
    assert.equal(
      createHash("sha256")
        .update(await asset(entry.file))
        .digest("hex"),
      entry.sha256,
      entry.file,
    );
    if (/^(logo-|mark-).+\.svg$/.test(entry.file)) {
      const svg = (await asset(entry.file)).toString();
      assert.doesNotMatch(
        svg,
        /<text|<image|<script|<foreignObject|@font-face|href=/i,
      );
      assert.match(svg, /<path/);
    }
  }
  const home = await readFile(new URL("index.html", root), "utf8");
  for (const reference of [
    "/brand/v1/favicon.svg",
    "/favicon.ico",
    "/site.webmanifest",
    "/brand/v1/apple-touch-icon.png",
  ])
    assert.ok(home.includes(reference), reference);
  assert.match(home, /aria-label="The Harithsa Notes home"/);
  const application = JSON.parse(
    await readFile(new URL("site.webmanifest", root), "utf8"),
  );
  for (const icon of application.icons) {
    const image = await sharp(
      await readFile(new URL(icon.src.slice(1), root)),
    ).metadata();
    assert.equal(`${image.width}x${image.height}`, icon.sizes);
    assert.equal(image.format, "png");
  }
  for (const layout of ["horizontal", "vertical"]) {
    const { data, info } = await sharp(
      await asset(`logo-${layout}-inverse.png`),
    )
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(info.channels, 4);
    assert.equal(
      data[3],
      0,
      "transparent exports keep a transparent outer margin",
    );
  }
});

test("favicon entries decode at their declared sizes and maskable artwork stays inside its safe circle", async () => {
  const ico = await readFile(new URL("favicon.ico", root));
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
  for (let index = 0; index < 3; index++) {
    const at = 6 + index * 16;
    const size = ico[at];
    assert.equal(size, [16, 32, 48][index]);
    const bytes = ico.readUInt32LE(at + 8);
    const offset = ico.readUInt32LE(at + 12);
    assert.ok(offset + bytes <= ico.length);
    const image = await sharp(ico.subarray(offset, offset + bytes)).metadata();
    assert.equal(image.width, size);
    assert.equal(image.height, size);
  }
  const { data, info } = await sharp(await asset("app-icon-maskable-512.png"))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      if (Math.hypot(x - 255.5, y - 255.5) <= 512 * 0.4) continue;
      const pixel = (y * info.width + x) * 4;
      assert.deepEqual(
        [...data.subarray(pixel, pixel + 4)],
        [36, 35, 33, 255],
        "maskable outer area must contain only background",
      );
    }
});
