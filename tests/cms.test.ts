import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import sharp from "sharp";
import { validateData, CmsError } from "../src/server/models.ts";
import {
  saveEntry,
  getEntry,
  publishEntry,
  unpublishEntry,
  publishedDetail,
  restoreRevision,
  listRevisions,
  clearPublishedCache,
} from "../src/server/repository.ts";
import { database, identity } from "../src/server/firebase.ts";
import { collection, projectId } from "../src/server/config.ts";
import { handleCmsApi } from "../src/server/api.ts";
import { uploadMedia, mediaResponse } from "../src/server/media.ts";
import { drainAudit } from "../src/server/outbox.ts";
import { payloadSummary } from "../src/server/telemetry.ts";
import { createApiKey } from "../src/server/api-keys.ts";
import {
  reconcileWorkspace,
  workspaceSummary,
} from "../src/server/workspace.ts";
import { openApiDocument } from "../src/server/openapi.ts";
import {
  authorizeReader,
  inviteMember,
  revokeMember,
} from "../src/server/members.ts";
import { searchApi } from "../src/server/search.ts";
import {
  searchDocument,
  findSearchResults,
} from "../src/server/search-index.ts";
import { readingApi } from "../src/server/reading.ts";
import { listPublished } from "../src/server/repository.ts";
import { getJournalPage, getPages } from "../src/lib/journal.ts";

test("page stories preserve rich formatting and reject executable markup", () => {
  const base = {
    slug: "meet-vish",
    title: "Meet Vish",
    description: "Hello",
    paragraphs: ["A friendship."],
  };
  const html =
    '<p><strong>A friendship.</strong> <em>Still learning.</em> <a href="https://unsplash.com/@sayspoorthi">Spoorthi</a></p><blockquote><p>My own words.</p></blockquote><script>alert(1)</script><a href="javascript:alert(1)" onclick="alert(1)">Unsafe</a>';
  const saved = validateData("pages", {
    ...base,
    html,
    imageAlt: "A smiling illustration",
  });
  assert.match(String(saved.html), /<strong>A friendship\.<\/strong>/);
  assert.match(String(saved.html), /<em>Still learning\.<\/em>/);
  assert.match(
    String(saved.html),
    /href="https:\/\/unsplash.com\/@sayspoorthi"/,
  );
  assert.match(
    String(saved.html),
    /<blockquote><p>My own words\.<\/p><\/blockquote>/,
  );
  assert.doesNotMatch(String(saved.html), /script|onclick|alert/);
  assert.deepEqual(validateData("pages", base).paragraphs, base.paragraphs);
  assert.throws(
    () => validateData("pages", { ...base, html: "a".repeat(460001) }),
    CmsError,
  );
});

