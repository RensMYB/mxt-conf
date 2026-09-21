// Entry point — boots smooth scroll and runs your components.
// GSAP and Lenis are loaded from the CDN (see Dependencies panel).

// import { initScroll } from "./utils/scroll.js";
import { hero } from "./components/hero.js";
import { reveal } from "./components/reveal.js";

gsap.registerPlugin(ScrollTrigger);

// Smooth scroll (auto-disables in the Webflow Editor)
// initScroll();

// Components — each one targets elements by data attribute.
// Add your own: create a file in components/, import it here, call it.
hero();
reveal();

// -----------------------------------------
// OSMO PAGE TRANSITION BOILERPLATE
// -----------------------------------------

gsap.registerPlugin(CustomEase);
if (typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);
if (typeof SplitText !== "undefined") gsap.registerPlugin(SplitText);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;
let isFirstLoad = true;

// When the page actually becomes visible during the enter animation. Keep this
// in sync with the "startEnter" label in runPageEnterAnimation so immediate
// (above-the-fold) heading reveals land together with the page, not before it.
const ENTER_REVEAL_DELAY = 1.2;

// Lumos Tab timeline
let activeTimelines = [];
// Lumos Swiper
let activeSwipers = [];
// Lumos modal
let modalAbortController = null;
// Lumos Dropdown
let dropdownAbortController = null;
// SplitText heading reveals
let activeSplits = [];

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));
rmMQ.addListener?.(e => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.8;

CustomEase.create("myb", "M0,0 C0.03,0 0.08,0.02 0.12,0.08 C0.18,0.2 0.2099,0.5054 0.2699,0.8554 C0.3099,1.0554 0.38,1.12 0.45,1.08 C0.52,1.02 0.5902,0.9732 0.6902,0.9932 C0.7902,1.0132 0.9,1 1,1")
CustomEase.create("page-transition", "0.34, 1.1, 0.5, 1");
gsap.defaults({ ease: "myb", duration: durationDefault });

// -----------------------------------------

// FUNCTION REGISTRY
// -----------------------------------------

function initOnceFunctions() {
  initLenis();
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  // Runs once on first load
  // if (has('[data-something]')) initSomething();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  // Runs before the enter animation
  // Hide headings now so they don't flash before the split runs in afterEnter
  if (has("[data-split]")) {
    hideHeadings();
    // Above-the-fold headings reveal in sync with the page enter, so split +
    // reveal them now instead of waiting for afterEnter (which lands ~0.8s
    // after the page is already visible).
    initImmediateHeadings();
  }
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  // Runs after enter animation completes
  // if (has('[data-something]')) initSomething();

  // ── Headings reveal ──
  if (has("[data-split]")) initHeadings();

  // ── Lumos components ──
  if (has(".tab_wrap")) initTabs();
  if (has("[data-slider='component']")) initSlider();
  if (has(".modal_dialog")) initModals();
  if (has(".dropdown_wrap")) initDropdowns();
  if (has(".form_range_wrap")) initFormRange();
  if (has(".accordion_wrap")) initAccordions();

  // ── Finsweet Attributes (list-filter/sort/load) ──
  if (has("[fs-list-element]")) initFinsweetList();


  if (hasLenis) {
    lenis.resize();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
}

// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(() => {
    resetPage(next)
    scrollToInitialHash(next);
  }, null, 0);

  return tl;
}

function runPageLeaveAnimation(current, next) {
  const transitionWrap = document.querySelector('[data-transition-wrap]');
  const transitionPanel = transitionWrap.querySelector("[data-transition-panel]");

  const tl = gsap.timeline({
    onComplete: () => { current.remove() }
  });

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.set(transitionPanel, {
    autoAlpha: 1
  }, 0);

  tl.set(next, {
    autoAlpha: 0
  }, 0);

  tl.fromTo(transitionPanel, {
    yPercent: 0
  }, {
    yPercent: -100,
    duration: 0.6,
    ease: "page-transition",
  }, 0);

  tl.fromTo(current, {
    y: "0vh"
  }, {
    y: "-15vh",
    duration: 0.6,
    ease: "page-transition",
  }, 0);

  return tl;
}

