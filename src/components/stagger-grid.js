// ─── STAGGER GRID ────────────────────────
// Adds .is-visible to CMS items as they scroll into view; the animation
// itself is plain CSS. Items that enter together get --stagger-i 0, 1, 2…
// so they stagger per row instead of across the whole grid.
//
// Webflow: .stagger-grid on the CMS list. CSS lives in Webflow (see README).

export default {
  name: "stagger-grid",
  selector: ".stagger-grid",
  init({ elements, onCleanup }) {
    const io = new IntersectionObserver((entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, i) => {
          entry.target.style.setProperty("--stagger-i", i);
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
    }, { rootMargin: "0px 0px -10% 0px" });

    elements.forEach((grid) => {
      grid.querySelectorAll(".w-dyn-item").forEach((item) => io.observe(item));
    });

    onCleanup(() => io.disconnect());
  },
};