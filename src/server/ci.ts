import { createPublicKey, verify, createHash } from "node:crypto";
import { CmsError, type AuditEvent } from "./models.ts";
import { database } from "./firebase.ts";
import { collection } from "./config.ts";
import { auditEvent, outboxDocument, firebaseOperation } from "./telemetry.ts";
interface Claims {
  iss: string;
  aud: string;
  exp: number;
  nbf?: number;
  repository: string;
  workflow_ref: string;
  event_name: string;
  run_id: string;
  run_attempt: string;
  sha: string;
}
let keys:
  { expires: number; values: Array<JsonWebKey & { kid: string }> } | undefined;
export async function authorizeCi(request: Request): Promise<Claims> {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer ([\w.-]{20,16000})$/)?.[1];
  if (!token)
    throw new CmsError("UNAUTHENTICATED", 401, "Workflow identity required");
  try {
    const [head, body, signature] = token.split(".");
    if (!head || !body || !signature) throw Error();
    const header = JSON.parse(Buffer.from(head, "base64url").toString()) as {
      kid: string;
      alg: string;
    };
    if (header.alg !== "RS256") throw Error();
    if (!keys || keys.expires < Date.now()) {
      const response = await fetch(
        "https://token.actions.githubusercontent.com/.well-known/jwks",
        { signal: AbortSignal.timeout(5000), redirect: "error" },
      );
      if (!response.ok) throw Error();
      const data = (await response.json()) as {
        keys: Array<JsonWebKey & { kid: string }>;
      };
      keys = { expires: Date.now() + 300000, values: data.keys };
    }
    const jwk = keys.values.find((key) => key.kid === header.kid);
    if (
      !jwk ||
      !verify(
        "RSA-SHA256",
        Buffer.from(`${head}.${body}`),
        createPublicKey({ key: jwk, format: "jwk" }),
        Buffer.from(signature, "base64url"),
      )
    )
      throw Error();
    const claims = JSON.parse(
      Buffer.from(body, "base64url").toString(),
    ) as Claims;
    const now = Date.now() / 1000;
    if (
      claims.iss !== "https://token.actions.githubusercontent.com" ||
      claims.aud !== "https://theharithsa.com/api/cms/ci" ||
      claims.exp <= now ||
      (claims.nbf ?? 0) > now + 30 ||
      claims.repository !== "theharithsa/theharithsanotes" ||
      claims.workflow_ref !==
        "theharithsa/theharithsanotes/.github/workflows/observability.yml@refs/heads/main" ||
      ![
        "workflow_run",
        "issues",
        "pull_request_target",
        "workflow_dispatch",
      ].includes(claims.event_name)
    )
      throw Error();
    return claims;
  } catch {
    throw new CmsError(
      "UNAUTHENTICATED",
      401,
      "This workflow identity could not be verified",
    );
  }
}
export async function acceptCi(input: Record<string, unknown>, claims: Claims) {
  const rows = input.records;
  if (!Array.isArray(rows) || rows.length > 1000)
    throw new CmsError(
      "INVALID_CONTENT",
      400,
      "Send at most 1000 execution records",
    );
  const accepted: string[] = [];
  for (let offset = 0; offset < rows.length; offset += 200) {
    await firebaseOperation(
      "report",
      "operations",
      {
        reporterRun: claims.run_id,
        count: Math.min(200, rows.length - offset),
      },
      async () => {
        const pending: Array<{
          receipt: FirebaseFirestore.DocumentReference;
          outbox: FirebaseFirestore.DocumentReference;
          event: AuditEvent;
          kind: string;
        }> = [];
        for (const raw of rows.slice(offset, offset + 200)) {
          if (!raw || typeof raw !== "object")
            throw new CmsError(
              "INVALID_CONTENT",
              400,
              "Invalid execution record",
            );
          const row = raw as Record<string, unknown>;
          if (
            ![
              "workflow",
              "job",
              "step",
              "issue",
              "pull_request",
              "deployment",
              "verification",
              "test",
            ].includes(String(row.kind)) ||
            !/^[a-zA-Z0-9_.:/-]{1,200}$/.test(String(row.id)) ||
            ![
              "success",
              "failure",
              "cancelled",
              "skipped",
              "neutral",
              "timed_out",
              "action_required",
              "completed",
              "opened",
              "closed",
              "reopened",
              "merged",
              "in_progress",
            ].includes(String(row.status)) ||
            !/^([a-f0-9]{40}|unknown)$/.test(String(row.sha)) ||
            !Number.isFinite(Date.parse(String(row.time)))
          )
            throw new CmsError(
              "INVALID_CONTENT",
              400,
              "Invalid execution identity or outcome",
            );
          const id = createHash("sha256")
            .update(`github/${claims.repository}/${row.kind}/${row.id}`)
            .digest("hex");
          const event: AuditEvent = auditEvent(
            `sdlc.${row.kind}`,
            {
              "event.provider": "harithsa-notes.sdlc",
              "origin.service.name": "harithsa-notes-ci",
              "origin.service.version": String(row.sha),
              "sdlc.source": "github-actions",
              "sdlc.repository": claims.repository,
              "sdlc.execution.id": String(row.id),
              "sdlc.status": String(row.status),
              "sdlc.commit": String(row.sha),
              "sdlc.occurred_at": String(row.time),
              "sdlc.reporter.run_id": claims.run_id,
              "sdlc.reporter.attempt": claims.run_attempt,
              "sdlc.kind": String(row.kind),
              ...(typeof row.durationMs === "number" &&
              Number.isFinite(row.durationMs) &&
              row.durationMs >= 0
                ? { "sdlc.duration.ms": row.durationMs }
                : {}),
              ...(typeof row.name === "string"
                ? {
                    "sdlc.name": row.name
                      .replace(/[^a-zA-Z0-9 ._:/()-]/g, "")
                      .slice(0, 120),
                  }
                : {}),
              ...(typeof row.url === "string" &&
              /^https:\/\/github.com\/theharithsa\/theharithsanotes\//.test(
                row.url,
              )
                ? { "sdlc.source_url": row.url.slice(0, 500) }
                : {}),
            },
            "ci-reported",
          );
          event.id = id;
          event.time = String(row.time);
          // Stable document IDs make transport retries idempotent. Delivered IDs are retained separately.
          const receipt = database()
            .collection(collection("operations"))
            .doc(`ci-${id}`);
          const outbox = database().collection(collection("outbox")).doc(id);
          pending.push({ receipt, outbox, event, kind: String(row.kind) });
          accepted.push(id);
        }
        await database().runTransaction(async (tx) => {
          const receipts = await Promise.all(
            pending.map((item) => tx.get(item.receipt)),
          );
          for (const [index, item] of pending.entries())
            if (!receipts[index]!.exists) {
              tx.create(item.receipt, {
                reportedAt: new Date().toISOString(),
                kind: item.kind,
              });
              tx.create(item.outbox, outboxDocument(item.event));
            }
        });
        return { count: pending.length };
      },
    );
  }
  return { accepted: accepted.length, reporter: claims.run_id };
}
