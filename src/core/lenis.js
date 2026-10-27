// -----------------------------------------
// LENIS
// -----------------------------------------

import { state, hasLenis, hasScrollTrigger } from "./state.js";

export function initLenis() {
  if (state.lenis || !hasLenis) return;

  state.lenis = new Lenis({
    lerp: 0.165,
    wheelMultiplier: 1.25,
  });

  if (hasScrollTrigger) {
    state.lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    state.lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}