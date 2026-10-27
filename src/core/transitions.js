// -----------------------------------------
// PAGE TRANSITIONS (pixel grid)
// -----------------------------------------
// Markup (outside the Barba container, so it persists between pages):
//
//   <div data-transition-wrap class="transition">
//     <div data-transition-panel class="transition__panel">
//       <div data-transition-col class="transition__col">
//         <div data-transition-pixel class="transition__pixel"></div>
//       </div>
//     </div>
//   </div>
//
// One column with one pixel acts as the template; pixelGrid() clones it into
// a grid that fills the viewport. Leave: pixels appear in random order until
// the screen is covered. Enter: the new page shows underneath and the pixels
// disappear in random order.

import {
  state,
  PIXEL_FADE_DURATION,
  PIXEL_STAGGER_AMOUNT,
  ENTER_REVEAL_DELAY,
} from "./state.js";
import { resetPage, scrollToInitialHash } from "./page.js";

// Number of columns per breakpoint (pixels are square, rows follow from height)
const PIXEL_COLUMNS = {
  desktop: 20,
  tablet: 12,
  mobileLandscape: 10,
  mobile: 8,
};

const pixelStagger = {
  amount: PIXEL_STAGGER_AMOUNT,
  from: "random",
};

function getPanel() {
  return document.querySelector("[data-transition-wrap] [data-transition-panel]");
}

// -----------------------------------------
// Pixel grid helper
// -----------------------------------------
// Builds (or resizes) the grid for the current viewport. Cheap when nothing
// changed: it only adds/removes the difference.

function getColumnCount() {
  const width = window.innerWidth;
  const isLandscape = window.innerWidth > window.innerHeight;

  if (width <= 479) return PIXEL_COLUMNS.mobile;
  if (width <= 767) return isLandscape ? PIXEL_COLUMNS.mobileLandscape : PIXEL_COLUMNS.mobile;
  if (width <= 991) return PIXEL_COLUMNS.tablet;
  return PIXEL_COLUMNS.desktop;
}

// Templates are grabbed once, before the first rebuild replaces the originals
let colTemplate = null;
let pixelTemplate = null;

function pixelGrid() {
  const panel = getPanel();
  if (!panel) return;

  if (!colTemplate) {
    const firstCol = panel.querySelector("[data-transition-col]");
    const firstPixel = firstCol?.querySelector("[data-transition-pixel]");
    if (!firstCol || !firstPixel) {
      console.warn("[transition] Missing [data-transition-col] / [data-transition-pixel] template");
      return;
    }
    colTemplate = firstCol.cloneNode(false); // empty column
    pixelTemplate = firstPixel.cloneNode(true);
  }

  const columns = getColumnCount();
  const rect = panel.getBoundingClientRect();
  if (!rect.width) return;

  const pixelSize = rect.width / columns;
  const rows = Math.ceil(rect.height / pixelSize);

  panel.style.flexDirection = "row";

  let cols = panel.querySelectorAll("[data-transition-col]");

  if (cols.length !== columns) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < columns; i++) {
      frag.appendChild(colTemplate.cloneNode(false));
    }
    panel.replaceChildren(frag);
    cols = panel.querySelectorAll("[data-transition-col]");
  }

  cols.forEach((col) => {
    col.style.flexDirection = "column";
    col.style.flex = "1 1 auto";
    col.style.justifyContent = "center";

    const diff = rows - col.childElementCount;

    if (diff > 0) {
      const frag = document.createDocumentFragment();
      for (let i = 0; i < diff; i++) {
        frag.appendChild(pixelTemplate.cloneNode(true));
      }
      col.appendChild(frag);
    } else if (diff < 0) {
      for (let i = diff; i < 0; i++) {
        col.lastElementChild.remove();
      }
    }
  });
}

// -----------------------------------------
// Once (first load)
// -----------------------------------------

export function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(() => {
    resetPage(next);
    scrollToInitialHash(next);
    // Build the grid up front, so the first click doesn't do the DOM work
    pixelGrid();
  }, null, 0);

  return tl;
}

// -----------------------------------------
// Leave: pixels cover the screen
// -----------------------------------------

