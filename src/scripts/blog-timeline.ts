const groups = [...document.querySelectorAll<HTMLElement>("[data-date-group]")];
const yearGroups = [
  ...document.querySelectorAll<HTMLElement>(".timeline-year"),
];
const picker = document.querySelector<HTMLSelectElement>(
  "[data-blog-date-picker]",
);
const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function jump(key: string): void {
  const group = groups.find(
    (item) => item.dataset.dateGroup === key && !item.hidden,
  );
  if (!group) return;
  group.scrollIntoView({
    behavior: reduced() ? "instant" : "smooth",
    block: "start",
  });
  const url = new URL(location.href);
  url.hash = `archive-${key}`;
  history.replaceState(null, "", url);
  if (picker) picker.value = key;
}
function setCurrent(key: string): void {
  yearGroups.forEach((year) => {
    const current = key.startsWith(year.dataset.year ?? "unavailable");
    year.classList.toggle("is-current", current);
    year
      .querySelector("button")
      ?.setAttribute("aria-current", current ? "date" : "false");
  });
  document
    .querySelectorAll<HTMLAnchorElement>("[data-month-jump]")
    .forEach((link) =>
      link.setAttribute(
        "aria-current",
        link.dataset.monthJump === key ? "date" : "false",
      ),
    );
  if (picker) picker.value = key;
}
function refresh(): void {
  groups.forEach((group) => {
    group.hidden = ![
      ...group.querySelectorAll<HTMLElement>("[data-note]"),
    ].some((card) => !card.hidden);
  });
  yearGroups.forEach((year) => {
    year.hidden = !groups.some(
      (group) =>
        !group.hidden &&
        group.dataset.dateGroup?.startsWith(year.dataset.year ?? "unavailable"),
    );
  });
  picker
    ?.querySelectorAll<HTMLOptionElement>("option[value]")
    .forEach((option) => {
      if (option.value)
        option.disabled = Boolean(
          groups.find((group) => group.dataset.dateGroup === option.value)
            ?.hidden,
        );
    });
  const first = groups.find((group) => !group.hidden);
  if (first) setCurrent(first.dataset.dateGroup!);
}
yearGroups.forEach((year) => {
  const button = year.querySelector<HTMLButtonElement>("button");
  const months = year.querySelector<HTMLElement>(".timeline-months");
  if (!button || !months) return;
  const open = () => {
    months.hidden = false;
    button.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    if (year.contains(document.activeElement)) return;
    months.hidden = true;
    button.setAttribute("aria-expanded", "false");
  };
  year.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") open();
  });
  year.addEventListener("pointerleave", close);
  year.addEventListener("focusin", open);
  year.addEventListener("focusout", () => queueMicrotask(close));
  button.addEventListener("click", () => {
    open();
    const first = groups.find(
      (group) =>
        !group.hidden &&
        group.dataset.dateGroup?.startsWith(year.dataset.year!),
    );
    if (first) jump(first.dataset.dateGroup!);
  });
});
document
  .querySelectorAll<HTMLAnchorElement>("[data-month-jump]")
  .forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      jump(link.dataset.monthJump!);
    }),
  );
picker?.addEventListener("change", () => jump(picker.value));
document.addEventListener("journal:filtered", refresh);
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter(
          (entry) =>
            entry.isIntersecting && !(entry.target as HTMLElement).hidden,
        )
        .sort(
          (a, b) =>
            Math.abs(a.boundingClientRect.top) -
            Math.abs(b.boundingClientRect.top),
        );
      const key = (visible[0]?.target as HTMLElement | undefined)?.dataset
        .dateGroup;
      if (key) setCurrent(key);
    },
    { rootMargin: "-12% 0px -65% 0px" },
  );
  groups.forEach((group) => observer.observe(group));
}
refresh();
