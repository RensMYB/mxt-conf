// ─── NUMBER ODOMETER ─────────────────────
// Attributes in Webflow:
//   data-odometer-group                  → wrapper, one ScrollTrigger per group
//     data-odometer-trigger-start="top 80%"
//     data-odometer-stagger="0.1"         → seconds between elements
//     data-odometer-stagger-order="left"  → "left" | "right" | "random"
//   data-odometer-element                → the number itself (final value as text)
//     data-odometer-start="0"             → start value (default 0)
//     data-odometer-duration="1"          → roll duration in seconds
//     data-odometer-grow="true|false"     → animate in extra digits (auto when start has fewer digits)
//
// Two components in one file:
//   numberOdometerPrepare (beforeEnter) → builds the rollers while the page is
//     still hidden, so you never see the final number flash before it resets
//   numberOdometer        (afterEnter)  → creates the scroll-triggered timeline
//     once the page sits in its final position, so ScrollTrigger measures
//     correctly and above-the-fold counters don't finish while still hidden
//
// Programmatic update (from another component):
//   import { updateOdometer } from "./number-odometer.js";
//   updateOdometer(el, "1.250");

import { state } from "../core/state.js";
import { debounceOnWidthChange } from "../core/helpers.js";

const DEFAULTS = {
  duration: 1,
  ease: "power3.out",
  elementStagger: 0.1,
  digitStagger: 0.04,
  revealDuration: 0.5,
  revealEase: "power2.out",
  triggerStart: "top 80%",
  staggerOrder: "left",
  digitCycles: 2,
};

const ELEMENT_SELECTOR = "[data-odometer-element]";

// Group → prepared element data (filled in beforeEnter, used in afterEnter)
const preparedGroups = new WeakMap();
// Element → running programmatic update timeline
const activeTweens = new WeakMap();

// -----------------------------------------
// Prepare (beforeEnter): build roller DOM
// -----------------------------------------

function prepareGroup(group) {
  if (preparedGroups.has(group)) return preparedGroups.get(group);

  const elements = Array.from(group.querySelectorAll(ELEMENT_SELECTOR));
  if (!elements.length || state.reducedMotion) {
    preparedGroups.set(group, null);
    return null;
  }

  const elementData = elements.map((el) => {
    const originalText = el.textContent.trim();
    const hasExplicitStart = el.hasAttribute("data-odometer-start");
    const startValue = parseFloat(el.getAttribute("data-odometer-start")) || 0;
    const duration = parseFloat(el.getAttribute("data-odometer-duration")) || DEFAULTS.duration;
    const step = getLineHeightRatio(el);

    let segments = parseSegments(originalText);
    segments = mapStartDigits(segments, startValue);
    segments = markHiddenSegments(segments, startValue);

    const grow = shouldGrow(el, hasExplicitStart, startValue, segments);
    const { rollers, revealEls } = buildRollerDOM(el, segments, step, grow);

    // Measuring works while the container is still hidden (visibility, not display)
    const fontSize = parseFloat(getComputedStyle(el).fontSize);
    const revealData = revealEls.map((revealEl) => {
      const widthEm = revealEl.offsetWidth / fontSize;
      gsap.set(revealEl, { width: 0, overflow: "hidden" });
      return { el: revealEl, widthEm };
    });

    return { el, rollers, duration, step, revealData, originalText };
  });

  preparedGroups.set(group, elementData);
  return elementData;
}

// -----------------------------------------
// Animate (afterEnter): scroll-triggered timeline
// -----------------------------------------

function animateGroup(group) {
  const elementData = prepareGroup(group); // fallback if beforeEnter didn't run
  if (!elementData) return null;

  const staggerOrder = group.getAttribute("data-odometer-stagger-order") || DEFAULTS.staggerOrder;
  const triggerStart = group.getAttribute("data-odometer-trigger-start") || DEFAULTS.triggerStart;
  const elementStagger = parseFloat(group.getAttribute("data-odometer-stagger")) || DEFAULTS.elementStagger;

  const ordered = applyStaggerOrder(elementData, staggerOrder);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: group,
      start: triggerStart,
      once: true,
    },
    onComplete() {
      elementData.forEach(({ el, originalText }) => cleanupElement(el, originalText));
    },
  });

  ordered.forEach(({ rollers, duration, step, revealData }, orderIdx) => {
    const offset = orderIdx * elementStagger;

    revealData.forEach(({ el, widthEm }) => {
      tl.to(el, {
        width: widthEm + "em",
        opacity: 1,
        duration: DEFAULTS.revealDuration,
        ease: DEFAULTS.revealEase,
      }, offset);
    });

    rollers.forEach(({ roller, targetPos }, digitIdx) => {
      const reversedIdx = rollers.length - 1 - digitIdx;
      tl.to(roller, {
        y: -targetPos * step + "em",
        duration,
        ease: DEFAULTS.ease,
        force3D: true,
      }, offset + reversedIdx * DEFAULTS.digitStagger);
    });
  });

  return tl;
}