export function runPageLeaveAnimation(current, next) {
  const tl = gsap.timeline({
    onComplete: () => current.remove(),
  });

  const panel = getPanel();

  if (state.reducedMotion || !panel) {
    // Immediate swap behavior if user prefers reduced motion (or no markup)
    return tl.set(current, { autoAlpha: 0 });
  }

  // Rebuild for the current viewport (the user may have resized since load)
  pixelGrid();
  const pixels = panel.querySelectorAll("[data-transition-pixel]");

  tl.set(next, { autoAlpha: 0 }, 0);
  tl.set(panel, { opacity: 1, pointerEvents: "none" }, 0);
  tl.set(pixels, { opacity: 0 }, 0);

  tl.to(pixels, {
    opacity: 1,
    duration: PIXEL_FADE_DURATION,
    ease: "none",
    stagger: pixelStagger,
  }, 0);

  return tl;
}

// -----------------------------------------
// Enter: new page underneath, pixels disappear
// -----------------------------------------

export function runPageEnterAnimation(next) {
  const tl = gsap.timeline();
  const panel = getPanel();

  if (state.reducedMotion || !panel) {
    // Immediate swap behavior if user prefers reduced motion (or no markup)
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise((resolve) => tl.call(resolve, null, "pageReady"));
  }

  // No-op when leave already built the grid (same viewport); guards against
  // a stale pixel list if Barba ever calls enter before leave.
  pixelGrid();
  const pixels = panel.querySelectorAll("[data-transition-pixel]");

  // With sync: true, leave and enter start together. Wait until the leave
  // has covered the whole screen before showing the new page.
  tl.add("startEnter", ENTER_REVEAL_DELAY);

  tl.set(next, { autoAlpha: 1 }, "startEnter");

  tl.to(pixels, {
    opacity: 0,
    duration: PIXEL_FADE_DURATION,
    ease: "none",
    stagger: pixelStagger,
    overwrite: "auto",
  }, "startEnter");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise((resolve) => {
    tl.call(resolve, null, "pageReady");
  });
}
// // -----------------------------------------
// // PAGE TRANSITIONS
// // -----------------------------------------

// import { state } from "./state.js";
// import { resetPage, scrollToInitialHash } from "./page.js";

// export function runPageOnceAnimation(next) {
//   const tl = gsap.timeline();

//   tl.call(() => {
//     resetPage(next);
//     scrollToInitialHash(next);
//   }, null, 0);

//   return tl;
// }

// export function runPageLeaveAnimation(current, next) {
//   const transitionWrap = document.querySelector("[data-transition-wrap]");
//   const transitionPanel = transitionWrap.querySelector("[data-transition-panel]");

//   const tl = gsap.timeline({
//     onComplete: () => current.remove(),
//   });

//   if (state.reducedMotion) {
//     // Immediate swap behavior if user prefers reduced motion
//     return tl.set(current, { autoAlpha: 0 });
//   }

//   tl.set(transitionPanel, { autoAlpha: 1 }, 0);
//   tl.set(next, { autoAlpha: 0 }, 0);

//   tl.fromTo(transitionPanel,
//     { yPercent: 0 },
//     { yPercent: -100, duration: 0.6, ease: "page-transition" },
//     0);

//   tl.fromTo(current,
//     { y: "0vh" },
//     { y: "-15vh", duration: 0.6, ease: "page-transition" },
//     0);

//   return tl;
// }

// export function runPageEnterAnimation(next) {
//   const transitionWrap = document.querySelector("[data-transition-wrap]");
//   const transitionPanel = transitionWrap.querySelector("[data-transition-panel]");

//   const tl = gsap.timeline();

//   if (state.reducedMotion) {
//     // Immediate swap behavior if user prefers reduced motion
//     tl.set(next, { autoAlpha: 1 });
//     tl.add("pageReady");
//     tl.call(resetPage, [next], "pageReady");
//     return new Promise((resolve) => tl.call(resolve, null, "pageReady"));
//   }

//   // Keep in sync with ENTER_REVEAL_DELAY (state.js)
//   tl.add("startEnter", 1.1);

//   tl.set(next, { autoAlpha: 1 }, "startEnter");

//   tl.fromTo(transitionPanel,
//     { yPercent: -100 },
//     {
//       yPercent: -200,
//       duration: 0.8,
//       ease: "page-transition",
//       overwrite: "auto",
//       immediateRender: false,
//     },
//     "startEnter");

//   tl.set(transitionPanel, { autoAlpha: 0 }, ">");

//   tl.from(next, {
//     y: "15vh",
//     duration: 1,
//     ease: "elastic.out(1, 0.45)",
//   }, "startEnter");

//   tl.add("pageReady");
//   tl.call(resetPage, [next], "pageReady");

//   return new Promise((resolve) => {
//     tl.call(resolve, null, "pageReady");
//   });
// }