// ─── FLIP CARDS ──────────────────────────
// Click a card in a CMS grid to flip it to its back (and click again to flip
// back). The animation itself is plain CSS; this only toggles .is-flipped.
// Only one card is open at a time. Cards without a back side are ignored.
//
// On mouse hover the card also tilts towards the cursor, as a hint that it can
// be flipped (set via --rx / --ry, the CSS does the easing).
//
// Webflow: data-flip-cards on the grid. Each .w-dyn-item contains
//   .card-xy-hover-element   (tilt wrapper)
//   └─ .card-rotate-inner
//     ├─ .card-rotate__side.is-front   (the existing card)
//     └─ .card-rotate__side.is-back    (the quote / bio)
// CSS lives in Webflow (see README).

import { state } from "../core/state.js";

const ITEM = ".w-dyn-item";
const TILT = ".card-xy-hover-element";
const TILT_MAX = 8; // degrees at the card edge
const BACK = ".card-rotate__side.is-back";

// A card only flips when its back has content (empty CMS fields are skipped)
const hasBack = (item) => !!item.querySelector(BACK)?.textContent.trim();

export default {
  name: "flip-cards",
  selector: "[data-flip-cards]",
  init({ elements, signal }) {
    elements.forEach((grid) => {
      grid.querySelectorAll(ITEM).forEach((item) => {
        if (!hasBack(item)) return;
        item.setAttribute("tabindex", "0");
        item.setAttribute("role", "button");
        item.setAttribute("aria-pressed", "false");
      });

      const setFlipped = (item, on) => {
        item.classList.toggle("is-flipped", on);
        item.setAttribute("aria-pressed", String(on));
      };

      const toggle = (item) => {
        const on = !item.classList.contains("is-flipped");
        grid.querySelectorAll(`${ITEM}.is-flipped`).forEach((other) => setFlipped(other, false));
        setFlipped(item, on);
      };

      grid.addEventListener("click", (e) => {
        if (e.target.closest("a, button")) return; // LinkedIn etc. keep working
        const item = e.target.closest(ITEM);
        if (item && hasBack(item)) toggle(item);
      }, { signal });

      const resetTilt = (tilt) => {
        tilt.style.removeProperty("--rx");
        tilt.style.removeProperty("--ry");
      };

      grid.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse" || state.reducedMotion) return;
        const item = e.target.closest(ITEM);
        const tilt = item?.querySelector(TILT);
        if (!tilt) return;
        const r = item.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.setProperty("--rx", `${(-y * 2 * TILT_MAX).toFixed(2)}deg`);
        tilt.style.setProperty("--ry", `${(x * 2 * TILT_MAX).toFixed(2)}deg`);
      }, { signal });

      grid.addEventListener("pointerout", (e) => {
        const item = e.target.closest(ITEM);
        if (!item || item.contains(e.relatedTarget)) return;
        const tilt = item.querySelector(TILT);
        if (tilt) resetTilt(tilt);
      }, { signal });

      grid.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const item = e.target.closest(ITEM);
        if (!item || item !== e.target || !hasBack(item)) return;
        e.preventDefault();
        toggle(item);
      }, { signal });
    });
  },
};