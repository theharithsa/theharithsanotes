export const projectId =
  process.env.GOOGLE_CLOUD_PROJECT ?? "the-harithsa-notes-94";
export const bucketName = "the-harithsa-notes-94.firebasestorage.app";
export const adminEmail = "theharithsa@gmail.com";
export const namespace = process.env.CMS_NAMESPACE ?? "preview";
if (!["live", "preview", "test"].includes(namespace))
  throw new Error("Invalid CMS namespace");
export const collection = (
  name:
    | "entries"
    | "published"
    | "revisions"
    | "slugs"
    | "media"
    | "outbox"
    | "settings"
    | "operations"
    | "apiKeys",
) => `cms_${namespace}_${name}`;
export const firestoreEnabled = () =>
  process.env.CMS_DATA_SOURCE === "firestore" ||
  Boolean(process.env.FIRESTORE_EMULATOR_HOST);
export const origin = "https://theharithsa.com";
export const isEmulator = () => Boolean(process.env.FIRESTORE_EMULATOR_HOST);
export const serviceVersion = process.env.SERVICE_VERSION ?? "development";