test("content validation rejects scripts, unsafe links, excessive nesting and reserved slugs", () => {
  const data = validateData("blogs", blog("safe"));
  assert.ok(!String(data.html).includes("<script"));
  assert.ok(!String(data.html).includes("javascript:"));
  assert.throws(
    () => validateData("blogs", { ...blog("admin"), slug: "admin" }),
    CmsError,
  );
  let nested: unknown = "x";
  for (let i = 0; i < 20; i++) nested = { child: nested };
  assert.throws(
    () => validateData("blogs", { ...blog("safe"), nested }),
    CmsError,
  );
  assert.throws(
    () => validateData("blogs", { ...blog("safe"), image: "" }, true),
    CmsError,
  );
  const summary = payloadSummary({
    secret: "DO_NOT_EXPORT",
    html: "PRIVATE_DRAFT",
  });
  assert.ok(!JSON.stringify(summary).includes("PRIVATE_DRAFT"));
  assert.equal(summary["payload.fields"], "secret,html");
  assert.throws(
    () =>
      validateData(
        "photos",
        {
          title: "Photo",
          src: "",
          alt: "",
          caption: "",
          width: 40,
          height: 30,
          shape: "wide",
        },
        true,
      ),
    CmsError,
  );
  assert.throws(
    () =>
      validateData(
        "blogs",
        {
          ...blog("too-many-images"),
          html:
            "<p>Story</p>" +
            Array.from(
              { length: 101 },
              (_, index) =>
                `<img src="/media/${index.toString(16).padStart(64, "0")}/1600.webp" alt="Illustration"/>`,
            ).join(""),
        },
        true,
      ),
    CmsError,
  );
});
function blog(slug: string) {
  return {
    title: "Integration article",
    slug,
    description: "Description",
    date: "2026-11-06",
    topic: "Engineering",
    tags: ["Testing"],
    image: "/images/test.webp",
    imageAlt: "A test illustration",
    minutes: 2,
    html: '<h2 id="heading">Heading</h2><p>A real draft.</p><script>alert(1)</script><a href="javascript:alert(1)">Unsafe</a>',
    source: "",
  };
}
const integration = process.env.FIRESTORE_EMULATOR_HOST ? test : test.skip;
integration(
  "approved post blocks survive draft and immutable publication",
  async () => {
    const id = randomUUID();
    const slug = "post-blocks-" + id;
    const draft = await saveEntry(
      "blogs",
      id,
      {
        ...blog(slug),
        html: '<aside class="post-callout" aria-label="Key idea"><p>A note.</p></aside><div class="post-image-grid"><figure><img src="/images/test.webp" alt="Sample" /><figcaption>Caption</figcaption></figure></div><ul><p>A legacy point</p></ul>',
      },
      0,
    );
    assert.match(String(draft.data.html), /class="post-callout"/);
    assert.match(String(draft.data.html), /<ul><li>A legacy point<\/li><\/ul>/);
    assert.equal(await publishedDetail("blogs", slug), null);
    await publishEntry("blogs", id, draft.draftRevision, "post-blocks-publish");
    const published = await publishedDetail<{ html: string }>("blogs", slug);
    assert.ok(published);
    assert.equal(published.data.html, draft.data.html);
    assert.match(published.data.html, /class="post-image-grid"/);
    await unpublishEntry("blogs", id, draft.draftRevision);
  },
);
integration(
  "private journals require an active invitation; keys and media remain section scoped",
  async () => {
    const uid = "invited-reader";
    await identity().createUser({
      uid,
      email: "invited@example.com",
      emailVerified: true,
    });
    const request = (
      path = "journal",
      jwt = token(uid, "invited@example.com"),
    ) =>
      new Request(`http://localhost:4321/api/reading/${path}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
    assert.equal(
      (
        await readingApi(
          new Request("http://localhost:4321/api/reading/journal"),
          "journal",
        )
      ).status,
      401,
    );
    assert.equal((await readingApi(request(), "journal")).status, 403);
    const invited = await inviteMember({
      email: "invited@example.com",
      expiresInDays: 30,
    });
    assert.equal((await authorizeReader(request())).uid, uid);
    assert.equal(
      (
        await readingApi(
          request("journal", token(uid, "invited@example.com", false)),
          "journal",
        )
      ).status,
      403,
    );
    const deniedCms = await handleCmsApi(request(), "entries/journal");
    assert.equal(deniedCms.status, 403);
    const bytes = await sharp({
      create: { width: 24, height: 16, channels: 3, background: "#b27849" },
    })
      .png()
      .toBuffer();
    const cover = await uploadMedia(
      bytes,
      "Private illustration",
      "An abstract notebook",
      "journal",
    );
    const regular = await uploadMedia(
      bytes,
      "Public illustration",
      "A notebook",
    );
    assert.notEqual(regular.id, cover.id);
    const draft = await saveEntry(
      "journal",
      randomUUID(),
      {
        title: "Private journal fixture",
        slug: "private-journal-fixture",
        description: "Synthetic private intro",
        date: "2026-11-06",
        image: `/media/${cover.id}/1600.webp`,
        imageAlt: "An abstract notebook",
        html: "<p>PRIVATE_BODY_SENTINEL</p>",
        tags: ["PRIVATE_TAG_SENTINEL"],
        sourceNotes: "PRIVATE_SOURCE_SENTINEL",
      },
      0,
    );
    const imageRequest = new Request(
      `http://localhost:4321/media/${cover.id}/800.webp`,
      { headers: request().headers },
    );
    await assert.rejects(() =>
      mediaResponse(imageRequest, cover.id, "800.webp"),
    );
    await publishEntry("journal", draft.id, 1, "private-test-publish");
    assert.equal(
      (
        await database().collection(collection("media")).doc(cover.id).get()
      ).get("published"),
      false,
    );
    await assert.rejects(() => listPublished("journal"));
    await assert.rejects(() =>
      publishedDetail("journal", "private-journal-fixture"),
    );
    const list = await readingApi(request(), "journal");
    assert.equal(list.status, 200);
    assert.match(list.headers.get("Cache-Control") ?? "", /no-store/);
    const body = JSON.stringify(await list.json());
    assert.ok(!body.includes("PRIVATE_BODY_SENTINEL"));
    assert.ok(!body.includes("PRIVATE_SOURCE_SENTINEL"));
    const detail = await readingApi(
      request("journal/private-journal-fixture"),
      "journal/private-journal-fixture",
    );
    assert.equal(detail.status, 200);
    const detailBody = JSON.stringify(await detail.json());
    assert.ok(detailBody.includes("PRIVATE_BODY_SENTINEL"));
    assert.ok(!detailBody.includes("PRIVATE_SOURCE_SENTINEL"));
    assert.equal(
      (await mediaResponse(imageRequest, cover.id, "800.webp")).status,
      200,
    );
    await assert.rejects(() =>
      mediaResponse(new Request(imageRequest.url), cover.id, "800.webp"),
    );
    const publicKey = await createApiKey({
      name: "Legacy public scope",
      scopes: ["media:read", "content:read"],
      sections: ["blogs"],
      expiresInDays: 1,
    });
    const keyRequest = new Request(imageRequest.url, {
      headers: { Authorization: `Bearer ${publicKey.token}` },
    });
    await assert.rejects(() =>
      mediaResponse(keyRequest, cover.id, "800.webp", true),
    );
    assert.equal(
      (await handleCmsApi(keyRequest, "entries/journal", true)).status,
      403,
    );
    const privateKey = await createApiKey({
      name: "Private scope",
      scopes: ["media:read"],
      sections: ["journal"],
      expiresInDays: 1,
    });
    assert.equal(
      (
        await mediaResponse(
          new Request(imageRequest.url, {
            headers: { Authorization: `Bearer ${privateKey.token}` },
          }),
          cover.id,
          "800.webp",
          true,
        )
      ).status,
      200,
    );
    await reconcileWorkspace();
    const tags = await listPublished<Record<string, unknown>>("tags");
    assert.ok(!JSON.stringify(tags).includes("PRIVATE_TAG_SENTINEL"));
    const searchRequest = (jwt?: string, query = "PRIVATE_BODY_SENTINEL") =>
      new Request("http://localhost:4321/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({ query }),
      });
    const anonymousSearch = await searchApi(searchRequest());
    assert.equal(anonymousSearch.status, 200);
    assert.equal((await anonymousSearch.json()).total, 0);
    const invitedSearch = await searchApi(
      searchRequest(token(uid, "invited@example.com")),
    );
    assert.match(invitedSearch.headers.get("Cache-Control") ?? "", /no-store/);
    const searchBody = await invitedSearch.json();
    assert.equal(searchBody.total, 1);
    assert.equal(searchBody.results[0].private, true);
    assert.ok(!JSON.stringify(searchBody).includes("PRIVATE_BODY_SENTINEL"));
    assert.equal(
      (
        await (
          await searchApi(
            searchRequest(
              token(uid, "invited@example.com"),
              "PRIVATE_SOURCE_SENTINEL",
            ),
          )
        ).json()
      ).total,
      0,
    );
    await revokeMember(invited.id);
    const revokedSearch = await searchApi(
      searchRequest(token(uid, "invited@example.com")),
    );
    assert.equal((await revokedSearch.json()).total, 0);

    assert.equal((await readingApi(request(), "journal")).status, 403);
    await assert.rejects(() =>
      mediaResponse(imageRequest, cover.id, "800.webp"),
    );
    await inviteMember({ email: "invited@example.com", expiresInDays: 1 });
    await unpublishEntry("journal", draft.id, 1);
    await assert.rejects(() =>
      mediaResponse(imageRequest, cover.id, "800.webp"),
    );
    await saveEntry(
      "journal",
      draft.id,
      { ...draft.data, slug: "private-journal-renamed" },
      1,
    );
    await publishEntry("journal", draft.id, 2, "private-test-alias");
    const alias = await readingApi(
      request("journal/private-journal-fixture"),
      "journal/private-journal-fixture",
    );
    assert.equal(alias.status, 200);
    assert.equal(
      ((await alias.json()) as { post: { slug: string } }).post.slug,
      "private-journal-renamed",
    );
    await unpublishEntry("journal", draft.id, 2);
  },
);
test("OpenAPI covers all collections, explicit publishing, protected media and the real data schemas", () => {
  const doc = openApiDocument();
  assert.equal(doc.openapi, "3.1.0");
  assert.equal(Object.keys(doc.paths).length, 68);
  for (const section of [
    "blogs",
    "books",
    "projects",
    "podcasts",
    "entertainment",
    "photos",
    "gogs",
    "pages",
    "tags",
  ]) {
    assert.ok(doc.paths[`/entries/${section}/{id}/publish`]);
    assert.ok((doc.components.schemas as Record<string, unknown>)[section]);
  }
  assert.ok(!JSON.stringify(doc).includes("theharithsa@gmail.com"));
  assert.deepEqual(doc.security, [{ ApiKey: [] }]);
});
integration(
  "drafts, optimistic conflicts, publish idempotency, immutable bodies, aliases and history",
  async () => {
    const id = randomUUID();
    const first = await saveEntry("blogs", id, blog("first-" + id), 0);
    assert.equal(await publishedDetail("blogs", String(first.data.slug)), null);
    const races = await Promise.allSettled([
      saveEntry("blogs", id, { ...first.data, title: "A" }, 1),
      saveEntry("blogs", id, { ...first.data, title: "B" }, 1),
    ]);
    assert.equal(races.filter((r) => r.status === "fulfilled").length, 1);
    const saved = races.find((r) => r.status === "fulfilled");
    assert.ok(saved?.status === "fulfilled");
    const row = saved.value;
    const results = await Promise.all([
      publishEntry("blogs", id, 2, "publish-1"),
      publishEntry("blogs", id, 2, "publish-1"),
    ]);
    assert.equal(results[0]!.publishedRevision, 2);
    const events = await database()
      .collection(collection("outbox"))
      .where("event.type", "==", "content.published")
      .get();
    assert.equal(
      events.docs.filter((doc) => doc.get("event").data["content.id"] === id)
        .length,
      1,
    );
    const changed = await saveEntry(
      "blogs",
      id,
      { ...row.data, slug: "second-" + id, html: "<p>New private text</p>" },
      2,
    );
    clearPublishedCache();
    const publicBefore = await publishedDetail<Record<string, unknown>>(
      "blogs",
      String(row.data.slug),
    );
    assert.ok(!String(publicBefore?.data.html).includes("New private"));
    await publishEntry("blogs", id, changed.draftRevision, "publish-2");
    clearPublishedCache();
    const alias = await publishedDetail("blogs", String(row.data.slug));
    assert.equal(alias?.canonical, "second-" + id);
    await assert.rejects(() => publishEntry("blogs", id, 2, "publish-3"), {
      code: "REVISION_CONFLICT",
    });
    const restored = await restoreRevision("blogs", id, 1, 3);
    assert.equal(restored.draftRevision, 4);
    assert.equal((await listRevisions("blogs", id)).length, 4);
    await unpublishEntry("blogs", id, 4);
    clearPublishedCache();
    assert.equal(await publishedDetail("blogs", "second-" + id), null);
  },
);
function token(
  uid: string,
  email = "theharithsa@gmail.com",
  verified = true,
  provider = "google.com",
  expired = false,
) {
  return [
    Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
      "base64url",
    ),
    Buffer.from(
      JSON.stringify({
        aud: projectId,
        iss: `https://securetoken.google.com/${projectId}`,
        sub: uid,
        user_id: uid,
        iat: Math.floor(Date.now() / 1000) - 10,
        exp: Math.floor(Date.now() / 1000) + (expired ? -100 : 3600),
        auth_time: Math.floor(Date.now() / 1000) - 10,
        email,
        email_verified: verified,
        firebase: {
          sign_in_provider: provider,
          identities: { "google.com": [uid] },
        },
      }),
    ).toString("base64url"),
    "",
  ].join(".");
}
integration(
  "API rejects anonymous, wrong owner, unverified, expired and cross-site requests",
  async () => {
    const uid = "cms-owner";
    try {
      await identity().createUser({
        uid,
        email: "theharithsa@gmail.com",
        emailVerified: true,
      });
    } catch (error) {
      if (!(
        error instanceof Error &&
        "code" in error &&
        error.code === "auth/uid-already-exists"
      ))
        throw error;
    }
    try {
      await identity().createUser({
        uid: "other",
        email: "other@example.com",
        emailVerified: true,
      });
    } catch (error) {
      if (!(
        error instanceof Error &&
        "code" in error &&
        error.code === "auth/uid-already-exists"
      ))
        throw error;
    }
    const request = (jwt?: string, origin = "http://localhost:4321") =>
      new Request("http://localhost:4321/api/cms/me", {
        headers: { origin, ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
      });
    assert.equal((await handleCmsApi(request(), "me")).status, 401);
    assert.equal(
      (
        await handleCmsApi(
          new Request("http://localhost:4321/api/cms/delivery", {
            method: "POST",
          }),
          "delivery",
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await handleCmsApi(
          new Request("http://localhost:4321/api/cms/ci", { method: "POST" }),
          "ci",
        )
      ).status,
      401,
    );
    const wrongToken = token("other", "other@example.com");
    await assert.doesNotReject(() => identity().verifyIdToken(wrongToken));
    const wrong = await handleCmsApi(request(wrongToken), "me");
    assert.equal(wrong.status, 403, JSON.stringify(await wrong.json()));
    assert.equal(
      (await handleCmsApi(request(token(uid, undefined, false)), "me")).status,
      403,
    );
    assert.equal(
      (
        await handleCmsApi(
          request(token(uid, undefined, true, "password")),
          "me",
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await handleCmsApi(
          request(token(uid, undefined, true, undefined, true)),
          "me",
        )
      ).status,
      401,
    );
    assert.equal(
      (await handleCmsApi(request(token(uid), "https://evil.example"), "me"))
        .status,
      403,
    );
    assert.equal((await handleCmsApi(request(token(uid)), "me")).status, 200);
    const session = await handleCmsApi(
      new Request("http://localhost:4321/api/cms/session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token(uid)}`,
          origin: "http://localhost:4321",
        },
      }),
      "session",
    );
    assert.equal(session.status, 200);
    const cookie = session.headers.get("set-cookie");
    assert.match(cookie ?? "", /HttpOnly; Secure; SameSite=Strict/);
    const { authorize } = await import("../src/server/auth.ts");
    assert.equal(
      (
        await authorize(
          new Request("http://localhost:4321/article", {
            headers: { cookie: cookie!.split(";")[0]! },
          }),
          true,
        )
      ).uid,
      uid,
    );
    assert.equal(
      (
        await handleCmsApi(
          new Request("http://localhost:4321/api/cms/entries/blogs", {
            method: "POST",
            headers: {
              cookie: cookie!.split(";")[0]!,
              "Content-Type": "application/json",
            },
            body: "{}",
          }),
          "entries/blogs",
        )
      ).status,
      401,
    );
    const cleared = await handleCmsApi(
      new Request("http://localhost:4321/api/cms/session", {
        method: "DELETE",
        headers: { origin: "http://localhost:4321" },
      }),
      "session",
    );
    assert.match(cleared.headers.get("set-cookie") ?? "", /Max-Age=0/);
    const id = randomUUID();
    const res = await handleCmsApi(
      new Request("http://localhost:4321/api/cms/entries/blogs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token(uid)}`,
          "Content-Type": "application/json",
          origin: "http://localhost:4321",
        },
        body: JSON.stringify({ data: blog(id) }),
      }),
      "entries/blogs",
    );
    assert.equal(res.status, 201);
  },
);
integration(
  "private media stays hidden until publication; duplicate uploads are safe",
  async () => {
    const bytes = await sharp({
      create: {
        width: 40,
        height: 30,
        channels: 3,
        background: {
          r: Math.floor(Math.random() * 255),
          g: Math.floor(Math.random() * 255),
          b: Math.floor(Math.random() * 255),
        },
      },
    })
      .png()
      .toBuffer();
    const [first, second] = await Promise.all([
      uploadMedia(bytes, "Test", "Test image"),
      uploadMedia(bytes, "Test", "Test image"),
    ]);
    assert.equal(first.id, second.id);
    await assert.rejects(
      () =>
        mediaResponse(
          new Request("http://localhost/media"),
          first.id,
          "1600.webp",
        ),
      { code: "NOT_FOUND" },
    );
    const id = randomUUID();
    const saved = await saveEntry(
      "blogs",
      id,
      { ...blog(id), image: `/media/${first.id}/1600.webp` },
      0,
    );
    await publishEntry("blogs", id, saved.draftRevision, "media-publish");
    assert.equal(
      (
        await mediaResponse(
          new Request("http://localhost/media"),
          first.id,
          "1600.webp",
        )
      ).status,
      200,
    );
    await assert.rejects(
      () => uploadMedia(Buffer.from('<svg onload="x"/>'), "Bad", "Bad"),
      { code: "INVALID_MEDIA" },
    );
  },
);
integration(
  "outbox retries use stable IDs and a single concurrent lease; terminal rejects remain visible",
  async () => {
    const store = database().collection(collection("outbox"));
    const existing = await store.get();
    for (let i = 0; i < existing.docs.length; i += 400) {
      const batch = database().batch();
      for (const doc of existing.docs.slice(i, i + 400)) batch.delete(doc.ref);
      await batch.commit();
    }
    let status = 429;
    const seen: string[] = [];
    const server = createServer(async (req, res) => {
      let body = "";
      for await (const chunk of req) body += chunk;
      seen.push(JSON.parse(body)[0]["event.id"]);
      res.writeHead(status, { "Retry-After": "1" });
      res.end();
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    assert.ok(address && typeof address === "object");
    process.env.BIZEVENTS_LOCAL_TEST = "true";
    process.env.BIZEVENTS_ENDPOINT = `http://127.0.0.1:${address.port}/ingest`;
    const id = randomUUID();
    await store.doc(id).set({
      state: "pending",
      availableAt: Date.now(),
      createdAt: Date.now(),
      attempts: 0,
      event: {
        id,
        type: "test.event",
        time: new Date().toISOString(),
        authority: "server-confirmed",
        data: {},
      },
    });
    try {
      const first = await drainAudit();
      assert.equal(first.failed, 1);
      assert.equal((await store.doc(id).get()).get("state"), "pending");
      status = 202;
      await store.doc(id).update({ availableAt: Date.now() });
      const results = await Promise.all([drainAudit(), drainAudit()]);
      assert.equal(
        results.reduce((n, row) => n + row.sent, 0),
        1,
      );
      assert.equal(new Set(seen).size, 1);
      assert.equal((await store.doc(id).get()).get("state"), "delivered");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  },
);
integration(
  "browser SDK REST access cannot read Firestore or Storage directly",
  async () => {
    const response = await fetch(
      `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${projectId}/databases/(default)/documents/${collection("published")}`,
    );
    assert.equal(response.status, 403);
    const storage = await fetch(
      `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/v0/b/the-harithsa-notes-94.firebasestorage.app/o?prefix=journal/`,
    );
    assert.equal(storage.status, 403);
  },
);
integration(
  "scoped keys enforce draft, publish, media and collection permissions; revocation and expiry are immediate",
  async () => {
    const full = await createApiKey({
      name: "Synthetic integration",
      scopes: [
        "content:read",
        "content:write",
        "content:publish",
        "media:read",
        "media:write",
      ],
      sections: ["blogs"],
      expiresInDays: 1,
    });
    const readonly = await createApiKey({
      name: "Synthetic reader",
      scopes: ["content:read"],
      sections: ["blogs"],
      expiresInDays: 1,
    });
    const call = (
      path: string,
      method = "GET",
      data?: unknown,
      key = full.token,
      headers: Record<string, string> = {},
    ) =>
      handleCmsApi(
        new Request("http://localhost:4321/api/v1/" + path, {
          method,
          headers: {
            Authorization: "Bearer " + key,
            ...(data instanceof FormData
              ? {}
              : { "Content-Type": "application/json" }),
            ...headers,
          },
          ...(data === undefined
            ? {}
            : { body: data instanceof FormData ? data : JSON.stringify(data) }),
        }),
        path,
        true,
      );
    assert.equal(
      (await call("entries/blogs", "GET", undefined, "invalid")).status,
      401,
    );
    assert.equal(
      (await call("entries/books", "GET", undefined, readonly.token)).status,
      403,
    );
    assert.equal(
      (
        await call(
          "entries/blogs",
          "POST",
          { data: blog(randomUUID()) },
          readonly.token,
        )
      ).status,
      403,
    );
    assert.equal((await call("keys")).status, 404);
    const created = await call("entries/blogs", "POST", {
      data: blog(randomUUID()),
    });
    assert.equal(created.status, 201);
    const entry = (await created.json()) as {
      id: string;
      draftRevision: number;
      publishedRevision: number | null;
      data: Record<string, unknown>;
    };
    assert.equal(entry.publishedRevision, null);
    assert.equal(
      (
        await call("entries/blogs/" + entry.id, "PUT", {
          data: entry.data,
          expectedRevision: 0,
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await call(
          `entries/blogs/${entry.id}/publish`,
          "POST",
          { expectedRevision: 1 },
          readonly.token,
          { "Idempotency-Key": "synthetic-first" },
        )
      ).status,
      403,
    );
    for (let attempt = 0; attempt < 2; attempt++)
      assert.equal(
        (
          await call(
            `entries/blogs/${entry.id}/publish`,
            "POST",
            { expectedRevision: 1 },
            full.token,
            { "Idempotency-Key": "synthetic-first" },
          )
        ).status,
        200,
      );
    assert.equal(
      (
        await call(`entries/blogs/${entry.id}/unpublish`, "POST", {
          expectedRevision: 1,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await call(`entries/blogs/${entry.id}/restore`, "POST", {
          expectedRevision: 1,
          revision: 1,
        })
      ).status,
      200,
    );
    assert.equal(
      (await call(`entries/blogs/${entry.id}/revisions`)).status,
      200,
    );
    assert.equal(
      (await call("entries/blogs/x/publish/ignored", "POST", {})).status,
      404,
    );
    const image = await sharp({
      create: { width: 18, height: 12, channels: 3, background: "#5678ab" },
    })
      .png()
      .toBuffer();
    const form = new FormData();
    form.set(
      "file",
      new Blob([new Uint8Array(image)], { type: "image/png" }),
      "synthetic.png",
    );
    form.set("alt", "Synthetic image");
    const uploaded = await call("media", "POST", form);
    assert.equal(uploaded.status, 201);
    const media = (await uploaded.json()) as { id: string; url: string };
    assert.equal((await call(`media/${media.id}/400.webp`)).status, 200);
    assert.equal(
      (
        await call(
          `media/${media.id}/400.webp`,
          "GET",
          undefined,
          readonly.token,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await mediaResponse(
          new Request("http://localhost:4321" + media.url),
          media.id,
          "400.webp",
        ).catch((error) => new Response(null, { status: error.status }))
      ).status,
      404,
    );
    const stored = await database()
      .collection(collection("apiKeys"))
      .doc(full.key.id)
      .get();
    assert.equal(stored.get("digest").length, 64);
    assert.ok(!JSON.stringify(stored.data()).includes(full.token));
    const metadata = await handleCmsApi(
      new Request("http://localhost:4321/api/cms/keys", {
        headers: { Authorization: "Bearer " + token("cms-owner") },
      }),
      "keys",
    );
    assert.equal(metadata.status, 200);
    const list = await metadata.text();
    assert.ok(!list.includes(full.token));
    assert.ok(!list.includes("digest"));
    const revoke = await handleCmsApi(
      new Request("http://localhost:4321/api/cms/keys/" + full.key.id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token("cms-owner") },
      }),
      "keys/" + full.key.id,
    );
    assert.equal(revoke.status, 200);
    assert.equal((await call("entries/blogs")).status, 401);
    await database()
      .collection(collection("apiKeys"))
      .doc(readonly.key.id)
      .update({ expiresAt: "2000-01-01T00:00:00.000Z" });
    assert.equal(
      (await call("entries/blogs", "GET", undefined, readonly.token)).status,
      401,
    );
    const audit = await database().collection(collection("outbox")).get();
    assert.ok(
      !JSON.stringify(audit.docs.map((row) => row.data())).includes(full.token),
    );
  },
);
integration(
  "catalog reconciliation exposes every core page and existing labels, preserving edits and remaining idempotent",
  async () => {
    const first = await reconcileWorkspace();
    assert.equal(first.counts.pages, 10);
    assert.ok(first.counts.tags! > 0);
    const second = await reconcileWorkspace();
    assert.deepEqual(second.added, { tags: 0, pages: 0 });
    assert.equal((await workspaceSummary()).counts.pages, 10);
    const page = await database()
      .collection(collection("entries"))
      .doc("pages--blogs")
      .get();
    const data = page.get("data") as Record<string, unknown>;
    await saveEntry(
      "pages",
      "blogs",
      { ...data, heading: "An owner-edited heading" },
      1,
    );
    await reconcileWorkspace();
    assert.equal(
      (
        await database()
          .collection(collection("entries"))
          .doc("pages--blogs")
          .get()
      ).get("data.heading"),
      "An owner-edited heading",
    );
  },
);

test("global search ranks titles, searches body text, paginates and excludes non-display metadata", async () => {
  const docs = Array.from({ length: 25 }, (_, i) =>
    searchDocument("blogs", `entry-${i}`, {
      title: i === 24 ? "Observability" : `Entry ${i}`,
      html: "<p>Observability &amp; learning</p>",
      notion: { content: "PRIVATE_SOURCE_METADATA" },
      sourceNotes: "PRIVATE_SOURCE_METADATA",
    }),
  );
  assert.equal(
    findSearchResults(docs, "observability", "", 0).results[0]!.title,
    "Observability",
  );
  assert.equal(findSearchResults(docs, "observability", "", 0).next, 20);
  assert.equal(
    findSearchResults(docs, "observability", "", 20).results.length,
    5,
  );
  assert.equal(
    findSearchResults(docs, "PRIVATE_SOURCE_METADATA", "", 0).total,
    0,
  );
  assert.equal(findSearchResults(docs, "observability", "books", 0).total, 0);
  for (const body of [
    "[]",
    "null",
    '{"query":"x"}',
    '{"query":"ok","section":"admin"}',
    JSON.stringify({ query: "x".repeat(2000) }),
  ]) {
    const response = await searchApi(
      new Request("http://localhost:4321/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }),
    );
    assert.ok([400, 413].includes(response.status));
  }
});

integration(
  "public core page loader reads the published rich revision, preserving legacy fallback and draft isolation",
  async () => {
    await reconcileWorkspace();
    const original = await getEntry("pages", "meet-vish");
    const legacyData: Record<string, unknown> = {
      ...original.data,
      paragraphs: ["Legacy words."],
    };
    delete legacyData.html;
    const legacy = await saveEntry(
      "pages",
      original.id,
      legacyData,
      original.draftRevision,
    );
    await publishEntry("pages", legacy.id, legacy.draftRevision, randomUUID());
    assert.equal((await getJournalPage("meet-vish")).html, undefined);
    assert.deepEqual((await getJournalPage("meet-vish")).paragraphs, [
      "Legacy words.",
    ]);
    const html =
      '<p><strong>A friendship.</strong> <a href="https://unsplash.com/@sayspoorthi">Spoorthi</a></p><blockquote><p>My words.</p></blockquote>';
    const rich = await saveEntry(
      "pages",
      legacy.id,
      { ...legacy.data, html },
      legacy.draftRevision,
    );
    assert.equal((await getJournalPage("meet-vish")).html, undefined);
    await publishEntry("pages", rich.id, rich.draftRevision, randomUUID());
    assert.equal(
      (await getPages()).find((page) => page.slug === "meet-vish")?.html,
      "",
    );
    assert.equal((await getJournalPage("meet-vish")).html, html);
  },
);

integration(
  "Home portrait publication stays independent of Meet Vish and the main hero",
  async () => {
    const home = await getEntry("pages", "home");
    const meet = await getJournalPage("meet-vish");
    const data = {
      ...home.data,
      portraitImage: "/images/vish-home-ink-wash.webp",
      portraitImageAlt: "An ink-and-wash portrait",
    };
    assert.throws(
      () =>
        validateData("pages", {
          ...data,
          portraitImage: "javascript:alert(1)",
        }),
      CmsError,
    );
    const saved = await saveEntry("pages", home.id, data, home.draftRevision);
    await publishEntry("pages", home.id, saved.draftRevision, randomUUID());
    const publishedHome = await getJournalPage("home");
    assert.equal(publishedHome.portraitImage, data.portraitImage);
    assert.equal(publishedHome.portraitImageAlt, data.portraitImageAlt);
    assert.equal(publishedHome.image, home.data.image);
    assert.equal((await getJournalPage("meet-vish")).image, meet.image);
  },
);
