// -----------------------------------------
// COMPONENT REGISTRY
// -----------------------------------------
// A component is a plain object:
//
//   export default {
//     name: "tabs",
//     selector: ".tab_wrap",
//     phase: "afterEnter",   // "once" | "beforeEnter" | "afterEnter" (default)
//     init({ container, elements, signal, onCleanup }) {
//       // elements  → all matches of `selector` inside the new container
//       // signal    → pass to document/window listeners: { signal }
//       // onCleanup → register teardown (observers, timelines, Swipers…)
//       // Optionally return a cleanup function instead of calling onCleanup.
//     },
//   };
//
// init only runs when the selector matches something on the page, and each
// component runs in its own try/catch so one error doesn't break the rest.

import { getPageSignal, onPageCleanup } from "./cleanup.js";

const registry = { once: [], beforeEnter: [], afterEnter: [] };

export function registerComponents(components) {
  components.forEach((component) => {
    const phase = component.phase || "afterEnter";
    if (!registry[phase]) {
      console.warn(`[components] Unknown phase "${phase}" for`, component.name);
      return;
    }
    registry[phase].push(component);
  });
}

export function runComponents(phase, container = document) {
  // "once" components live for the whole session: no page-bound cleanup.
  const isOnce = phase === "once";

  registry[phase].forEach((component) => {
    const elements = [...container.querySelectorAll(component.selector)];
    if (!elements.length) return;

    try {
      const cleanup = component.init({
        container,
        elements,
        signal: isOnce ? undefined : getPageSignal(),
        onCleanup: isOnce ? () => { } : onPageCleanup,
      });
      if (!isOnce) onPageCleanup(cleanup);
    } catch (err) {
      console.error(`[${component.name || component.selector}] init failed:`, err);
    }
  });
}