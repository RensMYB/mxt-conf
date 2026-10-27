// ─── LUMOS DROPDOWN ──────────────────────

const refreshScroll = () => {
  if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
};

function initDropdown(component, index, signal) {
  const button = component.querySelector(".dropdown_toggle_clickable");
  const content = component.querySelector(".dropdown_content");
  if (!button || !content) return console.warn("Missing elements:", component);

  button.setAttribute("id", `dropdown-btn-${index}`);
  button.setAttribute("aria-controls", `dropdown-${index}`);
  content.setAttribute("id", `dropdown-${index}`);
  content.setAttribute("aria-labelledby", `dropdown-btn-${index}`);

  const isOpen = () => button.getAttribute("aria-expanded") === "true";

  function openDropdown() {
    button.setAttribute("aria-expanded", "true");
    component.classList.add("is-active");
    gsap.timeline({ onComplete: refreshScroll })
      .set(content, { display: "block" })
      .fromTo(content, { height: 0 }, { height: "auto", ease: "myb", duration: 0.6 });
  }

  function closeDropdown() {
    button.setAttribute("aria-expanded", "false");
    component.classList.remove("is-active");
    gsap.timeline({ onComplete: refreshScroll })
      .to(content, { height: 0, ease: "myb", duration: 0.4 })
      .set(content, { display: "none" });
  }

  // On the element itself → removed with the container
  button.addEventListener("click", () => (isOpen() ? closeDropdown() : openDropdown()));

  if (component.getAttribute("data-open-on-hover-in") === "True") {
    component.addEventListener("mouseenter", () => !isOpen() && openDropdown());
  }
  if (component.getAttribute("data-close-on-hover-out") === "True") {
    component.addEventListener("mouseleave", () => isOpen() && closeDropdown());
  }

  // Document-level → removed via the page signal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) {
      closeDropdown();
      button.focus();
    }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && isOpen() && component.contains(document.activeElement)) {
      e.preventDefault();
      const items = [...content.querySelectorAll("a, button")];
      if (!items.length) return;
      const currentIndex = items.indexOf(document.activeElement);
      const nextIndex = currentIndex === -1
        ? (e.key === "ArrowDown" ? 0 : items.length - 1)
        : (currentIndex + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[nextIndex].focus();
    }
  }, { signal });

  document.addEventListener("click", (e) => {
    if (isOpen() && !component.contains(e.target)) closeDropdown();
  }, { signal });
}

export default {
  name: "lumos-dropdown",
  selector: ".dropdown_wrap",
  init({ elements, signal }) {
    elements.forEach((component, i) => initDropdown(component, i, signal));
  },
};