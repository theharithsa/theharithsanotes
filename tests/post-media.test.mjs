import test from "node:test";
import assert from "node:assert/strict";
import { postMedia, mediaHtml } from "../src/lib/post-media.ts";
import { sanitizePostHtml } from "../src/lib/post-html.ts";
import { playableFormat, mediaRange } from "../src/server/media-format.ts";

test("provider links normalize without carrying arbitrary parameters or executable attributes", () => {
  for (const url of [
    "https://youtu.be/dQw4w9WgXcQ?t=42",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ?autoplay=1",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  ]) {
    const media = postMedia(url);
    assert.equal(media.provider, "YouTube");
    assert.match(
      media.src,
      /^https:\/\/www.youtube-nocookie.com\/embed\/dQw4w9WgXcQ/,
    );
    assert.doesNotMatch(media.src, /autoplay/);
  }
  assert.match(
    postMedia("https://vimeo.com/123456789/abcdef1234").src,
    /h=abcdef1234/,
  );
  assert.equal(
    postMedia("https://open.spotify.com/episode/0TFCthQHSsDut7LSMPGpJo")
      .provider,
    "Spotify",
  );
  for (const url of [
    "javascript:alert(1)",
    "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
    "https://evil.test@youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com:1234/watch?v=dQw4w9WgXcQ",
    "https://example.com",
    "//youtube.com/embed/dQw4w9WgXcQ",
  ])
    assert.equal(postMedia(url), null, url);
});

test("standalone links become stable embeds while inline links and unsupported links stay prose", () => {
  const html = sanitizePostHtml(
    '<p>https://youtu.be/dQw4w9WgXcQ</p><p>Read <a href="https://youtu.be/dQw4w9WgXcQ">this video</a> later.</p><p>https://example.com</p>',
  );
  assert.match(html, /<figure class="post-media"/);
  assert.match(html, /Read <a href=/);
  assert.match(html, /<p>https:\/\/example.com<\/p>/);
  assert.equal(sanitizePostHtml(html), html);
  const attack = sanitizePostHtml(
    '<iframe src="https://evil.test" srcdoc="<script>bad()</script>" onload="bad()"></iframe><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" onload="bad()"></iframe><video src="javascript:bad()" autoplay></video>',
  );
  assert.match(attack, /youtube-nocookie.com/);
  assert.doesNotMatch(attack, /evil|srcdoc|onload|bad\(|autoplay|<video/);
});

test("native and uploaded media preserve controls and strip autoplay and unknown sources", () => {
  const path = `/media/${"a".repeat(64)}/source.mp4`;
  for (const url of [
    path,
    "https://example.com/movie.webm",
    "https://example.com/audio.mp3?token=abc",
  ]) {
    const html = mediaHtml(url);
    assert.match(html, /controls(?: |>|=)/);
    assert.equal(sanitizePostHtml(html), html);
  }
  assert.equal(postMedia("/media/wrong/source.mp4"), null);
  assert.doesNotMatch(
    sanitizePostHtml(
      '<audio src="https://example.com/a.mp3" autoplay loop onplay="bad()"></audio>',
    ),
    /autoplay|loop|onplay/,
  );
});

test("playable byte detection and range boundaries reject invalid files and ranges", () => {
  const mp4 = Buffer.alloc(32);
  mp4.writeUInt32BE(24);
  mp4.write("ftypisom", 4);
  assert.equal(playableFormat(mp4).contentType, "video/mp4");
  assert.equal(playableFormat(Buffer.from("<html>not a video</html>")), null);
  assert.deepEqual(mediaRange("bytes=5-9", 20), { start: 5, end: 9 });
  assert.deepEqual(mediaRange("bytes=-5", 20), { start: 15, end: 19 });
  assert.deepEqual(mediaRange("bytes=5-", 20), { start: 5, end: 19 });
  for (const header of ["bytes=20-", "bytes=9-2", "bytes=0-2,5-9", "bytes=-0"])
    assert.throws(() => mediaRange(header, 20), RangeError);
});
