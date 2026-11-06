// This file runs only from trusted main in the observer workflow, never from PR code.
import { junitRecords } from "./junit-records.mjs";
import { readReports } from "./test-report-zip.mjs";
const repository = "theharithsa/theharithsanotes";
const source = JSON.parse(
  await (
    await import("node:fs/promises")
  ).readFile(process.env.GITHUB_EVENT_PATH, "utf8"),
);
async function github(path) {
  const response = await fetch(
    `https://api.github.com/repos/${repository}${path}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok) throw Error(`GitHub source returned ${response.status}`);
  return response.json();
}
const records = [];
const sha =
  source.workflow_run?.head_sha ??
  source.pull_request?.head?.sha ??
  process.env.GITHUB_SHA;
const event = process.env.GITHUB_EVENT_NAME;
const record = (kind, id, status, time, name, url, durationMs) =>
  records.push({
    kind,
    id: String(id),
    status: status ?? "neutral",
    time:
      time ?? source.workflow_run?.updated_at ?? source.repository?.updated_at,
    sha,
    name,
    url,
    ...(Number.isFinite(durationMs) && durationMs >= 0 ? { durationMs } : {}),
  });
if (event === "workflow_run") {
  const run = source.workflow_run;
  const runId = `${run.id}/${run.run_attempt}`;
  record(
    "workflow",
    runId,
    run.conclusion,
    run.updated_at,
    run.name,
    run.html_url,
    Date.parse(run.updated_at) - Date.parse(run.run_started_at),
  );
  for (let page = 1; page <= 10; page++) {
    const result = await github(
      `/actions/runs/${run.id}/attempts/${run.run_attempt}/jobs?per_page=100&page=${page}`,
    );
    for (const job of result.jobs) {
      record(
        "job",
        `${runId}/${job.id}`,
        job.conclusion,
        job.completed_at ?? job.started_at,
        job.name,
        job.html_url,
        Date.parse(job.completed_at) - Date.parse(job.started_at),
      );
      for (const step of job.steps ?? [])
        record(
          "step",
          `${runId}/${job.id}/${step.number}`,
          step.conclusion,
          step.completed_at ?? step.started_at,
          step.name,
          job.html_url,
          Date.parse(step.completed_at) - Date.parse(step.started_at),
        );
    }
    if (result.jobs.length < 100) break;
  }
  const artifacts = await github(
    `/actions/runs/${run.id}/artifacts?per_page=100`,
  );
  for (const artifact of artifacts.artifacts.filter(
    (item) =>
      item.name === `journal-test-results-${run.run_attempt}` && !item.expired,
  )) {
    if (artifact.size_in_bytes > 8 * 1024 * 1024)
      throw Error("Report artifact exceeds size limit");
    const response = await fetch(
      `https://api.github.com/repos/${repository}/actions/artifacts/${artifact.id}/zip`,
      {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` },
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok) throw Error("Could not fetch test reports");
    const bytes = Buffer.from(await response.arrayBuffer());
    for (const report of readReports(bytes))
      records.push(
        ...junitRecords(report.xml, {
          runId: run.id,
          attempt: run.run_attempt,
          artifactId: artifact.id,
          sha,
          observedAt: run.updated_at,
          url: run.html_url,
        }),
      );
  }
} else if (event === "issues" || event === "pull_request_target") {
  const item = source.issue ?? source.pull_request;
  const kind = source.issue ? "issue" : "pull_request";
  record(
    kind,
    `${item.number}/${source.action}/${item.updated_at}`,
    source.pull_request?.merged ? "merged" : source.action,
    item.updated_at,
    `${kind} ${item.number}`,
    item.html_url,
  );
} else
  record(
    "verification",
    `observer/${process.env.GITHUB_RUN_ID}/${process.env.GITHUB_RUN_ATTEMPT}`,
    "success",
    new Date().toISOString(),
    "Observer connectivity",
    `https://github.com/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  );
const audience = "https://theharithsanotes.com/api/cms/ci";
const oidc = await fetch(
  `${process.env.ACTIONS_ID_TOKEN_REQUEST_URL}&audience=${encodeURIComponent(audience)}`,
  {
    headers: {
      Authorization: `Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`,
    },
  },
);
if (!oidc.ok) throw Error("Could not obtain workflow identity");
const jwt = (await oidc.json()).value;
for (let offset = 0; offset < records.length; offset += 500) {
  let success = false;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(audience, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: records.slice(offset, offset + 500) }),
      signal: AbortSignal.timeout(30000),
    });
    if (response.status === 202) {
      success = true;
      break;
    }
    if (response.status < 500 && response.status !== 429)
      throw Error(`Telemetry gateway rejected request (${response.status})`);
    await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
  }
  if (!success) throw Error("Execution reporting remains unavailable");
}
process.stdout.write(
  JSON.stringify({ reported: records.length, run: process.env.GITHUB_RUN_ID }) +
    "\n",
);
