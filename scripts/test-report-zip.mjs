import { inflateRawSync } from "node:zlib";
export function readReports(bytes) {
  if (bytes.length > 8 * 1024 * 1024) throw Error("Artifact too large");
  const reports = [];
  let total = 0;
  // Locate the central directory; use its sizes so data descriptors cannot confuse parsing.
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--)
    if (bytes.readUInt32LE(i) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw Error("Invalid report archive");
  const count = bytes.readUInt16LE(end + 10);
  if (count > 10) throw Error("Too many report files");
  let offset = bytes.readUInt32LE(end + 16);
  for (let i = 0; i < count; i++) {
    if (bytes.readUInt32LE(offset) !== 0x02014b50)
      throw Error("Invalid directory");
    const flags = bytes.readUInt16LE(offset + 8),
      method = bytes.readUInt16LE(offset + 10),
      compressed = bytes.readUInt32LE(offset + 20),
      size = bytes.readUInt32LE(offset + 24),
      nameSize = bytes.readUInt16LE(offset + 28),
      extra = bytes.readUInt16LE(offset + 30),
      comment = bytes.readUInt16LE(offset + 32),
      local = bytes.readUInt32LE(offset + 42);
    const name = bytes
      .subarray(offset + 46, offset + 46 + nameSize)
      .toString("utf8");
    offset += 46 + nameSize + extra + comment;
    if (
      !["site-tests.xml", "cms-tests.xml", "foundation-tests.xml"].includes(
        name,
      ) ||
      flags & 1 ||
      ![0, 8].includes(method) ||
      size > 8 * 1024 * 1024 ||
      (total += size) > 8 * 1024 * 1024
    )
      throw Error("Unsupported artifact member");
    if (bytes.readUInt32LE(local) !== 0x04034b50)
      throw Error("Invalid local header");
    const start =
      local +
      30 +
      bytes.readUInt16LE(local + 26) +
      bytes.readUInt16LE(local + 28);
    if (start + compressed > bytes.length) throw Error("Truncated archive");
    const input = bytes.subarray(start, start + compressed);
    const output =
      method === 8
        ? inflateRawSync(input, { maxOutputLength: 8 * 1024 * 1024 })
        : input;
    if (output.length !== size) throw Error("Report length mismatch");
    reports.push({ name, xml: output.toString("utf8") });
  }
  return reports;
}
