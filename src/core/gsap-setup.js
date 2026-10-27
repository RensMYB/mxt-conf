// -----------------------------------------
// GSAP SETUP (plugins, eases, defaults)
// -----------------------------------------
// GSAP + plugins load as globals via Odyn's Dependencies panel.
// Never `import gsap from "gsap"` — Odyn doesn't bundle npm packages.

gsap.registerPlugin(CustomEase);
if (typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);
if (typeof SplitText !== "undefined") gsap.registerPlugin(SplitText);
if (typeof Draggable !== "undefined") gsap.registerPlugin(Draggable);
if (typeof InertiaPlugin !== "undefined") gsap.registerPlugin(InertiaPlugin);

export const durationDefault = 0.8;
export const staggerDefault = 0.05;

CustomEase.create("myb", "M0,0 C0.03,0 0.08,0.02 0.12,0.08 C0.18,0.2 0.2099,0.5054 0.2699,0.8554 C0.3099,1.0554 0.38,1.12 0.45,1.08 C0.52,1.02 0.5902,0.9732 0.6902,0.9932 C0.7902,1.0132 0.9,1 1,1");
CustomEase.create("page-transition", "0.34, 1.1, 0.5, 1");
CustomEase.create("osmo-ease", "0.625, 0.05, 0, 1");

gsap.defaults({ ease: "myb", duration: durationDefault });