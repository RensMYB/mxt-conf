// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

import { state, hasLenis, hasScrollTrigger } from "./state.js";
import { initLenis } from "./lenis.js";
import { snapshotPageCleanup, runPendingCleanup } from "./cleanup.js";
import { runComponents } from "./components.js";
import { applyThemeFrom, resetWebflow } from "./page.js";
import {
  runPageOnceAnimation,
  runPageLeaveAnimation,
  runPageEnterAnimation,
} from "./transitions.js";

let onceInitialized = false;

export function initBarba({ debug = false } = {}) {
  history.scrollRestoration = "manual";

  barba.hooks.beforeLeave(() => {
    snapshotPageCleanup();
  });

  barba.hooks.beforeEnter((data) => {
    // Position new container on top
    gsap.set(data.next.container, {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
    });

    state.lenis?.stop?.();

    runComponents("beforeEnter", data.next.container);
    applyThemeFrom(data.next.container);
  });

  barba.hooks.afterLeave(() => {
    runPendingCleanup();
  });

  barba.hooks.afterEnter((data) => {
    // Nav lives inside the container, so Webflow's native interactions must
    // be re-bound on the new DOM.
    resetWebflow(data);

    runComponents("afterEnter", data.next.container);

    // First load is done; later navigations run the full enter animation.
    state.isFirstLoad = false;

    // Settle
    if (hasLenis && state.lenis) {
      state.lenis.resize();
      state.lenis.start();
    }
    if (hasScrollTrigger) ScrollTrigger.refresh();
  });

  barba.init({
    debug,
    timeout: 7000,
    preventRunning: true,
    transitions: [
      {
        name: "default",
        sync: true,

        async once(data) {
          initLenis();
          if (!onceInitialized) {
            onceInitialized = true;
            runComponents("once", document);
          }
          return runPageOnceAnimation(data.next.container);
        },

        async leave(data) {
          return runPageLeaveAnimation(data.current.container, data.next.container);
        },

        async enter(data) {
          return runPageEnterAnimation(data.next.container);
        },
      },
    ],
  });
}