import { OAuth2Client } from "google-auth-library";
import { CmsError } from "./models.ts";
import { namespace, projectId } from "./config.ts";
import { observe } from "./telemetry.ts";
const verifier = new OAuth2Client();
export const auditAudience = () =>
  namespace === "live"
    ? "https://theharithsa.com/api/cms/delivery"
    : "https://the-harithsa-notes-94--review-tzxuxkbf.web.app/api/cms/delivery";
export async function authorizeScheduler(request: Request): Promise<void> {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer ([^\s]{20,8192})$/)?.[1];
  if (!token)
    throw new CmsError("UNAUTHENTICATED", 401, "Scheduler identity required");
  await observe(
    "audit.authorize",
    { "auth.provider": "google-workload" },
    async () => {
      try {
        const ticket = await verifier.verifyIdToken({
          idToken: token,
          audience: auditAudience(),
        });
        const claims = ticket.getPayload();
        if (
          !claims ||
          !["https://accounts.google.com", "accounts.google.com"].includes(
            claims.iss,
          ) ||
          claims.email_verified !== true ||
          claims.email !==
            `harithsa-scheduler@${projectId}.iam.gserviceaccount.com`
        )
          throw Error();
      } catch {
        throw new CmsError("FORBIDDEN", 403, "Invalid scheduler identity");
      }
    },
  );
}
