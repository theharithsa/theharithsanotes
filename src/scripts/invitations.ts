import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { AuthRestoration } from "../lib/auth-restoration";
import { firebaseConfig } from "../lib/firebase-config";
const auth = getAuth(getApps()[0] ?? initializeApp(firebaseConfig));
const node = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const status = node("invite-status"),
  list = node("invite-list"),
  form = node<HTMLFormElement>("invite-form");
interface Invitation {
  id: string;
  email: string;
  expiresAt: string;
  revokedAt: string | null;
}
class InvitationError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const version = invitationSession.version;
  const uid = auth.currentUser?.uid;
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in as the workspace owner.");
  const result = await fetch("/api/cms/members" + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
    signal: AbortSignal.timeout(30000),
  });
  const value = (await result.json()) as T & { error?: { message?: string } };
  if (version !== invitationSession.version || uid !== auth.currentUser?.uid)
    throw new InvitationError("Your session changed", 401);
  if (!result.ok)
    throw new InvitationError(
      value.error?.message ?? "This invitation could not be updated.",
      result.status,
    );
  return value as T;
}
async function refresh() {
  const { members } = await api<{ members: Invitation[] }>("");
  renderMembers(members);
}
function renderMembers(members: Invitation[]) {
  list.replaceChildren();
  for (const member of members) {
    const row = document.createElement("div");
    row.className = "cms-invitation-row";
    const copy = document.createElement("p");
    copy.textContent = `${member.email} · ${member.revokedAt ? "Revoked" : Date.parse(member.expiresAt) <= Date.now() ? "Expired" : "Until " + new Date(member.expiresAt).toLocaleDateString()}`;
    row.append(copy);
    if (!member.revokedAt) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "cms-quiet-button";
      button.textContent = "Revoke access";
      button.addEventListener("click", async () => {
        button.disabled = true;
        try {
          await api("/" + member.id, "DELETE");
          await refresh();
          status.textContent =
            "Access revoked. Existing sessions no longer grant access.";
        } catch (error) {
          status.textContent =
            error instanceof Error ? error.message : "Try again.";
          button.disabled = false;
        }
      });
      row.append(button);
    }
    list.append(row);
  }
  if (!members.length)
    list.textContent =
      "No invitations yet. Only you can enter the reading room.";
}
node("invite-signin").addEventListener("click", async () => {
  try {
    const before = invitationSession.version;
    await signInWithPopup(auth, new GoogleAuthProvider());
    if (before === invitationSession.version) void invitationSession.restore();
  } catch {
    status.textContent = "Sign-in did not finish. Try again.";
  }
});
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!;
  button.disabled = true;
  try {
    const data = new FormData(form);
    await api("", "POST", {
      email: data.get("email"),
      expiresInDays: Number(data.get("days")),
    });
    form.reset();
    await refresh();
    status.textContent =
      "Invitation added. Share the reading-room link with your reader.";
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Try again.";
  } finally {
    button.disabled = false;
  }
});
const invitationSession = new AuthRestoration({
  ready: () => auth.authStateReady(),
  user: () => auth.currentUser,
  verify: () => api<{ members: Invitation[] }>(""),
  clear: () => {
    list.replaceChildren();
    form.reset();
    node("invite-workspace").hidden = true;
  },
  show: (phase, detail) => {
    node("invitations-room").dataset.authState = phase;
    node("invite-signin").hidden = phase !== "signed-out" && phase !== "denied";
    node("invite-retry").hidden = phase !== "error";
    node("invite-workspace").hidden = phase !== "ready";
    status.textContent =
      detail ??
      (phase === "loading"
        ? "Opening your invitations…"
        : phase === "ready"
          ? ""
          : "Sign in as the workspace owner.");
  },
  enter: ({ members }) => renderMembers(members),
  denied: (error) =>
    error instanceof InvitationError && [401, 403].includes(error.status),
  message: (error) =>
    error instanceof InvitationError
      ? error.message
      : "Invitations could not load. Try again.",
});
node("invite-retry").addEventListener(
  "click",
  () => void invitationSession.restore(),
);
onAuthStateChanged(auth, () => void invitationSession.restore());
window.addEventListener("pagehide", () => invitationSession.suspend());
window.addEventListener("pageshow", (event) => {
  if (event.persisted) void invitationSession.restore();
});
