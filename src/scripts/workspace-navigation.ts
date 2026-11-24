const toggle = document.querySelector<HTMLButtonElement>("#cms-menu-toggle");
const navigation = document.getElementById("cms-sidebar-navigation");

if (toggle && navigation) {
  const isOpen = () => toggle.getAttribute("aria-expanded") === "true";
  const close = () => {
    if (!isOpen()) return;
    if (navigation.contains(document.activeElement)) toggle.focus();
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    toggle.setAttribute("aria-expanded", String(!isOpen()));
  });
  navigation.addEventListener("click", (event) => {
    if (
      event.target instanceof Element &&
      event.target.closest("a") &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      close();
    }
  });
  toggle.closest(".cms-sidebar")?.addEventListener("keydown", (event) => {
    if (event instanceof KeyboardEvent && event.key === "Escape" && isOpen()) {
      event.preventDefault();
      close();
    }
  });
  window.addEventListener("hashchange", close);
  toggle.hidden = false;
}

export {};
