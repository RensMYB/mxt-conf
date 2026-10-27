# Odyn Starter (Simple)

A structured starting point for Webflow animations. Same tools as the Playground, organized into components and utilities so your code scales.

## Structure

```
entry.js                — Boots scroll and runs your components
components/
  hero.js               — Hero entrance animations (data-hero)
  reveal.js             — Scroll-triggered reveals (data-reveal)
utils/
  dom.js                — Query helpers (qs, q)
  math.js               — lerp, clamp, map, damp
  scroll.js             — Lenis smooth scroll setup
webflow/
  detect-editor.js      — Disables smooth scroll in the Webflow Editor
style.css               — Hides elements until GSAP reveals them
```

## How it works

Each component is a function that targets elements by data attribute. The entry point imports and calls them.

### Hero animations

Add `data-hero` to elements in Webflow. Use the value as a delay:

```html
<h1 data-hero>Heading</h1>
<p data-hero="0.15">Subheading</p>
```

### Scroll reveals

Add `data-reveal` to any element. It fades in when it scrolls into view.

## Adding a component

1. Create a file in `components/`
2. Export a function that targets your data attribute
3. Import and call it from `entry.js`

```javascript
// components/cards.js
import { qs } from "../utils/dom.js";

export function cards() {
  qs("[data-card]").forEach((el, i) => {
    gsap.from(el, {
      y: 40,
      autoAlpha: 0,
      duration: 0.6,
      delay: i * 0.1,
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });
}
```

Then in `entry.js`:

```javascript
import { cards } from "./components/cards.js";
cards();
```

## Dependencies (loaded from CDN)

- **GSAP** + **ScrollTrigger** for animation
- **Lenis** for smooth scroll

Managed in the Dependencies panel.
