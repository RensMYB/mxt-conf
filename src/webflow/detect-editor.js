// Detects whether the page is open inside the Webflow Editor.
// Used by the scroll utility to disable smooth scroll while designing.

export function handleEditor(callback) {
  const check = () => {
    const first = document.body.firstElementChild;
    return first instanceof HTMLElement &&
      first.classList.contains("w-editor-publish-node");
  };

  let previous = check();
  if (callback) callback(previous);

  new MutationObserver(() => {
    const current = check();
    if (current !== previous) {
      previous = current;
      if (callback) callback(current);
    }
  }).observe(document.body, { childList: true });
}
