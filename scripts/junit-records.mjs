import { createHash } from "node:crypto";
export function junitRecords(xml, context) {
  if (
    typeof xml !== "string" ||
    Buffer.byteLength(xml) > 8 * 1024 * 1024 ||
    /<!DOCTYPE|<!ENTITY/i.test(xml) ||
    !/<testsuites?\b/.test(xml)
  )
    throw Error("Unsupported test report");
  const records = [];
  const pattern = /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g;
  for (const match of xml.matchAll(pattern)) {
    if (records.length >= 5000) throw Error("Test report exceeds case limit");
    const attributes = Object.fromEntries(
      [...match[1].matchAll(/([\w.-]+)="([^"]*)"/g)].map((row) => [
        row[1],
        row[2],
      ]),
    );
    if (!attributes.name) throw Error("Missing case identity");
    const duration = Number(attributes.time ?? 0);
    if (!Number.isFinite(duration) || duration < 0 || duration > 86400)
      throw Error("Invalid test duration");
    const identity = createHash("sha256")
      .update(
        `${attributes.classname ?? ""}/${attributes.name}/${records.length}`,
      )
      .digest("hex")
      .slice(0, 24);
    const body = match[2] ?? "";
    records.push({
      kind: "test",
      id: `${context.runId}/${context.attempt}/${context.artifactId}/${identity}`,
      status: /<(?:failure|error)\b/.test(body)
        ? "failure"
        : /<skipped\b/.test(body)
          ? "skipped"
          : "success",
      time: context.observedAt,
      sha: context.sha,
      name: `test/${identity}`,
      url: context.url,
      durationMs: Math.round(duration * 1000),
    });
  }
  if (!records.length) throw Error("Test report has no test cases");
  return records;
}
