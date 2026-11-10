import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
// Independent minimal protobuf wire decoder: no exporter implementation is reused here.
function fields(buffer) {
  let position = 0;
  const result = new Map();
  const integer = () => {
    let value = 0n,
      shift = 0n;
    while (position < buffer.length) {
      const byte = buffer[position++];
      value |= BigInt(byte & 127) << shift;
      if (!(byte & 128)) return value;
      shift += 7n;
      if (shift > 70n) throw Error("Invalid varint");
    }
    throw Error("Truncated varint");
  };
  while (position < buffer.length) {
    const tag = Number(integer());
    const field = tag >>> 3,
      wire = tag & 7;
    let value;
    if (wire === 0) value = integer();
    else if (wire === 1) {
      value = buffer.subarray(position, position + 8);
      position += 8;
    } else if (wire === 2) {
      const length = Number(integer());
      value = buffer.subarray(position, position + length);
      position += length;
    } else if (wire === 5) {
      value = buffer.subarray(position, position + 4);
      position += 4;
    } else throw Error("Unsupported wire type");
    if (position > buffer.length) throw Error("Truncated message");
    result.set(field, [...(result.get(field) ?? []), value]);
  }
  return result;
}
const messages = (parent, key) =>
  (parent.get(key) ?? []).map((value) => fields(value));
const string = (parent, key) => parent.get(key)?.[0]?.toString("utf8");
function attributes(parent, key) {
  return Object.fromEntries(
    messages(parent, key).map((pair) => [
      string(pair, 1),
      string(messages(pair, 2)[0], 1),
    ]),
  );
}
test("binary OTLP preserves concurrent parentage, correlated logs, delta metrics and private payload exclusion", async () => {
  const captures = [];
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    captures.push({
      path: req.url,
      type: req.headers["content-type"],
      bytes: Buffer.concat(chunks),
    });
    res.writeHead(200, { "Content-Type": "application/x-protobuf" });
    res.end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  try {
    await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [
          "--import",
          "./runtime/instrumentation.mts",
          "tests/fixtures/telemetry-probe.mts",
        ],
        {
          env: {
            ...process.env,
            OTEL_EXPORTER_OTLP_ENDPOINT: `http://127.0.0.1:${port}/otlp`,
            OTEL_LOCAL_TEST: "true",
            OTEL_SERVICE_NAME: "harithsa-notes-telemetry-test",
            CMS_NAMESPACE: "test",
            CMS_DATA_SOURCE: "snapshot",
            DYNATRACE_INGEST_TOKEN: "",
            FIRESTORE_EMULATOR_HOST: "",
          },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      let error = "";
      child.stderr.on("data", (data) => (error += data.toString()));
      const timeout = setTimeout(() => {
        child.kill();
        reject(Error("Telemetry probe timed out"));
      }, 20000);
      child.on("exit", (code) => {
        clearTimeout(timeout);
        code === 0
          ? resolve()
          : reject(Error(`Probe failed ${code}: ${error}`));
      });
    });
    const spans = [],
      logs = [],
      metrics = [];
    for (const capture of captures) {
      assert.match(capture.type, /application\/x-protobuf/);
      assert.ok(!capture.bytes.includes(Buffer.from("PRIVATE_PROBE_TEXT")));
      const root = fields(capture.bytes);
      for (const resource of messages(root, 1)) {
        assert.equal(
          attributes(messages(resource, 1)[0], 1)["service.name"],
          "harithsa-notes-telemetry-test",
        );
        for (const scope of messages(resource, 2))
          for (const record of messages(scope, 2)) {
            if (capture.path.endsWith("/traces")) spans.push(record);
            if (capture.path.endsWith("/logs")) logs.push(record);
            if (capture.path.endsWith("/metrics")) metrics.push(record);
          }
      }
    }
    const roots = ["alpha", "beta"].map((label) =>
      spans.find((span) => string(span, 5) === `probe.${label}`),
    );
    assert.ok(roots.every(Boolean));
    const serverSpan = spans.find((span) => string(span, 5) === "probe.server");
    assert.equal(Number(serverSpan.get(6)[0]), 2);
    assert.equal(attributes(serverSpan, 9)["http.route"], "/probe/:entry");
    assert.equal(attributes(serverSpan, 9)["error.type"], "FORBIDDEN");
    assert.equal(
      attributes(serverSpan, 9)["error.message"],
      "Operation failed (FORBIDDEN)",
    );
    for (const name of ["HTTP GET /_unmatched", "HTTP HEAD /_unmatched"]) {
      const span = spans.find((row) => string(row, 5) === name);
      assert.ok(span, name);
      const status = messages(span, 9).find(
        (pair) => string(pair, 1) === "http.response.status_code",
      );
      assert.ok(status);
      assert.equal(Number(messages(status, 2)[0].get(3)[0]), 404);
      assert.equal(attributes(span, 9)["error.type"], undefined);
      assert.notEqual(Number(messages(span, 15)[0]?.get(3)?.[0]), 2);
    }
    for (const name of [
      "HTTP GET /_image",
      "HTTP GET /api/v1/unknown",
      "HTTP GET /:article",
    ]) {
      const span = spans.find((row) => string(row, 5) === name);
      assert.ok(span, name);
      assert.equal(attributes(span, 9)["error.type"], "http_error");
      assert.equal(Number(messages(span, 15)[0].get(3)[0]), 2);
    }
    const delivered = spans.find(
      (span) => string(span, 5) === "probe.delivery",
    );
    assert.equal(Number(delivered.get(6)[0]), 3);
    const linked = messages(delivered, 13)[0];
    const producer = spans.find(
      (span) => string(span, 5) === "probe.alpha.child",
    );
    assert.deepEqual(linked.get(1)[0], producer.get(1)[0]);
    assert.deepEqual(linked.get(2)[0], producer.get(2)[0]);
    assert.notEqual(
      roots[0].get(1)[0].toString("hex"),
      roots[1].get(1)[0].toString("hex"),
    );
    for (const [index, label] of ["alpha", "beta"].entries()) {
      const parent = roots[index];
      const child = spans.find(
        (span) => string(span, 5) === `probe.${label}.child`,
      );
      assert.ok(child);
      assert.deepEqual(child.get(1)[0], parent.get(1)[0]);
      assert.deepEqual(child.get(4)[0], parent.get(2)[0]);
      const log = logs.find(
        (row) => attributes(row, 6)["probe.label"] === label,
      );
      assert.ok(log);
      assert.deepEqual(log.get(9)[0], child.get(1)[0]);
      assert.deepEqual(log.get(10)[0], child.get(2)[0]);
    }
    const counter = metrics.find(
      (row) => string(row, 1) === "journal.http.requests",
    );
    assert.ok(counter);
    assert.equal(Number(messages(counter, 7)[0].get(2)[0]), 1);
    const requestOutcomes = metrics
      .filter((row) => string(row, 1) === "journal.http.requests")
      .flatMap((row) => messages(messages(row, 7)[0], 1))
      .map((point) => attributes(point, 7));
    for (const method of ["GET", "HEAD"]) {
      const misses = requestOutcomes.filter(
        (point) => point.route === "/_unmatched" && point.method === method,
      );
      assert.ok(misses.length > 0);
      assert.ok(misses.every((point) => point.outcome === "not_found"));
    }
    const histogram = metrics.find(
      (row) => string(row, 1) === "journal.http.duration",
    );
    assert.ok(histogram);
    assert.equal(string(histogram, 3), "s");
    assert.equal(Number(messages(histogram, 9)[0].get(2)[0]), 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
