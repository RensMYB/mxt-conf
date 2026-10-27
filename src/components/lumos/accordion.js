// ─── LUMOS ACCORDION ─────────────────────
// Data attributes on .accordion_wrap:
//   data-close-previous, data-close-on-second-click,
//   data-open-on-hover, data-open-by-default (1-based index)

import { prepareLumosSlot } from "../../core/helpers.js";

function initAccordionList(component, listIndex) {
  const closePrevious = component.getAttribute("data-close-previous") !== "False";
  const closeOnSecondClick = component.getAttribute("data-close-on-second-click") !== "False";
  const openOnHover = component.getAttribute("data-open-on-hover") === "True";
  const defaultAttr = component.getAttribute("data-open-by-default");
  const openByDefault = defaultAttr !== null && !isNaN(+defaultAttr) ? +defaultAttr : false;

  prepareLumosSlot(component.querySelector(".accordion_list"));

  let previousIndex = null;
  const closeFunctions = [];

  component.querySelectorAll(".accordion_component").forEach((card, cardIndex) => {
    const button = card.querySelector(".accordion_toggle_button");
    const content = card.querySelector(".accordion_content_wrap");
    if (!button || !content) return console.warn("Missing elements:", card);

    content.removeAttribute("style");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("id", `accordion_button_${listIndex}_${cardIndex}`);
    content.setAttribute("id", `accordion_content_${listIndex}_${cardIndex}`);
    button.setAttribute("aria-controls", content.id);
    content.setAttribute("aria-labelledby", button.id);
    content.style.display = "none";

    const refresh = () => {
      tl.invalidate();
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    };

    const tl = gsap.timeline({
      paused: true,
      defaults: { duration: 0.6, ease: "myb" },
      onComplete: refresh,
      onReverseComplete: refresh,
    });
    tl.set(content, { display: "block" });
    tl.fromTo(content, { height: 0 }, { height: "auto" });

    const closeAccordion = () => {
      if (!card.classList.contains("is-active")) return;
      card.classList.remove("is-active");
      tl.reverse();
      button.setAttribute("aria-expanded", "false");
    };
    closeFunctions[cardIndex] = closeAccordion;

    const openAccordion = (instant = false) => {
      if (closePrevious && previousIndex !== null && previousIndex !== cardIndex) {
        closeFunctions[previousIndex]?.();
      }
      previousIndex = cardIndex;
      button.setAttribute("aria-expanded", "true");
      card.classList.add("is-active");
      instant ? tl.progress(1) : tl.play();
    };

    if (openByDefault === cardIndex + 1) openAccordion(true);

    button.addEventListener("click", () => {
      if (card.classList.contains("is-active") && closeOnSecondClick) {
        closeAccordion();
        previousIndex = null;
      } else {
        openAccordion();
      }
    });
    if (openOnHover) button.addEventListener("mouseenter", () => openAccordion());
  });
}

export default {
  name: "lumos-accordion",
  selector: ".accordion_wrap",
  init({ elements }) {
    elements.forEach(initAccordionList);
  },
};