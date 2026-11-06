import type { ApiKeyInfo, ApiScope } from "../server/api-keys";
import type { Section } from "../server/models";
type Api = <T>(path: string, options?: RequestInit) => Promise<T>;
const el = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
export function developerSettings(api: Api) {
  let generation = 0;
  let visible = false;
  let token: string | null = null;
  const message = (text: string) => {
    el("cms-key-message").textContent = text;
  };
  function clear() {
    generation++;
    visible = false;
    token = null;
    el("cms-key-value").textContent = "";
    el("cms-key-secret").hidden = true;
    el("cms-key-list").replaceChildren();
  }
  async function refresh() {
    const version = ++generation;
    el("cms-key-list").textContent = "Loading connections…";
    try {
      const result = await api<{ keys: ApiKeyInfo[] }>("keys");
      if (version !== generation || !visible) return;
      const list = el("cms-key-list");
      list.replaceChildren();
      if (!result.keys.length)
        list.textContent =
          "No keys yet. Start with a name and choose the permissions your tool needs.";
      for (const key of result.keys) {
        const card = document.createElement("article");
        card.className = "cms-connection-card";
        const heading = document.createElement("h3");
        heading.textContent = key.name;
        const status = document.createElement("span");
        const active = !key.revokedAt && Date.parse(key.expiresAt) > Date.now();
        status.className = "cms-connection-state";
        status.textContent = key.revokedAt
          ? "Revoked"
          : active
            ? "Active"
            : "Expired";
        const prefix = document.createElement("code");
        prefix.textContent = key.prefix + "…";
        const permissions = document.createElement("p");
        permissions.textContent = key.scopes.join(" · ");
        const collections = document.createElement("small");
        collections.textContent = key.sections.join(", ");
        const dates = document.createElement("p");
        dates.className = "cms-key-help";
        dates.textContent = `Expires ${new Date(key.expiresAt).toLocaleDateString("en-IN")} · ${key.lastUsedAt ? "Last used " + new Date(key.lastUsedAt).toLocaleDateString("en-IN") : "Not used yet"}`;
        card.append(status, heading, prefix, permissions, collections, dates);
        if (active) {
          const revoke = document.createElement("button");
          revoke.type = "button";
          revoke.className = "cms-danger-button";
          revoke.textContent = "Revoke key";
          revoke.addEventListener("click", async () => {
            if (
              !confirm(
                `Revoke “${key.name}”? Integrations using this key will stop working.`,
              )
            )
              return;
            revoke.disabled = true;
            try {
              await api(`keys/${key.id}`, { method: "DELETE" });
              message("Key revoked. It can no longer access the API.");
              await refresh();
            } catch (error) {
              message(
                error instanceof Error
                  ? error.message
                  : "Revocation failed. Try again.",
              );
              revoke.disabled = false;
            }
          });
          card.append(revoke);
        }
        list.append(card);
      }
    } catch (error) {
      if (version === generation)
        el("cms-key-list").textContent =
          error instanceof Error
            ? error.message
            : "Connections could not load. Try Refresh.";
    }
  }
  el<HTMLFormElement>("cms-key-form").addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();
      if (
        token &&
        !confirm(
          "Have you saved the previous key? Its full value cannot be shown again.",
        )
      )
        return;
      const button = el<HTMLButtonElement>("cms-key-create");
      button.disabled = true;
      const data = new FormData(event.currentTarget as HTMLFormElement);
      message("Creating your key…");
      const version = generation;
      try {
        const result = await api<{ token: string }>("keys", {
          method: "POST",
          body: JSON.stringify({
            name: data.get("name"),
            expiresInDays: Number(data.get("expiresInDays")),
            scopes: data.getAll("scope") as ApiScope[],
            sections: data.getAll("section") as Section[],
          }),
        });
        if (!visible || version !== generation) {
          message(
            "Key created. Its value was hidden because you left this view. Revoke it and create another if needed.",
          );
          return;
        }
        token = result.token;
        el("cms-key-value").textContent = token;
        el("cms-key-secret").hidden = false;
        el("cms-key-secret").scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
        message("Key created. Copy it now; only its hash is stored.");
        await refresh();
      } catch (error) {
        message(
          error instanceof Error ? error.message : "Key creation failed.",
        );
      } finally {
        button.disabled = false;
      }
    },
  );
  el("cms-key-copy").addEventListener("click", async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      message("Copied. Save the key in your integration’s secret store.");
    } catch {
      message(
        "Clipboard unavailable. Select and copy the displayed key manually.",
      );
    }
  });
  el("cms-key-dismiss").addEventListener("click", () => {
    token = null;
    el("cms-key-value").textContent = "";
    el("cms-key-secret").hidden = true;
    message("Full key cleared from this view.");
  });
  el("cms-keys-refresh").addEventListener("click", () => void refresh());
  return {
    open: async () => {
      visible = true;
      await refresh();
    },
    clear,
  };
}
