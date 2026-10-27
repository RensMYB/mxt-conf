// -----------------------------------------
// PAGE HELPERS (reset, theme, Webflow, hash)
// -----------------------------------------

import { state, hasLenis } from "./state.js";

const themeConfig = {
  light: { nav: "dark", transition: "light" },
  dark: { nav: "light", transition: "dark" },
};

export function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;

  const transitionEl = document.querySelector("[data-theme-transition]");
  if (transitionEl) transitionEl.dataset.themeTransition = config.transition;

  const nav = document.querySelector("[data-theme-nav]");
  if (nav) nav.dataset.themeNav = config.nav;
}

export function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });

  if (hasLenis && state.lenis) {
    state.lenis.resize();
    state.lenis.start();
  }
}

// Re-initialise Webflow on the new page so native components (nav/hamburger,
// dropdowns, forms) and IX2 interactions are bound to the freshly swapped DOM.
// Required because the nav lives inside the Barba container.
export function resetWebflow(data) {
  // IX2 loads the interactions for whichever page id sits on <html>. Pull the
  // new page's id from the fetched HTML, otherwise the previous page's
  // interactions get re-applied to the new content.
  const dom = new DOMParser().parseFromString(data.next.html, "text/html");
  const wfPage = dom.querySelector("html")?.getAttribute("data-wf-page");
  if (wfPage) document.documentElement.setAttribute("data-wf-page", wfPage);

  if (!window.Webflow) return;
  window.Webflow.destroy(); // remove old listeners + IX2 state
  window.Webflow.ready(); // re-bind nav, dropdown, forms, etc.
  window.Webflow.require("ix2")?.init(); // restart the interactions engine
}

export function scrollToInitialHash(container = document) {
  const hash = window.location.hash;
  if (!hash || hash === "#") return;

  // "#/2027-01-13" is an app route (Blokks), not an anchor. It is also not a
  // valid CSS selector: querySelector() would throw and break the transition.
  if (hash.startsWith("#/") || hash.startsWith("#!")) return;

  let id = hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch { }
  const target = document.getElementById(id);
  if (!target) return;

  if (state.reducedMotion) {
    target.scrollIntoView();
    return;
  }

  if (hasLenis && state.lenis) {
    state.lenis.scrollTo(target, { offset: 0, duration: 1, immediate: false, lock: true });
  } else {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}