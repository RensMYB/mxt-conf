// ─── LOGO THEME ──────────────────────────
// Switches the logo to black or white depending on the section behind it.
// The section the logo starts in (the header) is left alone: there the logo
// keeps its default colour from CSS.
//
// Webflow:
//   data-theme-logo                  → on the logo link(s) in the nav
//   <section class="u-theme-light">  → sets data-logo-theme="light" (black)
//   <section class="u-theme-dark">   → sets data-logo-theme="dark"  (white)
//
// The nav lives outside the Barba container (it persists between pages), so
// this component is triggered by the sections on the page and finds the logo
// in the whole document.

const LOGO_SELECTOR = "[data-theme-logo]";

export default {
  name: "logo-theme",
  selector: "section.u-theme-light, section.u-theme-dark",
  init({ elements: sections, onCleanup }) {
    const logos = document.querySelectorAll(LOGO_SELECTOR);
    if (!logos.length) return;

    logos.forEach((logo) => {
      // Start every page with the default colour
      logo.removeAttribute("data-logo-theme");

      // The logo's vertical centre on screen is the switch line
      const line = () => {
        const rect = logo.getBoundingClientRect();
        return rect.top + rect.height / 2;
      };

      sections.forEach((section) => {
        // Does this section already sit behind the logo at the top of the page?
        const startsUnderLogo = section.getBoundingClientRect().top + window.scrollY <= line();
        const theme = section.classList.contains("u-theme-dark") ? "dark" : "light";

        ScrollTrigger.create({
          trigger: section,
          start: () => `top ${line()}px`,
          end: () => `bottom ${line()}px`,
          invalidateOnRefresh: true,
          onToggle: ({ isActive }) => {
            if (!isActive) return;
            if (startsUnderLogo) logo.removeAttribute("data-logo-theme");
            else logo.setAttribute("data-logo-theme", theme);
          },
        });
      });
    });

    // The logo survives the page swap, so reset it once the old page is
    // covered; the new page starts in its header again.
    onCleanup(() => logos.forEach((logo) => logo.removeAttribute("data-logo-theme")));
  },
};