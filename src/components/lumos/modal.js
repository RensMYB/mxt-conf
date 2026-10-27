// ─── LUMOS MODAL ─────────────────────────
// Open from anywhere: window.lumos.modal.open("id") / .closeAll()

import { state } from "../../core/state.js";

function getModalSystem() {
  return ((window.lumos ??= {}).modal ??= {
    list: {},
    open(id) { this.list[id]?.open?.(); },
    closeAll() { Object.values(this.list).forEach((m) => m.close?.()); },
  });
}

function buildTimeline(modal, variant, onReverseComplete) {
  let tl;
  gsap.context(() => {
    tl = gsap.timeline({ paused: true, onReverseComplete });
    if (variant === "side-panel") {
      tl.fromTo(".modal_backdrop", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power1.out" });
      tl.from(".modal_content", { xPercent: 100, duration: 0.8, ease: "myb" }, "<");
    } else if (variant === "full-screen") {
      tl.set(".modal_backdrop", { opacity: 0 });
      tl.from(".modal_content", { opacity: 0, duration: 0.6, ease: "myb" });
      tl.from(".modal_slot", { opacity: 0, y: "2rem", duration: 0.6, ease: "myb" }, "<0.1");
    } else {
      tl.fromTo(".modal_backdrop", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" });
      tl.from(".modal_content", { opacity: 0, y: "6rem", duration: 0.4, ease: "myb" }, "<");
    }
  }, modal);
  return tl;
}

function initModal(modal, modalSystem, signal) {
  const modalId = modal.getAttribute("data-modal-target");
  const variant = modal.getAttribute("data-wf--modal--variant");
  let lastFocusedElement;

  const tl = buildTimeline(modal, variant, resetModal);

  function resetModal() {
    state.lenis?.start ? state.lenis.start() : (document.body.style.overflow = "");
    modal.close();
    lastFocusedElement?.focus();
    window.dispatchEvent(new CustomEvent("modal-close", { detail: { modal } }));
  }

  function openModal() {
    state.lenis?.stop ? state.lenis.stop() : (document.body.style.overflow = "hidden");
    lastFocusedElement = document.activeElement;
    modal.showModal();
    tl.play();
    modal.querySelectorAll("[data-modal-scroll]").forEach((el) => (el.scrollTop = 0));
    window.dispatchEvent(new CustomEvent("modal-open", { detail: { modal } }));
  }

  function closeModal() {
    tl.reverse();
  }

  // Deep link: ?modal-id=<id>
  if (new URLSearchParams(location.search).get("modal-id") === modalId) {
    openModal();
    const url = new URL(location.href);
    url.searchParams.delete("modal-id");
    history.replaceState({}, "", url);
  }

  // Listeners on the modal itself → removed with the container
  modal.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeModal();
  });
  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-modal-close]")) closeModal();
  });

  // Document-level trigger → removed via the page signal
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(`[data-modal-trigger='${modalId}'], a[href='#${modalId}']`);
    if (!trigger) return;
    if (trigger.tagName === "A") e.preventDefault();
    openModal();
  }, { signal });

  modalSystem.list[modalId] = { open: openModal, close: closeModal };
}

export default {
  name: "lumos-modal",
  selector: ".modal_dialog",
  init({ elements, signal }) {
    const modalSystem = getModalSystem();
    modalSystem.list = {};
    elements.forEach((modal) => initModal(modal, modalSystem, signal));
    // Don't leave the old page's modals registered on the next page
    return () => (modalSystem.list = {});
  },
};