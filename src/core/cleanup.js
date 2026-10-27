// -----------------------------------------
// PER-PAGE CLEANUP
// -----------------------------------------
// Components get `signal` and `onCleanup` via their init context, so you
// normally never import this file in a component.
//
// Why a snapshot? With sync: true, Barba runs beforeEnter (new page init)
// BEFORE afterLeave. So in beforeLeave we set aside everything belonging to
// the old page and start a fresh bucket for the new page; the old bucket is
// only torn down in afterLeave, once the old page is off screen.

import { hasScrollTrigger } from "./state.js";

let controller = new AbortController();
let cleanupFns = [];
let pending = null;

export const getPageSignal = () => controller.signal;

export function onPageCleanup(fn) {
  if (typeof fn === "function") cleanupFns.push(fn);
}

export function snapshotPageCleanup() {
  const triggers = hasScrollTrigger ? ScrollTrigger.getAll() : [];
  const fns = cleanupFns;
  const oldController = controller;

  cleanupFns = [];
  controller = new AbortController();

  pending = () => {
    triggers.forEach((t) => t.kill());
    fns.forEach((fn) => {
      try { fn(); } catch (err) { console.warn("Page cleanup failed:", err); }
    });
    oldController.abort();
  };
}

export function runPendingCleanup() {
  pending?.();
  pending = null;
}