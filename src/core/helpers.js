// -----------------------------------------
// GENERIC HELPERS
// -----------------------------------------

export function debounceOnWidthChange(fn, ms) {
  let last = innerWidth, timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (innerWidth !== last) {
        last = innerWidth;
        fn.apply(this, args);
      }
    }, ms);
  };
}

// ── Lumos slot helpers (shared by tabs, slider, accordion) ──

export function flattenDisplayContents(slot) {
  if (!slot) return;
  let child = slot.firstElementChild;
  while (child && child.classList.contains("u-display-contents")) {
    while (child.firstChild) slot.insertBefore(child.firstChild, child);
    slot.removeChild(child);
    child = slot.firstElementChild;
  }
}

export function removeCMSList(slot) {
  if (!slot) return;
  const dynList = Array.from(slot.children).find((child) => child.classList.contains("w-dyn-list"));
  if (!dynList) return;
  const nestedItems = dynList.querySelector(".w-dyn-items")?.children;
  if (!nestedItems) return;
  const staticWrapper = [...slot.children];
  [...nestedItems].forEach((el) => {
    const c = [...el.children].find((c) => !c.classList.contains("w-condition-invisible"));
    c && slot.appendChild(c);
  });
  staticWrapper.forEach((el) => el.remove());
}

// Both in one go, which is what every Lumos slot needs
export function prepareLumosSlot(slot) {
  flattenDisplayContents(slot);
  removeCMSList(slot);
}