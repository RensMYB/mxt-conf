// -----------------------------------------
// MAIN — the only file you touch to add a component
// -----------------------------------------
// 1. Import the component
// 2. Add it to registerComponents([...])
// The core handles the rest: it only runs when the selector is on the page,
// at the right Barba moment, and cleans up on page leave.

import "./core/gsap-setup.js";
import { registerComponents } from "./core/components.js";
import { initBarba } from "./core/barba.js";

// ── Headings ──
// import { headingsImmediate, headings } from "./components/headings.js";

// ── Lumos ──
import lumosTabs from "./components/lumos/tabs.js";
import lumosSlider from "./components/lumos/slider.js";
import lumosModal from "./components/lumos/modal.js";
import lumosDropdown from "./components/lumos/dropdown.js";
import lumosFormRange from "./components/lumos/form-range.js";
import lumosAccordion from "./components/lumos/accordion.js";

// ── Custom ──
import centeredSlider from "./components/centered-slider.js";
import { numberOdometerPrepare, numberOdometer } from "./components/odometer.js";
import vimeoPlayer from "./components/vimeo-player.js";
import parallax from "./components/parallax.js";
import logoTheme from "./components/logo-theme.js";
import staggerGrid from "./components/stagger-grid.js";
import blokks from "./components/blokks.js"; 
import flipCards from "./components/flip-cards.js";

registerComponents([
  // headingsImmediate,
  // headings,

  lumosTabs,
  lumosSlider,
  lumosModal,
  lumosDropdown,
  lumosFormRange,
  lumosAccordion,

  centeredSlider,
  numberOdometerPrepare,
  numberOdometer,
  vimeoPlayer,
  parallax,
  logoTheme,
  staggerGrid,
  blokks,
  flipCards
]);

initBarba({
  debug: true, // true while developing on staging
});