// -----------------------------------------
// Programmatic update
// -----------------------------------------

export function updateOdometer(el, newText, options = {}) {
  const currentText = el.textContent.trim();
  if (currentText === newText) return;

  // Reduced motion: just swap the text
  if (state.reducedMotion) {
    el.textContent = newText;
    return;
  }

  const duration = options.duration || DEFAULTS.duration;
  const ease = options.ease || DEFAULTS.ease;
  const step = getLineHeightRatio(el);

  // Kill any running animation and clear its inline style locks
  const existing = activeTweens.get(el);
  if (existing) {
    existing.kill();
    gsap.set(el, { clearProps: "width,overflow" });
  }

  // Measure current width before rebuilding (in em for responsive scaling)
  const fontSize = parseFloat(getComputedStyle(el).fontSize);
  const oldWidthEm = el.getBoundingClientRect().width / fontSize;

  // Parse current text as start, new text as end
  const startDigitsStr = parseSegments(currentText)
    .filter((s) => s.type === "digit")
    .map((s) => s.char)
    .join("");
  const startValue = parseInt(startDigitsStr, 10) || 0;

  let segments = parseSegments(newText);
  segments = mapStartDigits(segments, startValue);
  segments = markHiddenSegments(segments, startValue);
  const { rollers, revealEls } = buildRollerDOM(el, segments, step, true);

  // Measure new natural width (in em)
  const newWidthEm = el.getBoundingClientRect().width / fontSize;
  const widthChanged = Math.abs(oldWidthEm - newWidthEm) > 0.01;

  // Lock to old width for smooth transition
  if (widthChanged) {
    gsap.set(el, { width: oldWidthEm + "em", overflow: "hidden" });
  }

  const tl = gsap.timeline({
    onComplete() {
      cleanupElement(el, newText);
      activeTweens.delete(el);
    },
  });
  activeTweens.set(el, tl);

  if (widthChanged) {
    tl.to(el, {
      width: newWidthEm + "em",
      duration: DEFAULTS.revealDuration,
      ease: DEFAULTS.revealEase,
    }, 0);
  }

  // Fade in hidden statics
  revealEls.forEach((revealEl) => {
    if (revealEl.getAttribute("data-odometer-part") === "static") {
      tl.to(revealEl, { opacity: 1, duration: 0.2 }, 0);
    }
  });

  // Roll digits
  rollers.forEach(({ roller, targetPos }, digitIdx) => {
    const reversedIdx = rollers.length - 1 - digitIdx;
    tl.to(roller, {
      y: -targetPos * step + "em",
      duration,
      ease,
      force3D: true,
    }, reversedIdx * DEFAULTS.digitStagger);
  });

  return tl;
}

// -----------------------------------------
// Resize
// -----------------------------------------

function recalcOnResize(container) {
  container.querySelectorAll(ELEMENT_SELECTOR).forEach((el) => {
    // Force-complete any running programmatic animation
    const running = activeTweens.get(el);
    if (running) {
      running.progress(1);
      activeTweens.delete(el);
    }

    // Not triggered yet: recalculate step-based inline styles.
    // Completed elements are em-based and scale automatically.
    if (!el.querySelector('[data-odometer-part="roller"]')) return;

    const step = getLineHeightRatio(el);
    el.querySelectorAll('[data-odometer-part="mask"]').forEach((mask) => {
      mask.style.height = step + "em";
      mask.style.lineHeight = step;
    });
    el.querySelectorAll('[data-odometer-part="roller"], [data-odometer-part="static"]').forEach((part) => {
      part.style.lineHeight = step;
    });
  });

  if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
}

// -----------------------------------------
// Helpers
// -----------------------------------------

function getLineHeightRatio(el) {
  const cs = getComputedStyle(el);
  if (cs.lineHeight === "normal") return 1.2;
  return parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
}

function parseSegments(text) {
  return [...text].map((char) => ({
    type: /\d/.test(char) ? "digit" : "static",
    char,
  }));
}

function mapStartDigits(segments, startValue) {
  const digitSlots = segments.filter((s) => s.type === "digit");
  if (!digitSlots.length) return segments;
  const padded = String(Math.floor(Math.abs(startValue)))
    .padStart(digitSlots.length, "0")
    .slice(-digitSlots.length);
  let di = 0;
  return segments.map((s) =>
    s.type === "digit" ? { ...s, startDigit: parseInt(padded[di++], 10) } : s
  );
}

