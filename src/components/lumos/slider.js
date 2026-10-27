// ─── LUMOS SLIDER (Swiper) ───────────────

import { prepareLumosSlot } from "../../core/helpers.js";

function initSwiper(component) {
  const swiperElement = component.querySelector(".slider_element");
  const swiperWrapper = component.querySelector(".slider_list");
  if (!swiperElement || !swiperWrapper) return null;

  prepareLumosSlot(swiperWrapper);
  [...swiperWrapper.children].forEach((el) => el.classList.add("swiper-slide"));

  const attr = (name) => swiperElement.getAttribute(name) === "True";

  return new Swiper(swiperElement, {
    slidesPerView: "auto",
    followFinger: attr("data-follow-finger"),
    loopAdditionalSlides: 10,
    freeMode: attr("data-free-mode"),
    slideToClickedSlide: attr("data-slide-to-clicked"),
    centeredSlides: false,
    autoHeight: false,
    speed: +swiperElement.getAttribute("data-speed") || 600,
    mousewheel: {
      enabled: attr("data-mousewheel"),
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
}

export default {
  name: "lumos-slider",
  // Skip sliders nested inside another slider
  selector: "[data-slider='component']:not([data-slider='component'] [data-slider='component'])",
  init({ elements }) {
    const swipers = elements.map(initSwiper).filter(Boolean);
    return () => swipers.forEach((s) => s.destroy(true, true));
  },
};