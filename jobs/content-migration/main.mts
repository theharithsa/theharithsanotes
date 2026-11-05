import { createHash } from "node:crypto";
import manifest from "./manifest.json" with { type: "json" };
import { database, mediaBucket } from "../../src/server/firebase.ts";
import { namespace, collection } from "../../src/server/config.ts";
import {
  getEntry,
  saveEntry,
  publishEntry,
} from "../../src/server/repository.ts";
import {
  observe,
  firebaseOperation,
  auditEvent,
  enqueueAudit,
  operationalLog,
} from "../../src/server/telemetry.ts";
import { isSection, type EntryData } from "../../src/server/models.ts";
import type { MediaRecord } from "../../src/server/media.ts";
if (namespace !== "live" || process.env.CMS_MIGRATION_APPROVED !== "baseline-1")
  throw Error("Migration needs the explicit live baseline flag");
try {
  await observe("cms.migration", { "migration.id": "baseline-1" }, async () => {
    const revisions = await Promise.all(
      manifest.map(async (row) => {
        if (!isSection(row.section)) throw Error("Invalid manifest section");
        const stored = await firebaseOperation(
          "get",
          "revisions",
          { section: row.section, id: row.id, source: "preview-baseline" },
          () =>
            database()
              .collection("cms_preview_revisions")
              .doc(`${row.section}--${row.id}--${row.revision}`)
              .get(),
          (snapshot) => ({ exists: snapshot.exists }),
        );
        const data = stored.get("data") as EntryData;
        if (
          !stored.exists ||
          createHash("sha256").update(JSON.stringify(data)).digest("hex") !==
            row.sha256
        )
          throw Error("Immutable baseline verification failed");
        return { ...row, data };
      }),
    );
    const mediaIds = [
      ...new Set(
        revisions.flatMap((row) =>
          [
            ...JSON.stringify(row.data).matchAll(/\/media\/([a-f0-9]{64})\//g),
          ].map((match) => match[1]!),
        ),
      ),
    ];
    let next = 0;
    await Promise.all(
      Array.from({ length: 8 }, async () => {
        while (next < mediaIds.length) {
          const id = mediaIds[next++]!;
          const target = database().collection(collection("media")).doc(id);
          if ((await target.get()).exists) continue;
          const source = await database()
            .collection("cms_preview_media")
            .doc(id)
            .get();
          if (!source.exists || !source.get("published"))
            throw Error("Missing approved source media");
          const row = source.data() as MediaRecord;
          const paths: Record<string, string> = {};
          for (const [variant, path] of Object.entries(row.paths)) {
            if (!path.startsWith(`journal/preview/media/${id}/`))
              throw Error("Unexpected source media path");
            const destination = path.replace(
              "journal/preview/",
              "journal/live/",
            );
            await firebaseOperation(
              "copy",
              "media",
              { id, variant },
              async () => {
                try {
                  await mediaBucket()
                    .file(path)
                    .copy(mediaBucket().file(destination), {
                      preconditionOpts: { ifGenerationMatch: 0 },
                    });
                } catch (error) {
                  if (!(
                    error &&
                    typeof error === "object" &&
                    "code" in error &&
                    Number(error.code) === 412
                  ))
                    throw error;
                }
              },
              () => ({ copied: true }),
            );
            paths[variant] = destination;
          }
          await target.create({ ...row, paths, published: false });
        }
      }),
    );
    next = 0;
    await Promise.all(
      Array.from({ length: 4 }, async () => {
        while (next < revisions.length) {
          const row = revisions[next++]!;
          if (!isSection(row.section)) throw Error("Invalid section");
          let existing = null;
          try {
            existing = await getEntry(row.section, row.id);
          } catch (error) {
            if (!(
              error &&
              typeof error === "object" &&
              "code" in error &&
              error.code === "NOT_FOUND"
            ))
              throw error;
          }
          if (!existing)
            existing = await saveEntry(row.section, row.id, row.data, 0);
          if (existing.publishedRevision === null)
            await publishEntry(
              row.section,
              row.id,
              existing.draftRevision,
              `migration-live-${row.id}`.slice(0, 100),
            );
        }
      }),
    );
    await enqueueAudit(
      auditEvent("migration.completed", {
        "migration.id": "baseline-1",
        "migration.entries": revisions.length,
        "migration.images": mediaIds.length,
      }),
    );
    operationalLog("migration.completed", {
      "migration.entries": revisions.length,
      "migration.images": mediaIds.length,
    });
  });
} catch (error) {
  operationalLog("migration.failed", {}, error);
  process.exitCode = 1;
} finally {
  await globalThis.__harithsaTelemetry?.shutdown();
}