function runPageEnterAnimation(next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionPanel = transitionWrap.querySelector("[data-transition-panel]");

  const tl = gsap.timeline();

  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady")
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 1.1);

  tl.set(next, {
    autoAlpha: 1,
  }, "startEnter");

  tl.fromTo(transitionPanel, {
    yPercent: -100,
  }, {
    yPercent: -200,
    duration: 0.8,
    ease: "page-transition",
    overwrite: "auto",
    immediateRender: false
  }, "startEnter");

  tl.set(transitionPanel, {
    autoAlpha: 0
  }, ">");

  tl.from(next, {
    y: "15vh",
    duration: 1,
    ease: "elastic.out(1, 0.45)",
  }, "startEnter");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}

// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.beforeEnter(data => {
  // Position new container on top
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if (hasScrollTrigger) {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }

  //Cleanup functions Lumos Tab, Slider, Modal, Dropdown
  activeTimelines.forEach(tl => tl.kill());
  activeTimelines = [];
  activeSplits.forEach(s => s.revert());
  activeSplits = [];
  activeSwipers.forEach(s => s.destroy(true, true));
  activeSwipers = [];
  if (modalAbortController) {
    modalAbortController.abort();
    modalAbortController = null;
  }
  if (dropdownAbortController) {
    dropdownAbortController.abort();
    dropdownAbortController = null;
  }
});

barba.hooks.afterEnter(data => {
  // Nav lives inside the container and changes per page, so Webflow's native
  // interactions (hamburger menu, dropdowns) must be re-bound on the new DOM.
  resetWebflow(data);

  // Run page functions
  initAfterEnterFunctions(data.next.container);

  // First load is done; subsequent navigations run the full enter animation,
  // so immediate headings must wait for the page to appear (ENTER_REVEAL_DELAY).
  isFirstLoad = false;

  // Settle
  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
});

barba.init({
  debug: true, // Set to 'false' in production
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,

      // First load
      async once(data) {
        initOnceFunctions();

        return runPageOnceAnimation(data.next.container);
      },

      // Current page leaves
      async leave(data) {
        return runPageLeaveAnimation(data.current.container, data.next.container);
      },

      // New page enters
      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      }
    }],
});

// -----------------------------------------
// GENERIC + HELPERS
// -----------------------------------------

const themeConfig = {
  light: {
    nav: "dark",
    transition: "light"
  },
  dark: {
    nav: "light",
    transition: "dark"
  }
};

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;
  const transitionEl = document.querySelector('[data-theme-transition]');
  if (transitionEl) {
    transitionEl.dataset.themeTransition = config.transition;
  }

  const nav = document.querySelector('[data-theme-nav]');
  if (nav) {
    nav.dataset.themeNav = config.nav;
  }
}

function initLenis() {
  if (lenis) return; // already created
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.165,
    wheelMultiplier: 1.25,
  });

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth,
    timer;
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

