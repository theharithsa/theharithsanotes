import paths from "../src/data/hosting-paths.json" with { type: "json" };

const slugCharacters = "0123456789abcdefghijklmnopqrstuvwxyz";

function characterRanges(excluded) {
  const ranges = [];
  let start = 0;
  while (start < slugCharacters.length) {
    if (excluded.includes(slugCharacters[start])) {
      start++;
      continue;
    }
    let end = start;
    while (
      end + 1 < slugCharacters.length &&
      !excluded.includes(slugCharacters[end + 1]) &&
      slugCharacters.charCodeAt(end + 1) === slugCharacters.charCodeAt(end) + 1
    ) {
      end++;
    }
    ranges.push(
      start === end
        ? slugCharacters[start]
        : `${slugCharacters[start]}-${slugCharacters[end]}`,
    );
    start = end + 1;
  }
  return ranges.join("");
}

// Hosting uses RE2, so build the complement of exact one-word slugs with
// prefix branches. Longer or dashed slugs with these prefixes still work.
function exceptExactSlugs(excluded, isRoot = true) {
  const starts = [...new Set(excluded.filter(Boolean).map((slug) => slug[0]))];
  if (starts.length === 0) return "[a-z0-9]+";
  const ranges = characterRanges(starts);
  const branches = ranges ? [`[${ranges}][a-z0-9]*`] : [];
  for (const first of starts) {
    const suffixes = excluded
      .filter((slug) => slug.startsWith(first))
      .map((slug) => slug.slice(1));
    branches.push(first + exceptExactSlugs(suffixes, false));
  }
  const optional = !isRoot && !excluded.includes("") ? "?" : "";
  return `(?:${branches.join("|")})${optional}`;
}

export const hostingRedirects = Object.entries(paths.redirects).map(
  ([slug, destination]) => ({ regex: `^/${slug}/?$`, destination, type: 301 }),
);

export const hostingRewritePattern = [
  "^/(",
  exceptExactSlugs(["wp", ...paths.probeSlugs]),
  "|(?:[a-vx-z0-9][a-z0-9]*|w(?:[a-oq-z0-9][a-z0-9]*)?|wp[a-z0-9]+)(?:-[a-z0-9]+)+",
  "|(?:books|projects|entertainment|gogs)/[a-z0-9-]+",
  "|podcasts/(?:created|listening)(?:/[a-z0-9-]+)?",
  "|people-and-journal/(?:journal|people)(?:/[a-z0-9-]+)?",
  "|admin/(?:api|invitations)",
  "|api/(?:cms|v1|reading|search)(?:/[A-Za-z0-9_-]+)*(?:\\.(?:webp|mp4|webm|mp3|m4a|ogg))?",
  "|media/[a-f0-9]{64}/(?:master\\.webp|400\\.webp|800\\.webp|1600\\.webp|source\\.(?:mp4|webm|mp3|m4a|ogg))",
  "|api/openapi\\.json|sitemap\\.xml|rss\\.xml|_image",
  ")?/?$",
].join("");
