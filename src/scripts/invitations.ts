import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
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
async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
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
  });
  const value = await result.json();
  if (!result.ok)
    throw new Error(
      value.error?.message ?? "This invitation could not be updated.",
    );
  return value as T;
}
async function refresh() {
  const { members } = await api<{ members: Invitation[] }>("");
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
    await signInWithPopup(auth, new GoogleAuthProvider());
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
onAuthStateChanged(auth, async (user) => {
  list.replaceChildren();
  node("invite-workspace").hidden = true;
  if (!user) {
    status.textContent = "Sign in as the workspace owner.";
    return;
  }
  try {
    await refresh();
    node("invite-workspace").hidden = false;
    node("invite-signin").hidden = true;
    status.textContent = "You control who can read this part of the notebook.";
  } catch (error) {
    status.textContent =
      error instanceof Error ? error.message : "Please try again.";
  }
});
