import { readFile } from "node:fs/promises";
import { applicationDefault } from "firebase-admin/app";
import { createHash } from "node:crypto";
import { database } from "../src/server/firebase.ts";
import { collection } from "../src/server/config.ts";
import { auditEvent, outboxDocument } from "../src/server/telemetry.ts";
const project = "the-harithsa-notes-94";
const input = JSON.parse(await readFile(process.argv[2] ?? "", "utf8")) as {
  kind: "cloud-build" | "hosting";
  id: string;
  sha: string;
  channel?: string;
};
if (
  !["cloud-build", "hosting"].includes(input.kind) ||
  !input.sha?.match(/^[a-f0-9]{40}$/) ||
  !/^[a-zA-Z0-9_-]{1,100}$/.test(input.id)
)
  throw Error("Invalid provider receipt request");
const credential = await applicationDefault().getAccessToken();
const endpoint =
  input.kind === "cloud-build"
    ? `https://cloudbuild.googleapis.com/v1/projects/${project}/locations/us-east1/builds/${input.id}`
    : `https://firebasehosting.googleapis.com/v1beta1/sites/${project}/channels/${input.channel ?? "live"}`;
const response = await fetch(endpoint, {
  headers: {
    Authorization: `Bearer ${credential.access_token}`,
    "x-goog-user-project": project,
  },
  signal: AbortSignal.timeout(15000),
});
if (!response.ok) throw Error(`Provider read failed ${response.status}`);
const row = (await response.json()) as Record<string, unknown>;
const data: Record<string, string | number | boolean | null> = {
  "event.provider": "harithsa-notes.sdlc",
  "sdlc.source": input.kind,
  "sdlc.commit": input.sha,
  "sdlc.execution.id": input.id,
};
if (input.kind === "cloud-build") {
  const build = row as {
    id: string;
    status: string;
    finishTime?: string;
    startTime?: string;
    substitutions?: Record<string, string>;
    results?: { images?: Array<{ digest: string }> };
  };
  if (
    build.id !== input.id ||
    build.substitutions?._SOURCE_REVISION !== input.sha ||
    !["SUCCESS", "FAILURE", "TIMEOUT", "CANCELLED", "EXPIRED"].includes(
      build.status,
    )
  )
    throw Error("Build source or terminal state mismatch");
  Object.assign(data, {
    "sdlc.status": build.status === "SUCCESS" ? "success" : "failure",
    "sdlc.occurred_at": build.finishTime ?? "",
    "deployment.image.digest": build.results?.images?.[0]?.digest ?? "",
    "sdlc.duration.ms":
      build.finishTime && build.startTime
        ? Date.parse(build.finishTime) - Date.parse(build.startTime)
        : 0,
  });
} else {
  const release = row.release as
    | {
        name?: string;
        releaseTime?: string;
        version?: { name?: string; status?: string };
      }
    | undefined;
  const version = release?.version;
  if (
    !version?.name?.endsWith("/" + input.id) ||
    version.status !== "FINALIZED"
  )
    throw Error(
      "Hosting release does not match the verified immutable version",
    );
  Object.assign(data, {
    "sdlc.status": "success",
    "sdlc.stage": "hosting_released",
    "sdlc.occurred_at": release?.releaseTime ?? "",
    "deployment.hosting.version": input.id,
    "deployment.channel": input.channel ?? "live",
  });
}
const event = auditEvent(
  input.kind === "cloud-build" ? "sdlc.workflow" : "sdlc.deployment",
  data,
);
event.id = createHash("sha256")
  .update(`${input.kind}/${input.id}/${input.channel ?? "live"}`)
  .digest("hex");
const reference = database().collection(collection("outbox")).doc(event.id);
await database().runTransaction(async (tx) => {
  if (!(await tx.get(reference)).exists)
    tx.create(reference, outboxDocument(event));
});
process.stdout.write(
  JSON.stringify({
    recorded: event.id,
    provider: input.kind,
    status: data["sdlc.status"],
  }) + "\n",
);
