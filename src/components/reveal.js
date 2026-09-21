// Scroll-triggered reveal animation.
// In Webflow, add data-reveal to any element.
// It fades in when it enters the viewport.

import { qs } from "../utils/dom.js";

export function reveal() {
  const els = qs("[data-reveal]");
  if (!els.length) return;

  els.forEach((el) => {
    gsap.from(el, {
      y: 30,
      autoAlpha: 0,
      duration: 0.8,
      ease: "expo.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
      },
    });
  });
}
