// -----------------------------------------
// SHARED STATE
// -----------------------------------------
// One mutable object, so every module reads the same live values.

export const hasLenis = typeof window.Lenis !== "undefined";
export const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
export const hasSplitText = typeof window.SplitText !== "undefined";

// ── Page transition timing ──
// Single source for transitions.js and the heading reveal (headings.js).
export const PIXEL_FADE_DURATION = 0.05; // fade of one pixel
export const PIXEL_STAGGER_AMOUNT = 0.6; // total spread of all pixels (random order)

// When the new page becomes visible: once every pixel has covered the screen.
// Above-the-fold headings wait this long before their reveal on navigation.
export const ENTER_REVEAL_DELAY = PIXEL_FADE_DURATION + PIXEL_STAGGER_AMOUNT + 0.05;

export const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

export const state = {
  lenis: null,
  isFirstLoad: true,
  reducedMotion: rmMQ.matches,
};

const onMotionChange = (e) => (state.reducedMotion = e.matches);
if (rmMQ.addEventListener) rmMQ.addEventListener("change", onMotionChange);
else rmMQ.addListener?.(onMotionChange);

// // -----------------------------------------
// // SHARED STATE
// // -----------------------------------------
// // One mutable object, so every module reads the same live values.

// export const hasLenis = typeof window.Lenis !== "undefined";
// export const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
// export const hasSplitText = typeof window.SplitText !== "undefined";

// // When the page actually becomes visible during the enter animation. Keep this
// // in sync with the "startEnter" label in runPageEnterAnimation (transitions.js).
// export const ENTER_REVEAL_DELAY = 1.2;

// export const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

// export const state = {
//   lenis: null,
//   isFirstLoad: true,
//   reducedMotion: rmMQ.matches,
// };

// const onMotionChange = (e) => (state.reducedMotion = e.matches);
// if (rmMQ.addEventListener) rmMQ.addEventListener("change", onMotionChange);
// else rmMQ.addListener?.(onMotionChange);