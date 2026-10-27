// ─── BLOKKS ──────────────────────────────
// Loads the Blokks launcher on pages that have a [data-blokks] div.
// Barba does not execute <script> tags in the swapped-in HTML, so the script
// is added from JS on every page that needs it and removed on page leave.
//
// Webflow: <div data-blokks></div> where the widget should appear.
// Do NOT also paste the <script> tag in Webflow; this component loads it.

const SRC = "https://blokks.co/schedules/laoqvrnbdr54.js";

export default {
  name: "blokks",
  selector: "[data-blokks]",
  init({ onCleanup }) {
    document.getElementById("blokks-launcher")?.remove();

    const script = document.createElement("script");
    script.id = "blokks-launcher";
    // script.dataset.layout = "rows";
    script.src = SRC;
    script.defer = true;
    document.body.appendChild(script);

    onCleanup(() => script.remove());
  },
};