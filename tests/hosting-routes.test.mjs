import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  hostingRedirects,
  hostingRewritePattern,
} from "../scripts/hosting-routes.mjs";
import paths from "../src/data/hosting-paths.json" with { type: "json" };

test("Firebase Hosting redirects public aliases and leaves reserved probes at the edge", () => {
  for (const name of ["firebase.json", "firebase.preview.json"]) {
    const config = JSON.parse(
      readFileSync(new URL(`../${name}`, import.meta.url), "utf8"),
    );
    assert.deepEqual(config.hosting.redirects, hostingRedirects, name);
    assert.equal(config.hosting.rewrites[0].regex, hostingRewritePattern, name);
    const routes = new RegExp(config.hosting.rewrites[0].regex);
    for (const path of [
      "/",
      "/from-five-readers-to-twenty-five",
      "/books/example",
      "/podcasts/listening/example",
      "/people-and-journal/people/example",
      "/admin/invitations",
      "/api/openapi.json",
      "/api/reading/journal/example",
      "/api/v1/entries/blogs/example_123/publish",
      `/api/v1/media/${"a".repeat(64)}/source.mp4`,
      `/media/${"a".repeat(64)}/1600.webp`,
      "/_image",
      "/members",
      "/recommendations",
      ...paths.probeSlugs.flatMap((slug) => [`/${slug}2`, `/${slug}-guide`]),
    ]) {
      assert.match(path, routes, name);
    }
    for (const path of [
      "/wp-admin",
      "/wp-admin/install.php",
      "/wp-login.php",
      "/wp-json/wp/v2/users",
      "/wordpress/wp-includes/version.php",
      "/nested/test.PHP",
      "/api/wp-login.php",
      "/xmlrpc.php",
      ...paths.probeSlugs.flatMap((slug) => [`/${slug}`, `/${slug}/`]),
    ]) {
      assert.doesNotMatch(path, routes, name);
    }
  }
});
