// ─── LUMOS TABS ──────────────────────────
// Data attributes on .tab_wrap:
//   data-autoplay-duration, data-duration,
//   data-slide-tabs, data-loop-controls,
//   data-pause-on-hover, data-tab-component-id

import { rmMQ } from "../../core/state.js";
import { prepareLumosSlot } from "../../core/helpers.js";

function initTab(tabWrap, componentIndex, { signal, onCleanup }) {
  let loopControls = tabWrap.getAttribute("data-loop-controls") === "True",
    slideTabs = tabWrap.getAttribute("data-slide-tabs") === "True",
    pauseOnHover = tabWrap.getAttribute("data-pause-on-hover") === "True",
    autoplay = Number(tabWrap.getAttribute("data-autoplay-duration")) || 0,
    duration = Number(tabWrap.getAttribute("data-duration")) || 0.3,
    buttonList = tabWrap.querySelector(".tab_button_list"),
    panelList = tabWrap.querySelector(".tab_content_list"),
    previousButton = tabWrap.querySelector("[data-tab='previous']"),
    nextButton = tabWrap.querySelector("[data-tab='next']"),
    toggleButton = tabWrap.querySelector("[data-tab-button='toggle']"),
    animating = false,
    canPlay = true,
    autoplayTl;

  if (!buttonList || !panelList) {
    console.warn("Missing elements in:", tabWrap);
    return;
  }

  prepareLumosSlot(buttonList);
  prepareLumosSlot(panelList);

  const buttonItems = Array.from(buttonList.children);
  const panelItems = Array.from(panelList.children);

  if (!buttonItems.length || !panelItems.length) {
    console.warn("Missing elements in:", tabWrap);
    return;
  }

  panelList.removeAttribute("role");
  buttonList.setAttribute("role", "tablist");
  buttonItems.forEach((btn) => btn.setAttribute("role", "tab"));
  panelItems.forEach((panel) => {
    panel.style.display = "none";
    panel.setAttribute("role", "tabpanel");
  });

  let activeIndex = 0;
  const makeActive = (index, focus = false, animate = true) => {
    if (animating) return;
    buttonItems.forEach((btn, i) => {
      btn.classList.toggle("is-active", i === index);
      btn.setAttribute("aria-selected", i === index ? "true" : "false");
      btn.setAttribute("tabindex", i === index ? "0" : "-1");
    });
    panelItems.forEach((panel, i) => panel.classList.toggle("is-active", i === index));
    if (nextButton) nextButton.disabled = index === buttonItems.length - 1 && !loopControls;
    if (previousButton) previousButton.disabled = index === 0 && !loopControls;
    if (focus) buttonItems[index].focus();
    const previousPanel = panelItems[activeIndex];
    const currentPanel = panelItems[index];
    const direction = activeIndex > index ? -1 : 1;

    if (animate && activeIndex !== index) {
      if (autoplayTl && !canPlay) autoplayTl.restart();
      animating = true;
      const tl = gsap.timeline({
        onComplete: () => {
          animating = false;
          if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
        },
        defaults: { duration },
      });
      if (slideTabs) {
        tl.set(currentPanel, { display: "block", position: "relative" });
        if (previousPanel) {
          tl.set(previousPanel, { position: "absolute", top: 0, left: 0, width: "100%" });
          tl.fromTo(previousPanel, { xPercent: 0 }, { xPercent: -120 * direction });
        }
        tl.fromTo(currentPanel, { xPercent: 120 * direction }, { xPercent: 0 }, "<");
        if (previousPanel) tl.set(previousPanel, { display: "none" });
      } else {
        if (previousPanel) {
          tl.to(previousPanel, { opacity: 0 });
          tl.set(previousPanel, { display: "none" });
        }
        tl.set(currentPanel, { display: "block" });
        tl.fromTo(currentPanel, { opacity: 0 }, { opacity: 1 });
      }
    } else {
      if (previousPanel) previousPanel.style.display = "none";
      if (currentPanel) currentPanel.style.display = "block";
    }
    buttonList.scrollTo({ left: buttonItems[index].offsetLeft, behavior: "smooth" });
    activeIndex = index;
  };

  makeActive(0, false, false);

  const updateIndex = (delta, focus = false) =>
    makeActive((activeIndex + delta + buttonItems.length) % buttonItems.length, focus, true);
  nextButton?.addEventListener("click", () => updateIndex(1));
  previousButton?.addEventListener("click", () => updateIndex(-1));

  buttonItems.forEach((btn, index) => {
    let tabId = tabWrap.getAttribute("data-tab-component-id");
    tabId = tabId ? tabId.toLowerCase().replaceAll(" ", "-") : componentIndex + 1;
    let itemId = btn.getAttribute("data-tab-item-id");
    itemId = itemId ? itemId.toLowerCase().replaceAll(" ", "-") : index + 1;

    btn.setAttribute("id", `tab-button-${tabId}-${itemId}`);
    btn.setAttribute("aria-controls", `tab-panel-${tabId}-${itemId}`);
    panelItems[index]?.setAttribute("id", `tab-panel-${tabId}-${itemId}`);
    panelItems[index]?.setAttribute("aria-labelledby", btn.id);

    // Deep link: ?tab-id=<tabId>-<itemId>
    if (new URLSearchParams(location.search).get("tab-id") === `${tabId}-${itemId}`) {
      makeActive(index);
      autoplay = 0;
      tabWrap.scrollIntoView({ behavior: "smooth", block: "start" });
      const url = new URL(location.href);
      url.searchParams.delete("tab-id");
      history.replaceState({}, "", url);
    }

    btn.addEventListener("click", () => makeActive(index));
    btn.addEventListener("keydown", (e) => {
      if (["ArrowRight", "ArrowDown"].includes(e.key)) updateIndex(1, true);
      else if (["ArrowLeft", "ArrowUp"].includes(e.key)) updateIndex(-1, true);
    });
  });

  if (autoplay === 0) return;

  autoplayTl = gsap.timeline({ repeat: -1 }).fromTo(
    tabWrap,
    { "--progress": 0 },
    {
      onComplete: () => updateIndex(1),
      "--progress": 1,
      ease: "none",
      duration: autoplay,
    }
  );
  onCleanup(() => autoplayTl.kill());

  let isHovered = false,
    hasFocusInside = false,
    prefersReducedMotion = false,
    inView = true;

  function updateAuto() {
    if (prefersReducedMotion || !inView || canPlay || isHovered || hasFocusInside) autoplayTl.pause();
    else autoplayTl.play();
  }

  function setButton() {
    canPlay = !canPlay;
    toggleButton?.setAttribute("aria-pressed", !canPlay ? "true" : "false");
    toggleButton?.classList.toggle("is-pressed", !canPlay);
    if (!canPlay) isHovered = hasFocusInside = prefersReducedMotion = false;
    updateAuto();
  }
  setButton();
  toggleButton?.addEventListener("click", setButton);

  function handleMotionChange(e) {
    prefersReducedMotion = e.matches;
    updateAuto();
    canPlay = !e.matches;
    setButton();
  }
  handleMotionChange(rmMQ);
  // Lives on window → removed on page leave via the page signal
  rmMQ.addEventListener("change", handleMotionChange, { signal });

  if (pauseOnHover) {
    tabWrap.addEventListener("mouseenter", () => {
      isHovered = true;
      updateAuto();
    });
    tabWrap.addEventListener("mouseleave", () => {
      hasFocusInside = false;
      isHovered = false;
      updateAuto();
    });
  }
  tabWrap.addEventListener("focusin", () => {
    hasFocusInside = true;
    updateAuto();
  });
  tabWrap.addEventListener("focusout", (e) => {
    if (!e.relatedTarget || !tabWrap.contains(e.relatedTarget)) {
      hasFocusInside = false;
      updateAuto();
    }
  });

  const io = new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    updateAuto();
  }, { threshold: 0 });
  io.observe(tabWrap);
  onCleanup(() => io.disconnect());
}

export default {
  name: "lumos-tabs",
  selector: ".tab_wrap",
  init({ elements, signal, onCleanup }) {
    elements.forEach((tabWrap, i) => initTab(tabWrap, i, { signal, onCleanup }));
  },
};