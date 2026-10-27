// ─── CENTERED SLIDER (Osmo) ──────────────
// Attributes in Webflow:
//   data-centered-slider="wrapper" | "slide" | "bullet" | "prev-button" | "next-button"
//   data-slider-autoplay="true"           → on the wrapper, enables autoplay
//   data-slider-autoplay-duration="4"     → seconds between slides
// Requires Draggable + InertiaPlugin (for drag/throw).

import { state, hasScrollTrigger } from "../core/state.js";
import { horizontalLoop } from "../lib/horizontal-loop.js";

const animVars = { ease: "osmo-ease", duration: 0.725 };

function initSlider(sliderWrapper, wrapperIndex, onCleanup) {

  const slides = gsap.utils.toArray(sliderWrapper.querySelectorAll('[data-centered-slider="slide"]'));
  const bullets = gsap.utils.toArray(sliderWrapper.querySelectorAll('[data-centered-slider="bullet"]'));
  const prevButton = sliderWrapper.querySelector('[data-centered-slider="prev-button"]');
  const nextButton = sliderWrapper.querySelector('[data-centered-slider="next-button"]');
  if (!slides.length) return;

  let activeElement;
  let activeBullet;
  let currentIndex = 0;
  let autoplay;

  const autoplayEnabled = sliderWrapper.getAttribute("data-slider-autoplay") === "true" && !state.reducedMotion;
  const autoplayDuration = autoplayEnabled
    ? parseFloat(sliderWrapper.getAttribute("data-slider-autoplay-duration")) || 0
    : 0;

  // Unique IDs per slider, so multiple sliders on one page don't collide
  const slideId = (i) => `centered-slide-${wrapperIndex}-${i}`;
  slides.forEach((slide, i) => slide.setAttribute("id", slideId(i)));

  function setActiveBullet(index) {
    if (!bullets.length) return;
    if (activeBullet) activeBullet.classList.remove("active");
    if (bullets[index]) {
      bullets[index].classList.add("active");
      activeBullet = bullets[index];
    }
    bullets.forEach((bullet, i) => {
      bullet.setAttribute("aria-selected", i === index ? "true" : "false");
    });
  }

  bullets.forEach((bullet, i) => bullet.setAttribute("aria-controls", slideId(i)));
  setActiveBullet(currentIndex);

  const loop = horizontalLoop(slides, {
    paused: true,
    draggable: true,
    center: true,
    onChange: (element, index) => {
      currentIndex = index;
      if (activeElement) activeElement.classList.remove("active");
      element.classList.add("active");
      activeElement = element;
      setActiveBullet(index);
    },
  });
  onCleanup(loop.cleanup);

  // On initialization, center the slider
  loop.toIndex(Math.min(2, slides.length - 1), { duration: 0.01 });

  function startAutoplay() {
    if (autoplayDuration > 0 && !autoplay) {
      const repeat = () => {
        loop.next(animVars);
        autoplay = gsap.delayedCall(autoplayDuration, repeat);
      };
      autoplay = gsap.delayedCall(autoplayDuration, repeat);
    }
  }

  function stopAutoplay() {
    if (autoplay) {
      autoplay.kill();
      autoplay = null;
    }
  }
  onCleanup(stopAutoplay);

  if (autoplayDuration > 0 && hasScrollTrigger) {
    // Start/stop autoplay based on viewport visibility
    // (killed automatically on page leave with the other ScrollTriggers)
    ScrollTrigger.create({
      trigger: sliderWrapper,
      start: "top bottom",
      end: "bottom top",
      onEnter: startAutoplay,
      onLeave: stopAutoplay,
      onEnterBack: startAutoplay,
      onLeaveBack: stopAutoplay,
    });

    sliderWrapper.addEventListener("mouseenter", stopAutoplay);
    sliderWrapper.addEventListener("mouseleave", () => {
      if (ScrollTrigger.isInViewport(sliderWrapper)) startAutoplay();
    });
  }

  slides.forEach((slide, i) => {
    slide.addEventListener("click", () => loop.toIndex(i, animVars));
  });

  bullets.forEach((bullet, i) => {
    bullet.addEventListener("click", () => {
      loop.toIndex(i, animVars);
      setActiveBullet(i);
    });
  });

  prevButton?.addEventListener("click", () => {
    loop.toIndex((currentIndex - 1 + slides.length) % slides.length, animVars);
  });

  nextButton?.addEventListener("click", () => {
    loop.toIndex((currentIndex + 1) % slides.length, animVars);
  });
}

export default {
  name: "centered-slider",
  selector: '[data-centered-slider="wrapper"]',
  init({ elements, onCleanup }) {
    elements.forEach((wrapper, i) => initSlider(wrapper, i, onCleanup));
  },
};