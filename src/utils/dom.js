// DOM query helpers.

/** Query all matching elements. Returns an array. */
export function qs(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

/** Query a single element. Returns the element or null. */
export function q(selector, parent = document) {
  return parent.querySelector(selector);
}
