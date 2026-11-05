import { applicationDefault } from "firebase-admin/app";
import { writeFile, mkdir } from "node:fs/promises";
import { namespace } from "../src/server/config.ts";
import { auditAudience } from "../src/server/scheduler.ts";
import { trafficForRelease } from "./run-traffic.mjs";
import {
  auditEvent,
  enqueueAudit,
  observe,
  operationalLog,
} from "../src/server/telemetry.ts";
const project = "the-harithsa-notes-94";
const parent = `projects/${project}/locations/us-east1`;
const image = process.env.CMS_IMAGE_DIGEST;
const sha = process.env.SOURCE_REVISION;
const version = process.env.SERVICE_VERSION;
if (
  !["live", "preview"].includes(namespace) ||
  !image?.match(
    /^us-east1-docker\.pkg\.dev\/the-harithsa-notes-94\/harithsa-journal\/web@sha256:[a-f0-9]{64}$/,
  ) ||
  !sha?.match(/^[a-f0-9]{40}$/) ||
  !version
)
  throw Error(
    "Set CMS_NAMESPACE, CMS_IMAGE_DIGEST, SOURCE_REVISION and SERVICE_VERSION explicitly",
  );
interface Operation {
  name: string;
  done?: boolean;
  error?: { code: number; message: string };
  response?: Record<string, unknown>;
}
async function api<T>(
  host: string,
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const credential = await applicationDefault().getAccessToken();
  const response = await fetch(`https://${host}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${credential.access_token}`,
      "Content-Type": "application/json",
      "x-goog-user-project": project,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });
  const result = (await response.json()) as T;
  if (!response.ok) {
    const error = new Error(
      `Provider ${host} returned ${response.status}`,
    ) as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  return result;
}
async function complete(
  operation: Operation,
): Promise<Record<string, unknown>> {
  let current = operation;
  const until = Date.now() + 300000;
  while (!current.done) {
    if (Date.now() > until)
      throw Error(
        "Provider operation remains pending; inspect its receipt before retrying",
      );
    await new Promise((resolve) => setTimeout(resolve, 2500));
    current = await api<Operation>("run.googleapis.com", "/v2/" + current.name);
  }
  if (current.error)
    throw Error(`Provider operation failed (${current.error.code})`);
  return current.response ?? {};
}
async function upsert(
  kind: "services" | "jobs",
  id: string,
  body: Record<string, unknown>,
) {
  const path = `/v2/${parent}/${kind}/${id}`;
  try {
    const current = await api<{
      traffic?: Array<{
        type?: string;
        revision?: string;
        percent?: number;
        tag?: string;
      }>;
    }>("run.googleapis.com", path);
    if (kind === "services")
      body = { ...body, traffic: trafficForRelease(current.traffic ?? []) };
    return complete(
      await api<Operation>("run.googleapis.com", path, "PATCH", {
        ...body,
        name: `${parent}/${kind}/${id}`,
      }),
    );
  } catch (error) {
    if (!(
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 404
    ))
      throw error;
    return complete(
      await api<Operation>(
        "run.googleapis.com",
        `/v2/${parent}/${kind}?${kind === "jobs" ? "jobId" : "serviceId"}=${id}`,
        "POST",
        body,
      ),
    );
  }
}
async function grant(resource: string, role: string, member: string) {
  const policy = await api<{
    bindings?: Array<{ role: string; members: string[] }>;
    etag?: string;
  }>("run.googleapis.com", `/v2/${resource}:getIamPolicy`);
  policy.bindings ??= [];
  const binding = policy.bindings.find((item) => item.role === role);
  if (binding) {
    if (!binding.members.includes(member)) binding.members.push(member);
  } else policy.bindings.push({ role, members: [member] });
  await api("run.googleapis.com", `/v2/${resource}:setIamPolicy`, "POST", {
    policy,
  });
}
const env = Object.entries({
  CMS_NAMESPACE: namespace,
  CMS_DATA_SOURCE: "firestore",
  GOOGLE_CLOUD_PROJECT: project,
  SERVICE_VERSION: version,
  SOURCE_REVISION: sha,
  OTEL_SERVICE_NAME: "harithsa-notes-web",
  OTEL_EXPORTER_OTLP_ENDPOINT: "https://indiacs.live.dynatrace.com/api/v2/otlp",
}).map(([name, value]) => ({ name, value }));
const secret = {
  name: "DYNATRACE_INGEST_TOKEN",
  valueSource: {
    secretKeyRef: { secret: "harithsa-dynatrace-ingest", version: "1" },
  },
};
const account = `harithsa-journal@${project}.iam.gserviceaccount.com`;
try {
  await observe(
    "release.runtime",
    { "deployment.environment.name": namespace, "vcs.ref.head.revision": sha },
    async () => {
      await enqueueAudit(
        auditEvent("sdlc.deployment", {
          "sdlc.stage": "started",
          "sdlc.status": "in_progress",
          "sdlc.commit": sha,
          "deployment.image": image,
          "event.provider": "harithsa-notes.sdlc",
        }),
      );
      const name =
        namespace === "live" ? "harithsa-journal" : "harithsa-journal-preview";
      const service = await upsert("services", name, {
        ingress: "INGRESS_TRAFFIC_ALL",
        labels: { app: "harithsa-notes", environment: namespace },
        template: {
          serviceAccount: account,
          scaling: {
            minInstanceCount: 0,
            maxInstanceCount: namespace === "live" ? 2 : 1,
          },
          maxInstanceRequestConcurrency: 40,
          timeout: "60s",
          containers: [
            {
              image,
              ports: [{ containerPort: 8080 }],
              env: [...env, secret],
              resources: {
                limits: { cpu: "1", memory: "512Mi" },
                cpuIdle: true,
                startupCpuBoost: true,
              },
            },
          ],
        },
        traffic: [
          { type: "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST", percent: 100 },
        ],
      });
      await grant(
        `${parent}/services/${name}`,
        "roles/run.invoker",
        "allUsers",
      );
      const auditName = `harithsa-audit-${namespace}`;
      const job = await upsert("jobs", auditName, {
        template: {
          taskCount: 1,
          parallelism: 1,
          template: {
            serviceAccount: account,
            maxRetries: 0,
            timeout: "240s",
            containers: [
              {
                image,
                command: ["node"],
                args: [
                  "--import",
                  "./runtime/instrumentation.mts",
                  "jobs/content-audit/main.mts",
                ],
                env: [
                  ...env.filter((item) => item.name !== "OTEL_SERVICE_NAME"),
                  {
                    name: "OTEL_SERVICE_NAME",
                    value: "harithsa-notes-content-audit",
                  },
                  secret,
                ],
                resources: { limits: { cpu: "1", memory: "512Mi" } },
              },
            ],
          },
        },
      });
      const schedulerAccount = `harithsa-scheduler@${project}.iam.gserviceaccount.com`;
      await grant(
        `${parent}/jobs/${auditName}`,
        "roles/run.invoker",
        `serviceAccount:${schedulerAccount}`,
      );
      const schedulerPath = `/v1/${parent}/jobs/${auditName}`;
      const schedule = {
        name: `${parent}/jobs/${auditName}`,
        schedule: "*/5 * * * *",
        timeZone: "Etc/UTC",
        attemptDeadline: "60s",
        retryConfig: {
          retryCount: 1,
          minBackoffDuration: "30s",
          maxBackoffDuration: "60s",
          maxDoublings: 1,
        },
        httpTarget: {
          uri: `${service.uri}/api/cms/delivery`,
          httpMethod: "POST",
          headers: { "Content-Type": "application/json" },
          body: Buffer.from("{}").toString("base64"),
          oidcToken: {
            serviceAccountEmail: schedulerAccount,
            audience: auditAudience(),
          },
        },
      };
      try {
        await api("cloudscheduler.googleapis.com", schedulerPath);
        await api(
          "cloudscheduler.googleapis.com",
          schedulerPath,
          "PATCH",
          schedule,
        );
      } catch (error) {
        if (!(
          error &&
          typeof error === "object" &&
          "status" in error &&
          error.status === 404
        ))
          throw error;
        await api(
          "cloudscheduler.googleapis.com",
          `/v1/${parent}/jobs`,
          "POST",
          schedule,
        );
      }
      const receipt = {
        namespace,
        image,
        sha,
        version,
        service: service.name,
        url: service.uri,
        revision: service.latestReadyRevision,
        job: job.name,
        observedAt: new Date().toISOString(),
      };
      await mkdir("artifacts", { recursive: true });
      await writeFile(
        `artifacts/deployment-${namespace}.json`,
        JSON.stringify(receipt, null, 2),
      );
      await enqueueAudit(
        auditEvent("sdlc.deployment", {
          "sdlc.stage": "runtime_ready",
          "sdlc.status": "success",
          "sdlc.commit": sha,
          "deployment.image": image,
          "deployment.revision": String(service.latestReadyRevision),
          "event.provider": "harithsa-notes.sdlc",
        }),
      );
      process.stdout.write(JSON.stringify(receipt) + "\n");
    },
  );
} catch (error) {
  operationalLog("release.failed", {}, error);
  await enqueueAudit(
    auditEvent("sdlc.deployment", {
      "sdlc.stage": "runtime",
      "sdlc.status": "failure",
      "sdlc.commit": sha,
      "deployment.image": image,
      "event.provider": "harithsa-notes.sdlc",
    }),
  );
  throw error;
} finally {
  await globalThis.__harithsaTelemetry?.shutdown();
}