// Re-initialise Webflow on the new page so native components (nav/hamburger,
// dropdowns, forms) and IX2 interactions are bound to the freshly swapped DOM.
// Required because the nav lives inside the Barba container and is replaced on
// every navigation. Note: previously a persistent nav was kept in sync via a
// manual aria-current/class patch; that's now redundant since the whole nav
// arrives from the server HTML with the correct state already applied.
function resetWebflow(data) {
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

function scrollToInitialHash(container = document) {
  const hash = window.location.hash;
  if (!hash || hash === "#") return;
  const target = container.querySelector(hash) || document.querySelector(hash);
  if (!target) return;
  // Reduced motion: jump
  if (reducedMotion) {
    target.scrollIntoView();
    return;
  }
  // Smooth: Lenis if available, else native smooth
  if (hasLenis && lenis) {
    lenis.scrollTo(target, {
      offset: 0,
      duration: 1,
      immediate: false,
      lock: true,
    });
  } else {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// -----------------------------------------
// YOUR FUNCTIONS GO BELOW HERE
// -----------------------------------------

// ─── HEADINGS (SplitText reveal) ─────────
// Opt-in via attributes in Webflow:
//   data-split            → "lines" (default) | "words" | "chars"
//   data-split-duration   → seconds (default 0.8)
//   data-split-stagger    → seconds between parts (default 0.08)
//   data-split-immediate  → "true" for above-the-fold headings (e.g. hero h1).
//                            Skips the ScrollTrigger "top 85%" gate AND turns
//                            off autoSplit, so the split happens synchronously
//                            against whatever font is rendered right now
//                            (fallback or webfont) instead of waiting on
//                            document.fonts.ready before the first paint of
//                            the reveal. Use this for content visible on
//                            first paint; leave it off for anything below
//                            the fold that should still re-split on resize.

function hideHeadings() {
  // Only hide when we'll actually animate; reduced motion / no plugin stays visible.
  if (reducedMotion || typeof SplitText === "undefined" || !hasScrollTrigger) return;
  gsap.set(nextPage.querySelectorAll("[data-split]"), { autoAlpha: 0 });
}

// Split a single heading and build its reveal. Shared by both entry points so
// immediate (beforeEnter) and scroll-gated (afterEnter) headings behave the same.
function splitHeading(heading) {
  const requested = heading.getAttribute("data-split");
  const type = ["words", "chars", "lines"].includes(requested) ? requested : "lines";
  const immediate = heading.getAttribute("data-split-immediate") === "true";

  // Reduced motion: skip the reveal, just show the heading.
  if (reducedMotion || typeof SplitText === "undefined" || !hasScrollTrigger) {
    gsap.set(heading, { autoAlpha: 1 });
    return;
  }

  const duration = Number(heading.getAttribute("data-split-duration")) || 0.8;
  const stagger = Number(heading.getAttribute("data-split-stagger")) || 0.08;
  // First paint has no enter animation, so immediate headings reveal right away;
  // on navigation, hold the reveal until the page is on screen (startEnter).
  const delay = immediate && !isFirstLoad ? ENTER_REVEAL_DELAY : 0;

  const split = SplitText.create(heading, {
    type,
    mask: type, // overflow-clip wrapper per part for a clean reveal
    // Below the fold: keep autoSplit on so it re-splits after webfont
    // swap / resize, and keep the ScrollTrigger gate.
    // Above the fold (immediate): split synchronously right now, against
    // whatever font is currently rendered, and skip the scroll gate since
    // the heading is already in view on page load.
    autoSplit: !immediate,
    onSplit(self) {
      return gsap.from(self[type], {
        yPercent: 110,
        autoAlpha: 0,
        duration,
        // ease: "myb",
        stagger,
        delay,
        ...(immediate
          ? {}
          : {
            scrollTrigger: {
              trigger: heading,
              start: "top 85%",
              once: true,
            },
          }),
      });
    },
  });

  activeSplits.push(split);

  // Split has set the parts to their hidden start state; now reveal the parent
  // (it was hidden in beforeEnter to prevent the flash).
  gsap.set(heading, { autoAlpha: 1 });
}

// beforeEnter: above-the-fold headings only, so their reveal can ride along with
// the page enter instead of waiting for afterEnter.
function initImmediateHeadings() {
  nextPage
    .querySelectorAll("[data-split][data-split-immediate='true']")
    .forEach(splitHeading);
}

// afterEnter: everything else, once layout is settled so ScrollTrigger measures
// correctly. Immediate headings were already handled in beforeEnter.
function initHeadings() {
  nextPage
    .querySelectorAll("[data-split]:not([data-split-immediate='true'])")
    .forEach(splitHeading);
}

// -----------------------------------------
// LUMOS COMPONENTS
// -----------------------------------------

// ─── TABS ────────────────────────────────
// Data attributes on .tab_wrap:
//   data-autoplay-duration, data-duration,
//   data-slide-tabs, data-loop-controls,
//   data-pause-on-hover, data-tab-component-id

function initTabs() {
  nextPage.querySelectorAll(".tab_wrap").forEach((tabWrap, componentIndex) => {

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

    function flattenDisplayContents(slot) {
      if (!slot) return;
      let child = slot.firstElementChild;
      while (child && child.classList.contains("u-display-contents")) {
        while (child.firstChild) {
          slot.insertBefore(child.firstChild, child);
        }
        slot.removeChild(child);
        child = slot.firstElementChild;
      }
    }
    flattenDisplayContents(buttonList);
    flattenDisplayContents(panelList);

    function removeCMSList(slot) {
      const dynList = Array.from(slot.children).find((child) => child.classList.contains(
        "w-dyn-list"));
      if (!dynList) return;
      const nestedItems = dynList?.querySelector(".w-dyn-items")?.children;
      if (!nestedItems) return;
      const staticWrapper = [...slot.children];
      [...nestedItems].forEach(el => {
        const c = [...el.children].find(c => !c.classList
          .contains('w-condition-invisible'));
        c && slot.appendChild(c);
      });
      staticWrapper.forEach((el) => el.remove());
    }
    removeCMSList(buttonList);
    removeCMSList(panelList);

    let buttonItems = Array.from(buttonList.children);
    let panelItems = Array.from(panelList.children);

    if (!buttonList || !panelList || !buttonItems.length || !panelItems.length) {
      console.warn("Missing elements in:", tabWrap);
      return;
    }

    panelItems.forEach((panel) => {
      panel.style.display = "none";
      panel.setAttribute("role", "tabpanel");
    });
    buttonItems.forEach((button) => { button.setAttribute("role", "tab"); });

    panelList.removeAttribute("role");
    buttonList.setAttribute("role", "tablist");
    buttonItems.forEach((btn) => btn.setAttribute("role", "tab"));
    panelItems.forEach((panel) => panel.setAttribute("role", "tabpanel"));

    let activeIndex = 0;
    const makeActive = (index, focus = false, animate = true, pause = true) => {
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
      let direction = 1;
      if (activeIndex > index) direction = -1;

      if (typeof gsap !== "undefined" && animate && activeIndex !== index) {
        if (autoplayTl && !canPlay && typeof autoplayTl.restart === "function") {
          autoplayTl.restart();
        }
        animating = true;
        let tl = gsap.timeline({
          onComplete: () => {
            animating = false;
            if (
              typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
          },
          defaults: {
            duration: duration,
            // ease: "power1.out" 
          }
        });
        if (slideTabs) {
          tl.set(currentPanel, { display: "block", position: "relative" });
          if (previousPanel) tl.set(previousPanel, {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%"
          });
          if (previousPanel) tl.fromTo(previousPanel, { xPercent: 0 }, {
            xPercent: -120 *
              direction
          });
          tl.fromTo(currentPanel, { xPercent: 120 * direction }, { xPercent: 0 }, "<");
          if (previousPanel) tl.set(previousPanel, { display: "none" });
        } else {
          if (previousPanel) tl.to(previousPanel, { opacity: 0 });
          if (previousPanel) tl.set(previousPanel, { display: "none" });
          tl.set(currentPanel, { display: "block" });
          tl.fromTo(currentPanel, { opacity: 0 }, { opacity: 1 });
        }
      } else {
        if (previousPanel) previousPanel.style.display = "none";
        if (currentPanel) currentPanel.style.display = "block";
      }
      buttonList.scrollTo({ left: buttonItems[index].offsetLeft, behavior: 'smooth' });
      activeIndex = index;
    };

    makeActive(0, false, false);

    const updateIndex = (delta, focus = false, pause = true) => makeActive((activeIndex +
      delta + buttonItems.length) % buttonItems.length, focus, true, pause);
    nextButton?.addEventListener("click", () => updateIndex(1));
    previousButton?.addEventListener("click", () => updateIndex(-1));

    buttonItems.forEach((btn, index) => {
      let tabId = tabWrap.getAttribute("data-tab-component-id");
      tabId = tabId ? tabId.toLowerCase().replaceAll(" ", "-") : componentIndex + 1;
      let itemId = btn.getAttribute("data-tab-item-id");
      itemId = itemId ? itemId.toLowerCase().replaceAll(" ", "-") : index + 1;

      btn.setAttribute("id", "tab-button-" + tabId + "-" + itemId);
      btn.setAttribute("aria-controls", "tab-panel-" + tabId + "-" + itemId);
      panelItems[index]?.setAttribute("id", "tab-panel-" + tabId + "-" + itemId);
      panelItems[index]?.setAttribute("aria-labelledby", btn.id);

      if (new URLSearchParams(location.search).get("tab-id") === tabId + "-" + itemId)
        makeActive(index), autoplay = 0, tabWrap.scrollIntoView({
          behavior: "smooth",
          block: "start"
        }), history.replaceState({}, "", ((u) => (u.searchParams.delete(
          "tab-id"), u))(new URL(location.href)));
      btn.addEventListener("click", () => makeActive(index));
      btn.addEventListener("keydown", (e) => {
        if (["ArrowRight", "ArrowDown"].includes(e.key)) updateIndex(1, true);
        else if (["ArrowLeft", "ArrowUp"].includes(e.key)) updateIndex(-1, true);
      });
    });

    if (autoplay !== 0 && typeof gsap !== "undefined") {
      autoplayTl = gsap.timeline({ repeat: -1 }).fromTo(
        tabWrap, { "--progress": 0 }, {
        onComplete: () => updateIndex(1, false,
          false),
        "--progress": 1,
        ease: "none",
        duration: autoplay
      });
      activeTimelines.push(autoplayTl);
      let isHovered = false,
        hasFocusInside = false,
        prefersReducedMotion = false,
        inView = true;

      function updateAuto() {
        if (prefersReducedMotion || !inView || canPlay || isHovered ||
          hasFocusInside) autoplayTl.pause();
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
      toggleButton?.addEventListener("click", function () {
        setButton();
      });

      function handleMotionChange(e) {
        prefersReducedMotion = e.matches;
        updateAuto();
        canPlay = !e.matches;
        setButton();
      }
      handleMotionChange(window.matchMedia("(prefers-reduced-motion: reduce)"));
      window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change",
        handleMotionChange);
      if (pauseOnHover) tabWrap.addEventListener("mouseenter", () => {
        isHovered = true;
        updateAuto();
      });
      if (pauseOnHover) tabWrap.addEventListener("mouseleave", () => {
        hasFocusInside = false;
        isHovered = false;
        updateAuto();
      });
      tabWrap.addEventListener("focusin", () => {
        hasFocusInside = true;
        updateAuto();
      });
      tabWrap.addEventListener("focusout", e => {
        if (!e.relatedTarget || !tabWrap.contains(e
          .relatedTarget)) {
          hasFocusInside = false;
          updateAuto();
        }
      });
      new IntersectionObserver(e => {
        inView = e[0].isIntersecting;
        updateAuto();
      }, { threshold: 0 }).observe(tabWrap);
    }
  });
}

// ─── SLIDER ──────────────────────────────

function initSlider() {
  nextPage.querySelectorAll(
    "[data-slider='component']:not([data-slider='component'] [data-slider='component'])").forEach(
      (component) => {
        const swiperElement = component.querySelector(".slider_element");
        const swiperWrapper = component.querySelector(".slider_list");
        if (!swiperElement || !swiperWrapper) return;

        function flattenDisplayContents(slot) {
          if (!slot) return;
          let child = slot.firstElementChild;
          while (child && child.classList.contains("u-display-contents")) {
            while (child.firstChild) {
              slot.insertBefore(child.firstChild, child);
            }
            slot.removeChild(child);
            child = slot.firstElementChild;
          }
        }
        flattenDisplayContents(swiperWrapper);

        function removeCMSList(slot) {
          const dynList = Array.from(slot.children).find((child) => child.classList.contains(
            "w-dyn-list"));
          if (!dynList) return;
          const nestedItems = dynList?.querySelector(".w-dyn-items")?.children;
          if (!nestedItems) return;
          const staticWrapper = [...slot.children];
          [...nestedItems].forEach(el => {
            const c = [...el.children].find(c => !c.classList
              .contains('w-condition-invisible'));
            c && slot.appendChild(c);
          });
          staticWrapper.forEach((el) => el.remove());
        }
        removeCMSList(swiperWrapper);
        [...swiperWrapper.children].forEach((el) => el.classList.add("swiper-slide"));

        const followFinger = swiperElement.getAttribute("data-follow-finger") === "True",
          freeMode = swiperElement.getAttribute("data-free-mode") === "True",
          mousewheel = swiperElement.getAttribute("data-mousewheel") === "True",
          slideToClickedSlide = swiperElement.getAttribute("data-slide-to-clicked") === "True",
          speed = +swiperElement.getAttribute("data-speed") || 600;

        const swiper = new Swiper(swiperElement, {
          slidesPerView: "auto",
          followFinger: followFinger,
          loopAdditionalSlides: 10,
          freeMode: freeMode,
          slideToClickedSlide: slideToClickedSlide,
          centeredSlides: false,
          autoHeight: false,
          speed: speed,
          mousewheel: {
            enabled: mousewheel,
            forceToAxis: true,
          },
          keyboard: {
            enabled: true,
            onlyInViewport: true,
          },
          navigation: {
            nextEl: component.querySelector("[data-slider='next']"),
            prevEl: component.querySelector("[data-slider='previous']"),
          },
          pagination: {
            el: component.querySelector(".slider_bullet_list"),
            bulletActiveClass: "is-active",
            bulletClass: "slider_bullet_item",
            bulletElement: "button",
            clickable: true,
          },
          slideActiveClass: "is-active",
          slideDuplicateActiveClass: "is-active",
        });

        activeSwipers.push(swiper);
      });
}

// ─── MODALS ──────────────────────────────

function initModals() {
  const modalSystem = ((window.lumos ??= {}).modal ??= {
    list: {},
    open(id) { this.list[id]?.open?.(); },
    closeAll() { Object.values(this.list).forEach((m) => m.close?.()); },
  });

  // Clear old modal registrations
  modalSystem.list = {};

  // Abort previous document-level listeners
  if (modalAbortController) modalAbortController.abort();
  modalAbortController = new AbortController();
  const signal = modalAbortController.signal;

  nextPage.querySelectorAll(".modal_dialog").forEach(function (modal) {
    const modalId = modal.getAttribute("data-modal-target");
    const variant = modal.getAttribute("data-wf--modal--variant");
    let lastFocusedElement;

    if (typeof gsap !== "undefined") {
      gsap.context(() => {
        let tl = gsap.timeline({ paused: true, onReverseComplete: resetModal });
        if (variant === "side-panel") {
          tl.fromTo(".modal_backdrop", { opacity: 0 }, {
            opacity: 1,
            duration: 0.4,
            ease: "power1.out"
          });
          tl.from(".modal_content", { xPercent: 100, duration: 0.8, ease: "myb" },
            "<");
        } else if (variant === "full-screen") {
          tl.set(".modal_backdrop", { opacity: 0 });
          tl.from(".modal_content", { opacity: 0, duration: 0.6, ease: "myb" });
          tl.from(".modal_slot", {
            opacity: 0,
            y: "2rem",
            duration: 0.6,
            ease: "myb"
          }, "<0.1");
        } else {
          tl.fromTo(".modal_backdrop", { opacity: 0 }, {
            opacity: 1,
            duration: 0.3,
            ease: "power1.out"
          });
          tl.from(".modal_content", {
            opacity: 0,
            y: "6rem",
            duration: 0.4,
            ease: "myb"
          }, "<");
        }
        modal.tl = tl;
      }, modal);
    }

    function resetModal() {
      lenis?.start ? lenis.start() : (document.body.style.overflow = "");
      modal.close();
      if (lastFocusedElement) lastFocusedElement.focus();
      window.dispatchEvent(new CustomEvent("modal-close", { detail: { modal } }));
    }

    function openModal() {
      lenis?.stop ? lenis.stop() : (document.body.style.overflow = "hidden");
      lastFocusedElement = document.activeElement;
      modal.showModal();
      if (typeof gsap !== "undefined") modal.tl.play();
      modal.querySelectorAll("[data-modal-scroll]").forEach((el) => (el.scrollTop = 0));
      window.dispatchEvent(new CustomEvent("modal-open", { detail: { modal } }));
    }

    function closeModal() {
      typeof gsap !== "undefined" ? modal.tl.reverse() : resetModal();
    }

    if (new URLSearchParams(location.search).get("modal-id") === modalId) openModal(), history
      .replaceState({}, "", ((u) => (u.searchParams.delete("modal-id"), u))(new URL(location
        .href)));

    // Listeners op modal zelf — worden automatisch opgeruimd als Barba het element verwijdert
    modal.addEventListener("cancel", (e) => (e.preventDefault(), closeModal()));
    modal.addEventListener("click", (e) => e.target.closest("[data-modal-close]") &&
      closeModal());

    // Document-level trigger listener — wordt opgeruimd via AbortController
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest(
        `[data-modal-trigger='${modalId}'], a[href='#${modalId}']`);
      if (!trigger) return;
      if (trigger.tagName === "A") e.preventDefault();
      openModal();
    }, { signal });

    modalSystem.list[modalId] = { open: openModal, close: closeModal };
  });
}

// ─── DROPDOWNS ───────────────────────────

function initDropdowns() {
  if (dropdownAbortController) dropdownAbortController.abort();
  dropdownAbortController = new AbortController();
  const signal = dropdownAbortController.signal;

  nextPage.querySelectorAll(".dropdown_wrap").forEach((component, index) => {
    const button = component.querySelector(".dropdown_toggle_clickable");
    const content = component.querySelector(".dropdown_content");
    const variant = component.getAttribute("data-wf--dropdown--variant");

    button.setAttribute("id", `dropdown-btn-${index}`);
    button.setAttribute("aria-controls", `dropdown-${index}`);
    content.setAttribute("id", `dropdown-${index}`);
    content.setAttribute("aria-labelledby", `dropdown-btn-${index}`);

    function openDropdown() {
      button.setAttribute("aria-expanded", "true");
      component.classList.add("is-active");
      let tl = gsap.timeline({
        onComplete: () => {
          if (typeof ScrollTrigger !== "undefined")
            ScrollTrigger.refresh();
        }
      });
      tl.set(content, { display: "block" });
      tl.fromTo(content, { height: 0 }, {
        height: "auto",
        ease: "myb",
        duration: 0.6
      });
    }

    function closeDropdown() {
      button.setAttribute("aria-expanded", "false");
      component.classList.remove("is-active");
      let tl = gsap.timeline({
        onComplete: () => {
          if (typeof ScrollTrigger !== "undefined")
            ScrollTrigger.refresh();
        }
      });
      tl.to(content, { height: 0, ease: "myb", duration: 0.4 });
      tl.set(content, { display: "none" });
    }

    function isOpen() {
      return button.getAttribute("aria-expanded") === "true";
    }

    // Op het element zelf — automatisch weg bij Barba-swap
    button.addEventListener("click", () => {
      isOpen() ? closeDropdown() : openDropdown();
    });

    if (component.getAttribute("data-open-on-hover-in") === "True") {
      component.addEventListener("mouseenter", () => {
        if (!isOpen()) openDropdown();
      });
    }

    if (component.getAttribute("data-close-on-hover-out") === "True") {
      component.addEventListener("mouseleave", () => {
        if (isOpen()) closeDropdown();
      });
    }

    // Document-level — opgeruimd via AbortController
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) {
        closeDropdown();
        button.focus();
      }
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && isOpen() && component.contains(
        document.activeElement)) {
        e.preventDefault();
        const items = [...content.querySelectorAll("a, button")];
        if (items.length === 0) return;
        const currentIndex = items.indexOf(document.activeElement);
        let nextIndex;
        if (currentIndex === -1) {
          nextIndex = e.key === "ArrowDown" ? 0 : items.length - 1;
        } else {
          nextIndex = (currentIndex + (e.key === "ArrowDown" ? 1 : -1) + items.length) %
            items.length;
        }
        items[nextIndex].focus();
      }
    }, { signal });

    document.addEventListener("click", (e) => {
      if (isOpen() && !component.contains(e.target)) closeDropdown();
    }, { signal });
  });
}

