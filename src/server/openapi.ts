import { contentSchema, sections } from "./models.ts";
import { serviceVersion } from "./config.ts";
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: unknown) => ({ "application/json": { schema } });
const response = (schema: unknown, description = "Success") => ({
  description,
  content: json(schema),
});
const errors = Object.fromEntries(
  [400, 401, 403, 404, 405, 409, 413, 415, 429, 500, 503].map((status) => [
    status,
    response(
      ref("Error"),
      "Rejected request; see error.code. Conflicts require reloading the current draft; retry 429 after 60 seconds.",
    ),
  ]),
);
const entry = {
  type: "object",
  required: ["id", "section", "data", "draftRevision", "publishedRevision"],
  properties: {
    id: { type: "string" },
    section: { type: "string", enum: sections },
    data: { type: "object" },
    draftRevision: { type: "integer" },
    publishedRevision: { type: ["integer", "null"] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    publishedAt: { type: ["string", "null"] },
  },
};
const revision = {
  type: "integer",
  minimum: 0,
  description:
    "The draftRevision returned by GET/create/update. Stale writes return 409.",
};
const input = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
) => ({
  required: true,
  content: json({ type: "object", required, properties }),
});
export function openApiDocument() {
  const paths: Record<string, unknown> = {};
  for (const section of sections) {
    const tag =
      section === "blogs"
        ? "Blog"
        : section[0]!.toUpperCase() + section.slice(1);
    const base = `/entries/${section}`;
    const item = base + "/{id}";
    const params = [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", pattern: "^[a-zA-Z0-9_-]{1,100}$" },
      },
    ];
    const operation = (
      summary: string,
      scope: string,
      extra: Record<string, unknown> = {},
    ) => ({
      tags: [tag],
      summary,
      description: `Required permission: ${scope}. Key must allow the ${section} collection.`,
      responses: { 200: response(ref("Entry")), ...errors },
      ...extra,
    });
    paths[base] = {
      get: operation("List drafts and publication state", "content:read", {
        parameters: [
          {
            name: "cursor",
            in: "query",
            schema: { type: "string" },
            description:
              "Opaque continuation entry ID from next; up to 100 entries per page.",
          },
        ],
        responses: {
          200: response({
            type: "object",
            properties: {
              entries: { type: "array", items: ref("Entry") },
              next: { type: ["string", "null"] },
            },
          }),
          ...errors,
        },
      }),
      post: operation("Create a private draft", "content:write", {
        requestBody: input({ data: ref(section) }),
        responses: {
          201: response(
            ref("Entry"),
            "Private draft created; nothing is published",
          ),
          ...errors,
        },
      }),
    };
    paths[item] = {
      parameters: params,
      get: operation("Get the current private draft", "content:read"),
      put: operation(
        "Replace draft data with revision protection",
        "content:write",
        {
          description: `Required permission: content:write in ${section}. Send the complete data object; omitted optional fields are removed. Fetch before updating to preserve imported fields.`,
          requestBody: input({
            data: ref(section),
            expectedRevision: revision,
          }),
        },
      ),
    };
    paths[item + "/revisions"] = {
      parameters: params,
      get: operation("List the 50 newest immutable revisions", "content:read", {
        responses: {
          200: response({
            type: "object",
            properties: {
              revisions: { type: "array", items: { type: "object" } },
            },
          }),
          ...errors,
        },
      }),
    };
    for (const action of ["publish", "unpublish", "restore"])
      paths[item + "/" + action] = {
        parameters: params,
        post: operation(
          action === "publish"
            ? "Publish the saved draft"
            : action === "unpublish"
              ? "Remove the public version; retain drafts/history"
              : "Restore an immutable revision into a new private draft",
          action === "restore" ? "content:write" : "content:publish",
          {
            ...(action === "publish"
              ? {
                  parameters: [
                    {
                      name: "Idempotency-Key",
                      in: "header",
                      required: true,
                      schema: {
                        type: "string",
                        pattern: "^[a-zA-Z0-9_-]{1,100}$",
                      },
                      description:
                        "Unique operation ID. Reuse only when retrying this exact publication.",
                    },
                  ],
                }
              : {}),
            requestBody: input({
              expectedRevision: revision,
              ...(action === "restore"
                ? { revision: { type: "integer", minimum: 1 } }
                : {}),
            }),
          },
        ),
      };
  }
  const media = {
    type: "object",
    properties: {
      id: { type: "string" },
      url: {
        type: "string",
        description:
          "Use this path in entry image/src/poster fields. Private until published.",
      },
      apiUrl: {
        type: "string",
        description: "Authenticated download path, with media:read permission.",
      },
      width: { type: "integer" },
      height: { type: "integer" },
      alt: { type: "string" },
    },
  };
  paths["/media"] = {
    get: {
      tags: ["Media"],
      summary: "List the 80 most recent uploads",
      description: "Requires media:read.",
      responses: {
        200: response({
          type: "object",
          properties: { media: { type: "array", items: media } },
        }),
        ...errors,
      },
    },
    post: {
      tags: ["Media"],
      summary: "Upload an image",
      description:
        "Requires media:write. JPEG, PNG or WebP, at most 8 MiB / 40 megapixels. Metadata is stripped and responsive WebP variants generated. New images are private until referenced by a publication.",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["file", "alt"],
              properties: {
                file: { type: "string", format: "binary" },
                title: { type: "string", maxLength: 240 },
                alt: { type: "string", maxLength: 2000 },
              },
            },
          },
        },
      },
      responses: { 201: response(media), ...errors },
    },
  };
  paths["/media/{id}/{variant}"] = {
    get: {
      tags: ["Media"],
      summary: "Download an uploaded image, including private drafts",
      description: "Requires media:read. Response is private/no-store.",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", pattern: "^[a-f0-9]{64}$" },
        },
        {
          name: "variant",
          in: "path",
          required: true,
          schema: {
            type: "string",
            enum: ["master.webp", "400.webp", "800.webp", "1600.webp"],
          },
        },
      ],
      responses: {
        200: {
          description: "WebP image",
          content: {
            "image/webp": { schema: { type: "string", format: "binary" } },
          },
        },
        ...errors,
      },
    },
  };
  for (const [path, value] of Object.entries(paths))
    for (const [method, operation] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (
        ["get", "post", "put", "delete"].includes(method) &&
        operation &&
        typeof operation === "object"
      )
        (operation as Record<string, unknown>).operationId =
          method +
          "_" +
          path.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
    }
  return {
    openapi: "3.1.0",
    info: {
      title: "The Harithsa Notes — Content API",
      version: serviceVersion,
      description:
        "Create a scoped key in Workspace → Developer Settings. All writes start as private drafts; Publish is separate. Production and review keys are isolated. Use Authorization: Bearer YOUR_API_KEY. Keys never belong in browser apps or public repositories. Requests are limited to 120/minute per key per runtime instance (not a global quota). JSON requests ≤640 KiB, entry content ≤600 KiB. Public changes can take up to 30 seconds to appear. No cross-origin browser API access is enabled; use trusted server integrations. Owner key management is intentionally excluded from API-key permissions.",
    },
    servers: [{ url: "/api/v1", description: "This environment only" }],
    security: [{ ApiKey: [] }],
    tags: [
      ...sections.map((section) => ({
        name:
          section === "blogs"
            ? "Blog"
            : section[0]!.toUpperCase() + section.slice(1),
      })),
      { name: "Media" },
    ],
    paths,
    components: {
      securitySchemes: {
        ApiKey: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "Scoped API key",
        },
      },
      schemas: {
        Entry: entry,
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
              },
            },
            requestId: { type: "string" },
          },
        },
        ...Object.fromEntries(
          sections.map((section) => {
            const schema = contentSchema(section);
            const { $schema: _schema, ...value } = schema;
            return [section, value];
          }),
        ),
      },
    },
  };
}
