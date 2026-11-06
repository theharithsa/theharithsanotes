export function isPublicDestination(url: URL): boolean {
  return (
    !/^\/(?:admin|people-and-journal|account|api|__|search)(?:\/|$)/.test(
      url.pathname,
    ) && !url.searchParams.has("preview")
  );
}
const reveals = new WeakMap<HTMLElement, Animation>();
/** Cancel an older reveal so rapid filtering always animates the current result. */
export function revealElement(
  element: HTMLElement,
  reducedMotion: boolean,
): void {
  reveals.get(element)?.cancel();
  reveals.delete(element);
  if (reducedMotion || typeof element.animate !== "function") return;
  reveals.set(
    element,
    element.animate(
      [
        { opacity: 0.35, transform: "translateY(6px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 240, easing: "cubic-bezier(.2,.6,.2,1)" },
    ),
  );
}
