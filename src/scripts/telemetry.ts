type Consent = "granted" | "denied";
interface RumAgent {
  reportCustomError?: (key: string, message: string) => void;
  disableSessionReplay?: () => void;
  disable?: () => void;
}
declare global {
  interface Window {
    dtrum?: RumAgent;
  }
}
const consentKey = "harithsa.analytics.v1";
const local = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
const enabled =
  (!local || import.meta.env.PUBLIC_ENABLE_LOCAL_TELEMETRY === "true") &&
  !location.pathname.startsWith("/admin") &&
  !location.pathname.startsWith("/people-and-journal") &&
  !location.pathname.startsWith("/account") &&
  location.pathname !== "/search" &&
  !new URLSearchParams(location.search).has("preview");
let current: Consent | undefined;
let started = false;

function safeFailure(
  code: "ANALYTICS_INIT_FAILED" | "CLIENT_RUNTIME_ERROR",
): void {
  try {
    window.dtrum?.reportCustomError?.(code, code);
  } catch {
    /* Monitoring must never interrupt reading. */
  }
}

async function start(): Promise<void> {
  if (!enabled || started) return;
  started = true;
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src =
    "https://js-cdn.dynatrace.com/jstag/18b1df4492a/bf12470wrz/95689bd753f916a6_complete.js";
  script.crossOrigin = "anonymous";
  script.id = "dynatrace-rum";
  script.addEventListener("load", () => window.dtrum?.disableSessionReplay?.());
  document.head.append(script);
  try {
    const [
      { initializeApp, getApps },
      { getAnalytics, isSupported, setConsent, initializeAnalytics },
    ] = await Promise.all([
      import("firebase/app"),
      import("firebase/analytics"),
    ]);
    if (current !== "granted" || !(await isSupported())) return;
    setConsent({
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    const config = {
      apiKey: "AIzaSyANePsKrQFwGy8I39WN15aQKQMyY32JdFM",
      authDomain: "the-harithsa-notes-94.firebaseapp.com",
      projectId: "the-harithsa-notes-94",
      storageBucket: "the-harithsa-notes-94.firebasestorage.app",
      messagingSenderId: "200386746528",
      appId: "1:200386746528:web:08c4e06e0314c69a2f51c5",
      measurementId: "G-VZF9P08XB9",
    };
    const app = getApps()[0] ?? initializeApp(config);
    initializeAnalytics(app, {
      config: {
        send_page_view: false,
        page_location: `${location.origin}${location.pathname}`,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      },
    });
    const { logEvent } = await import("firebase/analytics");
    const analytics = getAnalytics(app);
    if (current !== "granted") return;
    logEvent(analytics, "page_view", {
      page_location: `${location.origin}${location.pathname}`,
      page_title: document.title,
    });
  } catch {
    safeFailure("ANALYTICS_INIT_FAILED");
  }
}

function readConsent(): Consent | undefined {
  try {
    const value = localStorage.getItem(consentKey);
    return value === "granted" || value === "denied" ? value : undefined;
  } catch {
    return undefined;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const banner = document.querySelector<HTMLElement>(".consent-banner");
  current = readConsent();
  if (banner)
    banner.hidden =
      current !== undefined ||
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/people-and-journal") ||
      location.pathname.startsWith("/account") ||
      new URLSearchParams(location.search).has("preview");
  if (current === "granted") void start();
  document
    .querySelectorAll<HTMLButtonElement>("[data-consent]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const previous = current;
        current = button.dataset.consent === "granted" ? "granted" : "denied";
        try {
          localStorage.setItem(consentKey, current);
        } catch {
          /* Respect the choice for this page when storage is blocked. */
        }
        if (banner) banner.hidden = true;
        if (current === "granted") void start();
        else if (previous === "granted" && enabled) {
          window.dtrum?.disable?.();
          void import("firebase/analytics")
            .then(({ setConsent }) => {
              setConsent({
                analytics_storage: "denied",
                ad_storage: "denied",
                ad_user_data: "denied",
                ad_personalization: "denied",
              });
              location.reload();
            })
            .catch(() => location.reload());
        }
      });
    });
  document.querySelectorAll("[data-privacy-settings]").forEach((button) =>
    button.addEventListener("click", () => {
      if (banner) {
        banner.hidden = false;
        banner.querySelector<HTMLButtonElement>("button")?.focus();
      }
    }),
  );
});
window.addEventListener("error", () => safeFailure("CLIENT_RUNTIME_ERROR"));
window.addEventListener("unhandledrejection", () =>
  safeFailure("CLIENT_RUNTIME_ERROR"),
);
