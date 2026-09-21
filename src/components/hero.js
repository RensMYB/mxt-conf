// Hero entrance animation.
// In Webflow, add data-hero to elements you want to animate on load.
// Use the value as a delay: data-hero="0.15"

import { qs } from "../utils/dom.js";

export function hero() {
  const els = qs("[data-hero]");
  if (!els.length) return;

  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

  els.forEach((el) => {
    tl.from(
      el,
      {
        y: 60,
        autoAlpha: 0,
        duration: 1,
      },
      parseFloat(el.dataset.hero) || 0
    );
  });

  return tl;
}
