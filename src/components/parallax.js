// ─── GLOBAL PARALLAX ─────────────────────
// Attributes in Webflow:
//   data-parallax="trigger"               → the element whose scroll drives it
//   data-parallax="target"                → optional child that moves
//                                            (falls back to the trigger itself)
// On the trigger:
//   data-parallax-direction="vertical"    → "vertical" (yPercent) | "horizontal" (xPercent)
//   data-parallax-start="20"              → start offset in %
//   data-parallax-end="-20"               → end offset in %
//   data-parallax-scrub="true"            → true, or a number for smoothing (e.g. 0.5)
//   data-parallax-scroll-start="top bottom"
//   data-parallax-scroll-end="bottom top"
//   data-parallax-disable="mobile"        → "mobile" (≤479) | "mobileLandscape" (≤767)
//                                            | "tablet" (≤991, so tablet and smaller)
//
// Runs in afterEnter: during beforeEnter the container is still position:fixed
// and offset by the enter animation, so ScrollTrigger would measure wrong.

const BREAKPOINTS = {
  isMobile: "(max-width: 479px)",
  isMobileLandscape: "(max-width: 767px)",
  isTablet: "(max-width: 991px)",
  isDesktop: "(min-width: 992px)",
  reduceMotion: "(prefers-reduced-motion: reduce)",
};

function isDisabled(trigger, { isMobile, isMobileLandscape, isTablet }) {
  const disable = trigger.getAttribute("data-parallax-disable");
  return (
    (disable === "mobile" && isMobile) ||
    (disable === "mobileLandscape" && isMobileLandscape) ||
    (disable === "tablet" && isTablet)
  );
}

function parseScrub(value) {
  if (value === null || value === "" || value === "true") return true;
  if (value === "false") return false;
  const n = parseFloat(value);
  return Number.isNaN(n) ? true : n;
}

function createParallax(trigger, conditions) {
  if (isDisabled(trigger, conditions)) return;

  const target = trigger.querySelector('[data-parallax="target"]') || trigger;
  const direction = trigger.getAttribute("data-parallax-direction") || "vertical";
  const prop = direction === "horizontal" ? "xPercent" : "yPercent";

  const startAttr = trigger.getAttribute("data-parallax-start");
  const endAttr = trigger.getAttribute("data-parallax-end");
  const startVal = startAttr !== null ? parseFloat(startAttr) : 20;
  const endVal = endAttr !== null ? parseFloat(endAttr) : -20;

  const scrollStart = `clamp(${trigger.getAttribute("data-parallax-scroll-start") || "top bottom"})`;
  const scrollEnd = `clamp(${trigger.getAttribute("data-parallax-scroll-end") || "bottom top"})`;

  gsap.fromTo(target,
    { [prop]: startVal },
    {
      [prop]: endVal,
      ease: "none",
      scrollTrigger: {
        trigger,
        start: scrollStart,
        end: scrollEnd,
        scrub: parseScrub(trigger.getAttribute("data-parallax-scrub")),
      },
    }
  );
}

export default {
  name: "parallax",
  selector: '[data-parallax="trigger"]',
  init({ elements }) {
    if (typeof ScrollTrigger === "undefined") return;

    const mm = gsap.matchMedia();

    // matchMedia re-runs this on every breakpoint change and reverts the
    // previous run (tweens + ScrollTriggers) automatically, so no gsap.context
    // is needed inside.
    mm.add(BREAKPOINTS, ({ conditions }) => {
      if (conditions.reduceMotion) return;
      elements.forEach((trigger) => createParallax(trigger, conditions));
    });

    // Reverts everything (transforms back to their original state) and stops
    // listening for breakpoint changes once the page leaves.
    return () => mm.revert();
  },
};