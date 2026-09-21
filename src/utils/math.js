// Common math functions for animation work.

/** Blend between two values. t=0 returns a, t=1 returns b. */
export function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

/** Framerate-independent smoothing. Higher lambda = faster. */
export function damp(current, target, lambda, dt) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** Map a value from one range to another. */
export function map(value, inLow, inHigh, outLow, outHigh) {
  return outLow + ((outHigh - outLow) * (value - inLow)) / (inHigh - inLow);
}

/** Clamp a value between min and max. */
export function clamp(min, max, value) {
  return Math.min(Math.max(value, min), max);
}
