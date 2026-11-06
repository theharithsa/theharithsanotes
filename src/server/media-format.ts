/** Byte signatures, not filenames or client MIME claims, choose the served type. */
export function playableFormat(
  bytes: Buffer,
): { kind: "video" | "audio"; extension: string; contentType: string } | null {
  if (bytes.length < 16) return null;
  if (bytes.toString("ascii", 4, 8) === "ftyp" && bytes.readUInt32BE(0) >= 16) {
    const audio = ["M4A ", "M4B "].includes(bytes.toString("ascii", 8, 12));
    return {
      kind: audio ? "audio" : "video",
      extension: audio ? "m4a" : "mp4",
      contentType: audio ? "audio/mp4" : "video/mp4",
    };
  }
  if (
    bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) &&
    bytes.subarray(0, 4096).includes(Buffer.from("webm"))
  )
    return { kind: "video", extension: "webm", contentType: "video/webm" };
  if (
    bytes.toString("ascii", 0, 4) === "OggS" &&
    (bytes.subarray(0, 4096).includes(Buffer.from("OpusHead")) ||
      bytes.subarray(0, 4096).includes(Buffer.from("vorbis")))
  )
    return { kind: "audio", extension: "ogg", contentType: "audio/ogg" };
  if (
    bytes.toString("ascii", 0, 3) === "ID3" ||
    (bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0 && (bytes[1]! & 6) !== 0)
  )
    return { kind: "audio", extension: "mp3", contentType: "audio/mpeg" };
  return null;
}

export function mediaRange(
  header: string | null,
  size: number,
): { start: number; end: number } | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) throw new RangeError("Invalid range");
  const start = match[1]
    ? Number(match[1])
    : Math.max(0, size - Number(match[2]));
  const end = match[1]
    ? match[2]
      ? Math.min(Number(match[2]), size - 1)
      : size - 1
    : size - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    start > end ||
    start >= size
  )
    throw new RangeError("Unsatisfiable range");
  return { start, end };
}