function markHiddenSegments(segments, startValue) {
  const totalDigits = segments.filter((s) => s.type === "digit").length;
  const absStart = Math.floor(Math.abs(startValue));
  const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
  const leadingZeros = Math.max(0, totalDigits - startDigitCount);
  if (leadingZeros === 0) return segments;

  let digitsSeen = 0;
  let firstDigitSeen = false;
  let prevDigitHidden = false;
  return segments.map((seg) => {
    if (seg.type === "digit") {
      firstDigitSeen = true;
      const hidden = digitsSeen < leadingZeros;
      prevDigitHidden = hidden;
      digitsSeen++;
      return { ...seg, hidden };
    }
    return { ...seg, hidden: firstDigitSeen && prevDigitHidden };
  });
}

function shouldGrow(el, hasExplicitStart, startValue, segments) {
  if (el.hasAttribute("data-odometer-grow")) {
    return el.getAttribute("data-odometer-grow") !== "false";
  }
  if (!hasExplicitStart) return false;
  const absStart = Math.floor(Math.abs(startValue));
  const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
  const endDigitCount = segments.filter((s) => s.type === "digit").length;
  return startDigitCount < endDigitCount;
}

function buildRollerDOM(el, segments, step, grow) {
  el.innerHTML = "";
  el.style.height = "";
  const rollers = [];
  const revealEls = [];
  const totalCells = 10 * DEFAULTS.digitCycles;

  segments.forEach((seg) => {
    if (seg.type === "static") {
      const span = document.createElement("span");
      span.setAttribute("data-odometer-part", "static");
      span.style.height = step + "em";
      span.style.lineHeight = step;
      span.textContent = seg.char;
      el.appendChild(span);
      if (grow && seg.hidden) {
        gsap.set(span, { opacity: 0 });
        revealEls.push(span);
      }
      return;
    }

    const mask = document.createElement("span");
    mask.setAttribute("data-odometer-part", "mask");
    mask.style.height = step + "em";
    mask.style.lineHeight = step;

    const roller = document.createElement("span");
    roller.setAttribute("data-odometer-part", "roller");
    roller.style.lineHeight = step;
    roller.textContent = Array.from({ length: totalCells }, (_, d) => d % 10).join("\n");

    mask.appendChild(roller);
    el.appendChild(mask);

    const startDigit = seg.startDigit || 0;
    const isReveal = grow && seg.hidden;
    gsap.set(roller, { y: isReveal ? step + "em" : -startDigit * step + "em" });

    const endDigit = parseInt(seg.char, 10);
    const targetPos = endDigit > startDigit ? endDigit : 10 + endDigit;
    rollers.push({ roller, targetPos });
    if (isReveal) revealEls.push(mask);
  });

  return { rollers, revealEls };
}

function cleanupElement(el, originalText) {
  el.style.overflow = "";
  el.style.height = "";

  // Remove rollers, set final digit, clear inline bloat (but preserve width)
  const digits = [...originalText].filter((c) => /\d/.test(c));
  let di = 0;

  el.querySelectorAll('[data-odometer-part="mask"]').forEach((mask) => {
    mask.querySelector('[data-odometer-part="roller"]')?.remove();
    mask.textContent = digits[di++] || "";
    mask.style.opacity = "";
    mask.style.overflow = "";
  });

  el.querySelectorAll('[data-odometer-part="static"]').forEach((stat) => {
    stat.style.opacity = "";
  });
}

function applyStaggerOrder(items, order) {
  const arr = [...items];
  if (order === "right") return arr.reverse();
  if (order === "random") return shuffleArray(arr);
  return arr;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// -----------------------------------------
// Components
// -----------------------------------------

export const numberOdometerPrepare = {
  name: "number-odometer-prepare",
  selector: "[data-odometer-group]",
  phase: "beforeEnter",
  init({ elements }) {
    elements.forEach(prepareGroup);
  },
};

export const numberOdometer = {
  name: "number-odometer",
  selector: "[data-odometer-group]",
  init({ container, elements, signal, onCleanup }) {
    const timelines = elements.map(animateGroup).filter(Boolean);

    window.addEventListener(
      "resize",
      debounceOnWidthChange(() => recalcOnResize(container), 250),
      { signal }
    );

    onCleanup(() => {
      timelines.forEach((tl) => tl.kill());
      container.querySelectorAll(ELEMENT_SELECTOR).forEach((el) => {
        activeTweens.get(el)?.kill();
        activeTweens.delete(el);
      });
    });
  },
};