// ─── LUMOS FORM RANGE ────────────────────

function initRange(component) {
  const input = component.querySelector("input[type='range']");
  const output = component.querySelector(".form_range_output_value");
  if (!input) return;

  const update = () => {
    const min = input.min ? +input.min : 0;
    const max = input.max ? +input.max : 100;
    const val = +input.value || min;
    component.style.setProperty("--progress", (val - min) / (max - min));
    if (output) output.textContent = val;
  };

  input.addEventListener("input", update);
  update();
}

export default {
  name: "lumos-form-range",
  selector: ".form_range_wrap",
  init({ elements }) {
    elements.forEach(initRange);
  },
};