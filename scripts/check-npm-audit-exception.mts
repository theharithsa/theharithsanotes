import { readFile } from "node:fs/promises";
import { z } from "zod";

const repository = "theharithsa/theharithsanotes";
const pullRequest = 130;
const advisory = "GHSA-fc5q-39xc-vjpf";
const expires = "2026-11-19T16:30:00Z";

const severity = z.enum(["info", "low", "moderate", "high", "critical"]);
const finding = z.object({
  source: z.number().int(),
  name: z.string(),
  dependency: z.string(),
  severity,
  url: z.string(),
});
const auditReport = z.object({
  auditReportVersion: z.literal(2),
  error: z.undefined().optional(),
  vulnerabilities: z.record(
    z.string(),
    z.object({
      severity,
      via: z.array(z.union([z.string(), finding])).min(1),
    }),
  ),
  metadata: z.object({
    vulnerabilities: z.object({
      high: z.number().int().positive(),
      critical: z.literal(0),
    }),
  }),
});
const isBlocking = (level: z.infer<typeof severity>) =>
  level === "high" || level === "critical";

export function checkReport(value: unknown): number {
  const { vulnerabilities, metadata } = auditReport.parse(value);
  const reports = Object.entries(vulnerabilities);
  const blocking = reports.filter(([, item]) => isBlocking(item.severity));
  if (blocking.length !== metadata.vulnerabilities.high) {
    throw new Error("Audit severity counts disagree");
  }

  const accepted = new Set<string>();
  for (const [name, item] of reports) {
    for (const cause of item.via) {
      if (typeof cause === "string") {
        if (!Object.hasOwn(vulnerabilities, cause)) {
          throw new Error("Audit contains an unresolved dependency finding");
        }
      } else if (isBlocking(cause.severity)) {
        if (
          name !== "picomatch" ||
          cause.name !== name ||
          cause.dependency !== name ||
          cause.severity !== "high" ||
          cause.source !== 1247710 ||
          cause.url !== `https://github.com/advisories/${advisory}`
        ) {
          throw new Error("Audit contains an additional blocking advisory");
        }
        accepted.add(name);
      }
    }
  }
  if (accepted.size === 0) throw new Error("The withdrawn advisory is absent");

  // npm reports transitive failures as package names in `via`.
  for (let count = 0; count < reports.length; count++) {
    const size = accepted.size;
    for (const [name, item] of reports) {
      if (
        item.via.some(
          (cause) => typeof cause === "string" && accepted.has(cause),
        )
      ) {
        accepted.add(name);
      }
    }
    if (accepted.size === size) break;
  }
  if (blocking.some(([name]) => !accepted.has(name))) {
    throw new Error("Audit contains an unrelated blocking dependency finding");
  }
  return blocking.length;
}

async function github(path: string): Promise<unknown> {
  const response = await fetch(`https://api.github.com/${path}`, {
    headers: { Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok)
    throw new Error(`GitHub verification returned ${response.status}`);
  return response.json();
}

async function checkScope() {
  if (
    process.env.GITHUB_REPOSITORY !== repository ||
    Date.now() >= Date.parse(expires)
  ) {
    throw new Error("Audit exception is outside its repository or expiry");
  }
  if (process.env.GITHUB_EVENT_NAME === "pull_request") {
    const event = z.object({
      number: z.literal(pullRequest),
      pull_request: z.object({
        base: z.object({ ref: z.literal("main") }),
        head: z.object({
          ref: z.literal("codex/fix-origin-404s"),
          repo: z.object({ full_name: z.literal(repository) }),
        }),
      }),
    });
    event.parse(
      JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH ?? "", "utf8")),
    );
  } else if (
    process.env.GITHUB_EVENT_NAME === "push" &&
    process.env.GITHUB_REF === "refs/heads/main"
  ) {
    const merged = z
      .object({
        merged: z.literal(true),
        merge_commit_sha: z.string().regex(/^[a-f0-9]{40}$/),
      })
      .parse(await github(`repos/${repository}/pulls/${pullRequest}`));
    if (merged.merge_commit_sha !== process.env.GITHUB_SHA) {
      throw new Error("Only the exact merge of PR #130 qualifies");
    }
  } else {
    throw new Error("Audit exception is outside its event scope");
  }
  z.object({
    ghsa_id: z.literal(advisory),
    withdrawn_at: z.iso.datetime(),
  }).parse(await github(`advisories/${advisory}`));
}

if (import.meta.main) {
  try {
    const report = JSON.parse(await readFile(process.argv[2] ?? "", "utf8"));
    const count = checkReport(report);
    await checkScope();
    process.stdout.write(
      `Accepted ${count} findings tied to withdrawn ${advisory} for PR #130. Exception expires ${expires}.\n`,
    );
  } catch (error) {
    process.stderr.write(
      `Required npm audit failed. ${error instanceof Error ? error.message : "Unknown error"}\n`,
    );
    process.exitCode = 1;
  }
}
