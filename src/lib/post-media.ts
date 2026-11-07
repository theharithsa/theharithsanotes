export interface PostMedia {
  kind: "video" | "audio" | "embed";
  provider: string;
  url: string;
  src: string;
}

/** Use the existing CMS variants without changing the stored URL or its access checks. */
export function responsiveMedia(src: string, sizes: string) {
  const path =
    /^\/media\/[a-f0-9]{64}\/(?=(?:master|400|800|1600)\.webp$)/.exec(src)?.[0];
  if (!path) return { src };
  return {
    src: `${path}800.webp`,
    srcset: [400, 800, 1600]
      .map((width) => `${path}${width}.webp ${width}w`)
      .join(", "),
    sizes,
  };
}

/** Pure allowlist shared by the editor, API sanitizer and readers. No URL fetch. */
export function postMedia(value: string): PostMedia | null {
  if (value.length > 2048) return null;
  if (/^\/media\/[a-f0-9]{64}\/source\.(mp4|webm|mp3|m4a|ogg)$/.test(value)) {
    return {
      kind: /\.(mp3|m4a|ogg)$/.test(value) ? "audio" : "video",
      provider: "Uploaded media",
      url: value,
      src: value,
    };
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== ""
  )
    return null;
  const host = url.hostname.toLowerCase();
  if (
    [
      "youtu.be",
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "www.youtube-nocookie.com",
    ].includes(host)
  ) {
    const id =
      host === "youtu.be"
        ? url.pathname.slice(1)
        : url.pathname === "/watch"
          ? url.searchParams.get("v")
          : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)$/)?.[1];
    if (!id || !/^[\w-]{11}$/.test(id)) return null;
    const start =
      url.searchParams.get("start") ?? url.searchParams.get("t") ?? "";
    const seconds = /^\d{1,6}s?$/.test(start) ? Number.parseInt(start) : 0;
    return {
      kind: "embed",
      provider: "YouTube",
      url: `https://www.youtube.com/watch?v=${id}${seconds ? `&t=${seconds}` : ""}`,
      src: `https://www.youtube-nocookie.com/embed/${id}${seconds ? `?start=${seconds}` : ""}`,
    };
  }
  if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(host)) {
    const match = url.pathname.match(
      /^\/(?:video\/)?(\d{1,12})(?:\/([a-f0-9]{6,32}))?$/,
    );
    if (!match) return null;
    const hash = match[2] ?? url.searchParams.get("h");
    if (hash && !/^[a-f0-9]{6,32}$/.test(hash)) return null;
    return {
      kind: "embed",
      provider: "Vimeo",
      url: `https://vimeo.com/${match[1]}${hash ? `/${hash}` : ""}`,
      src: `https://player.vimeo.com/video/${match[1]}?dnt=1${hash ? `&h=${hash}` : ""}`,
    };
  }
  if (host === "open.spotify.com") {
    const match = url.pathname.match(
      /^\/(?:embed\/)?(track|album|playlist|episode|show)\/([a-zA-Z0-9]{22})$/,
    );
    if (!match) return null;
    return {
      kind: "embed",
      provider: "Spotify",
      url: `https://open.spotify.com/${match[1]}/${match[2]}`,
      src: `https://open.spotify.com/embed/${match[1]}/${match[2]}`,
    };
  }
  if (/\.(mp4|webm|mp3|m4a|ogg)$/i.test(url.pathname)) {
    return {
      kind: /\.(mp3|m4a|ogg)$/i.test(url.pathname) ? "audio" : "video",
      provider: "Media",
      url: url.href,
      src: url.href,
    };
  }
  return null;
}

export const escapeMediaAttribute = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export function mediaHtml(value: string): string | null {
  const media = postMedia(value);
  if (!media) return null;
  const src = escapeMediaAttribute(media.src);
  const url = escapeMediaAttribute(media.url);
  const player =
    media.kind === "embed"
      ? `<iframe src="${src}" title="${media.provider} player" loading="lazy" allow="fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
      : `<${media.kind} src="${src}" controls preload="metadata"${media.kind === "video" ? " playsinline" : ""}></${media.kind}>`;
  return `<figure class="post-media${media.provider === "Spotify" ? " post-media-audio" : ""}" data-media-url="${url}">${player}<figcaption><a href="${url}">Open ${media.provider === "Media" || media.provider === "Uploaded media" ? media.kind : media.provider}</a></figcaption></figure>`;
}