// ─── FORM RANGE ──────────────────────────

function initFormRange() {
  nextPage.querySelectorAll(".form_range_wrap").forEach((component) => {
    const input = component.querySelector("input[type='range']");
    const output = component.querySelector(".form_range_output_value");

    const update = () => {
      const min = input.min ? +input.min : 0;
      const max = input.max ? +input.max : 100;
      const val = +input.value || min;
      const progress = (val - min) / (max - min);
      component.style.setProperty("--progress", progress);
      if (output) output.textContent = val;
    };

    input.addEventListener("input", update);
    update();
  });
}

// ─── ACCORDIONS ──────────────────────────

function initAccordions() {
  nextPage.querySelectorAll(".accordion_wrap").forEach((component, listIndex) => {
    const closePrevious = component.getAttribute("data-close-previous") !== "False";
    const closeOnSecondClick = component.getAttribute("data-close-on-second-click") !== "False";
    const openOnHover = component.getAttribute("data-open-on-hover") === "True";
    const openByDefault = component.getAttribute("data-open-by-default") !== null && !isNaN(+
      component.getAttribute("data-open-by-default")) ? +component.getAttribute(
        "data-open-by-default") : false;
    const list = component.querySelector(".accordion_list");
    let previousIndex = null,
      closeFunctions = [];

    function flattenDisplayContents(slot) {
      if (!slot) return;
      let child = slot.firstElementChild;
      while (child && child.classList.contains("u-display-contents")) {
        while (child.firstChild) {
          slot.insertBefore(child.firstChild, child);
        }
        slot.removeChild(child);
        child = slot.firstElementChild;
      }
    }
    flattenDisplayContents(list);

    function removeCMSList(slot) {
      const dynList = Array.from(slot.children).find((child) => child.classList.contains(
        "w-dyn-list"));
      if (!dynList) return;
      const nestedItems = dynList?.querySelector(".w-dyn-items")?.children;
      if (!nestedItems) return;
      const staticWrapper = [...slot.children];
      [...nestedItems].forEach(el => {
        const c = [...el.children].find(c => !c.classList
          .contains('w-condition-invisible'));
        c && slot.appendChild(c);
      });
      staticWrapper.forEach((el) => el.remove());
    }
    removeCMSList(list);

    component.querySelectorAll(".accordion_component").forEach((card, cardIndex) => {
      const button = card.querySelector(".accordion_toggle_button");
      const content = card.querySelector(".accordion_content_wrap");
      if (!button || !content) return console.warn("Missing elements:", card);

      content.removeAttribute("style");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("id", "accordion_button_" + listIndex + "_" + cardIndex);
      content.setAttribute("id", "accordion_content_" + listIndex + "_" + cardIndex);
      button.setAttribute("aria-controls", content.id);
      content.setAttribute("aria-labelledby", button.id);
      content.style.display = "none";

      const refresh = () => {
        tl.invalidate();
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
      };

      const tl = gsap.timeline({
        paused: true,
        defaults: {
          duration: 0.6,
          ease: "myb"
        },
        onComplete: refresh,
        onReverseComplete: refresh
      });
      tl.set(content, { display: "block" });
      tl.fromTo(content, { height: 0 }, { height: "auto" });

      const closeAccordion = () => card.classList.contains("is-active") && (card.classList
        .remove("is-active"), tl.reverse(), button.setAttribute("aria-expanded", "false"));
      closeFunctions[cardIndex] = closeAccordion;

      const openAccordion = (instant = false) => {
        if (closePrevious && previousIndex !== null && previousIndex !== cardIndex)
          closeFunctions[previousIndex]?.();
        previousIndex = cardIndex;
        button.setAttribute("aria-expanded", "true");
        card.classList.add("is-active");
        instant ? tl.progress(1) : tl.play();
      };

      if (openByDefault === cardIndex + 1) openAccordion(true);
      button.addEventListener("click", () => (card.classList.contains("is-active") &&
        closeOnSecondClick ? (closeAccordion(), (previousIndex = null)) :
        openAccordion()));
      if (openOnHover) button.addEventListener("mouseenter", () => openAccordion());
    });
  });
}

