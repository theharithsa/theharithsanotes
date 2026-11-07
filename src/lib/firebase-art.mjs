const bucket = "the-harithsa-notes-94.firebasestorage.app";
export const artWidths = [400, 600, 800, 900, 1200];

export function publicArtUrl(object) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(object)}?alt=media`;
}

export function artVariant(name, width) {
  return `public-art/v1/variants/${name}.${width}.webp`;
}

/** @param {{src:string,width:number,height:number}} asset @param {number[]} widths */
export function firebaseImage(asset, widths) {
  const name = asset.src.split("/").at(-1);
  if (!name || !/^[-\w.]+$/.test(name))
    throw new Error("Invalid bundled artwork name");
  const variants = [
    ...new Set(widths.map((width) => Math.min(width, asset.width))),
  ];
  const width = Math.max(...variants);
  return {
    src: publicArtUrl(artVariant(name, width)),
    srcset: variants
      .map((w) => `${publicArtUrl(artVariant(name, w))} ${w}w`)
      .join(", "),
    width,
    height: Math.round((asset.height * width) / asset.width),
  };
}
