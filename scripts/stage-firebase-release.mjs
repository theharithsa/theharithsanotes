import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  artVariant,
  artWidths,
  publicArtUrl,
} from "../src/lib/firebase-art.mjs";

const [namespace, revision] = process.argv.slice(2);
if (
  !["live", "preview"].includes(namespace) ||
  !/^[a-f0-9]{40}$/.test(revision ?? "")
) {
  throw new Error(
    "Usage: node scripts/stage-firebase-release.mjs live|preview <full Git SHA>",
  );
}
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const build = spawnSync(
  process.execPath,
  ["node_modules/astro/bin/astro.mjs", "build"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      CMS_BUILD_TARGET: "firebase",
      ASTRO_TELEMETRY_DISABLED: "1",
    },
  },
);
if (build.error || build.status !== 0)
  throw build.error ?? new Error("Astro build failed");

await mkdir("archives", { recursive: true });
const root = await mkdtemp(path.resolve("archives", `firebase-${namespace}-`));
const functionId = namespace === "live" ? "journalLive" : "journalPreview";
const image = /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i;
const archive = /\.(?:gz|tar|tgz|zip|7z)$/i;
const redirects = [];
let hostingBytes = 0;
let artworkBytes = 0;
const written = new Set();

async function writeArt(key, bytes) {
  if (written.has(key)) return;
  const file = path.join(root, "storage", key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
  written.add(key);
  artworkBytes += bytes.length;
}

for (const entry of await readdir("dist/client", {
  recursive: true,
  withFileTypes: true,
})) {
  if (!entry.isFile()) continue;
  const file = path.join(entry.parentPath, entry.name);
  const relative = path.relative("dist/client", file).split(path.sep).join("/");
  if (archive.test(relative) || relative.split("/").includes("archives")) {
    throw new Error(`Unexpected archive in the Hosting build: ${relative}`);
  }
  const bytes = await readFile(file);
  if (!image.test(relative)) {
    const destination = path.join(root, "hosting", relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, bytes);
    hostingBytes += bytes.length;
    continue;
  }
  if (!/^[-\w./]+$/.test(relative))
    throw new Error(`Unsupported artwork path: ${relative}`);
  const sourceExt = path.extname(relative).toLowerCase();
  const optimize = /^\.(png|jpe?g)$/.test(sourceExt) && bytes.length > 200_000;
  const rendition = optimize
    ? await sharp(bytes)
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 84 })
        .toBuffer()
    : bytes;
  const digest = createHash("sha256").update(rendition).digest("hex");
  const key = `public-art/v1/files/${digest}${optimize ? ".webp" : sourceExt}`;
  await writeArt(key, rendition);
  redirects.push({
    source: `/${relative}`,
    destination: publicArtUrl(key),
    type: 302,
  });
  if (/^_astro\/.*\.(png|webp)$/i.test(relative)) {
    const input = sharp(bytes);
    const { width } = await input.metadata();
    if (!width) throw new Error(`Artwork width is unknown: ${relative}`);
    for (const size of new Set(artWidths.map((w) => Math.min(w, width)))) {
      await writeArt(
        artVariant(entry.name, size),
        await input
          .clone()
          .resize({ width: size })
          .webp({ quality: 82 })
          .toBuffer(),
      );
    }
  }
}
if (hostingBytes >= 100_000_000 || artworkBytes >= 500_000_000) {
  throw new Error(
    `Deployment payload exceeds its budget: Hosting ${hostingBytes}, artwork ${artworkBytes}`,
  );
}

const functions = path.join(root, "functions");
await mkdir(functions);
await cp("dist/server", path.join(functions, "dist/server"), {
  recursive: true,
});
await cp("runtime", path.join(functions, "runtime"), { recursive: true });
await cp(
  "runtime/firebase-function.mjs",
  path.join(functions, "firebase-function.mjs"),
);
await cp("package-lock.json", path.join(functions, "package-lock.json"));
await writeFile(
  path.join(functions, "package.json"),
  JSON.stringify(
    {
      ...pkg,
      main: "index.mjs",
      engines: { node: "24" },
      scripts: {},
    },
    null,
    2,
  ),
);
await writeFile(
  path.join(functions, "index.mjs"),
  `import { journalFunction } from "./firebase-function.mjs";\nexport const ${functionId} = journalFunction(${JSON.stringify(namespace)});\n`,
);
await writeFile(
  path.join(functions, ".env"),
  `SERVICE_VERSION=${pkg.version}\nSOURCE_REVISION=${revision}\n`,
);
await cp("storage.rules", path.join(root, "storage.rules"));

const config = JSON.parse(
  await readFile(
    namespace === "live" ? "firebase.json" : "firebase.preview.json",
    "utf8",
  ),
);
config.hosting.public = "hosting";
config.hosting.redirects = redirects;
config.hosting.rewrites = [
  { source: "**", function: { functionId, region: "us-east1", pinTag: true } },
];
config.functions = {
  source: "functions",
  codebase: `journal-${namespace}`,
  runtime: "nodejs24",
};
config.storage = { rules: "storage.rules" };
await writeFile(
  path.join(root, "firebase.json"),
  JSON.stringify(config, null, 2),
);
process.stdout.write(
  JSON.stringify({
    root,
    functionId,
    hostingBytes,
    artworkBytes,
    artworkFiles: written.size,
    redirects: redirects.length,
  }) + "\n",
);
