// ─── VIMEO PLAYER ────────────────────────
// Attributes in Webflow, on the wrapper:
//   data-vimeo-player-init                → marks the player
//   data-vimeo-video-id="1019191082"      → the Vimeo video id
//   data-vimeo-update-size="true|cover"   → "true" keeps the video's aspect
//                                            ratio, "cover" fills the wrapper
//   data-vimeo-autoplay="true|false"      → "true" plays while in view (muted)
//   data-vimeo-paused-by-user="false"     → set to "true" once the user pauses,
//                                            which stops the in-view autoplay
//   data-vimeo-muted / -playing / -loaded / -activated / -hover / -fullscreen
//                                         → written by this component, style on them
//
// Children:
//   .vimeo-player__before                 → aspect-ratio spacer
//   .vimeo-player__iframe                 → iframe wrapper (resized for "cover")
//   iframe                                → gets its src set here
//   [data-vimeo-control="play|pause|mute|fullscreen|timeline"]
//   [data-vimeo-duration]                 → time readout
//   progress                              → progress bar
//
// Requires the Vimeo Player SDK (https://player.vimeo.com/api/player.js)
// as a dependency in Odyn, loaded before the bundle.

const VISIBILITY_THRESHOLD = 0.01;

function initPlayer(vimeoElement, index, { signal, onCleanup }) {
  const videoId = vimeoElement.getAttribute("data-vimeo-video-id");
  const iframe = vimeoElement.querySelector("iframe");
  if (!videoId || !iframe) return;

  // Set the src before creating the player
  iframe.setAttribute(
    "src",
    `https://player.vimeo.com/video/${videoId}?api=1&background=1&autoplay=0&loop=0&muted=1`
  );

  // Unique id per page load. With Barba's sync mode two containers exist at
  // once, so a fixed id would collide with the outgoing page's player.
  vimeoElement.setAttribute("id", `vimeo-player-${Date.now().toString(36)}-${index}`);

  // Pass the iframe element, not an id: no document-wide lookup, so it can't
  // grab the old page's iframe during the transition.
  const player = new Vimeo.Player(iframe);

  // The SDK is promise-based; a page can leave before a promise resolves.
  let destroyed = false;
  const alive = () => !destroyed;

  onCleanup(() => {
    destroyed = true;
    // destroy() removes the iframe, which is fine: Barba discards it anyway
    player.destroy().catch(() => { });
  });

  // ── Sizing ──
  const updateSize = vimeoElement.getAttribute("data-vimeo-update-size");
  const beforeEl = vimeoElement.querySelector(".vimeo-player__before");
  const iframeWrapper = vimeoElement.querySelector(".vimeo-player__iframe");
  let videoAspectRatio;

  function adjustVideoSizing() {
    if (!iframeWrapper || !videoAspectRatio || !vimeoElement.offsetWidth) return;
    const containerRatio = vimeoElement.offsetHeight / vimeoElement.offsetWidth;

    if (containerRatio > videoAspectRatio) {
      // Container is taller relative to the video
      iframeWrapper.style.width = (containerRatio / videoAspectRatio) * 100 + "%";
      iframeWrapper.style.height = "100%";
    } else {
      // Container is wider relative to the video
      iframeWrapper.style.height = (videoAspectRatio / containerRatio) * 100 + "%";
      iframeWrapper.style.width = "100%";
    }
  }

  if (updateSize === "true" || updateSize === "cover") {
    Promise.all([player.getVideoWidth(), player.getVideoHeight()])
      .then(([width, height]) => {
        if (!alive() || !width) return;
        videoAspectRatio = height / width;

        if (updateSize === "cover") {
          if (beforeEl) beforeEl.style.paddingTop = "0%";
          adjustVideoSizing();
        } else if (beforeEl) {
          beforeEl.style.paddingTop = videoAspectRatio * 100 + "%";
        }
      })
      .catch(() => { });
  }

  if (updateSize === "cover") {
    // Height matters here too, so no width-only debounce
    window.addEventListener("resize", adjustVideoSizing, { signal });
  }

  // ── Play / pause ──
  function vimeoPlayerPlay() {
    if (!alive()) return;
    vimeoElement.setAttribute("data-vimeo-activated", "true");
    vimeoElement.setAttribute("data-vimeo-playing", "true");
    player.play().catch(() => { }); // browsers block unmuted autoplay
  }

  function vimeoPlayerPause() {
    if (!alive()) return;
    player.pause().catch(() => { });
  }

  player.on("play", () => {
    vimeoElement.setAttribute("data-vimeo-loaded", "true");
    vimeoElement.setAttribute("data-vimeo-playing", "true");
  });

  player.on("pause", () => {
    vimeoElement.setAttribute("data-vimeo-playing", "false");
  });

  // ── Autoplay ──
  // IntersectionObserver instead of a scroll listener: it also fires when the
  // page loads already scrolled down, and doesn't run on every Lenis frame.
  let visibilityObserver = null;

  function stopVisibilityAutoplay() {
    visibilityObserver?.disconnect();
    visibilityObserver = null;
  }
  onCleanup(stopVisibilityAutoplay);

  if (vimeoElement.getAttribute("data-vimeo-autoplay") === "false") {
    player.setVolume(1).catch(() => { });
    vimeoPlayerPause();
  } else {
    player.setVolume(0).catch(() => { });
    vimeoElement.setAttribute("data-vimeo-muted", "true");

    if (vimeoElement.getAttribute("data-vimeo-paused-by-user") === "false") {
      visibilityObserver = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? vimeoPlayerPlay() : vimeoPlayerPause()),
        { threshold: VISIBILITY_THRESHOLD }
      );
      visibilityObserver.observe(vimeoElement);
    }
  }

  // ── Controls ──
  // These live inside the container, so they're removed with the old page.
  vimeoElement.querySelector('[data-vimeo-control="play"]')?.addEventListener("click", () => {
    // Always set volume to 0 first to avoid a pop
    player.setVolume(0).catch(() => { });
    vimeoPlayerPlay();
    if (vimeoElement.getAttribute("data-vimeo-muted") !== "true") {
      player.setVolume(1).catch(() => { });
    }
  });

  vimeoElement.querySelector('[data-vimeo-control="pause"]')?.addEventListener("click", () => {
    vimeoPlayerPause();
    // Paused by the user → stop the in-view autoplay for good
    if (vimeoElement.getAttribute("data-vimeo-autoplay") !== "false") {
      vimeoElement.setAttribute("data-vimeo-paused-by-user", "true");
      stopVisibilityAutoplay();
    }
  });

  vimeoElement.querySelector('[data-vimeo-control="mute"]')?.addEventListener("click", () => {
    const muted = vimeoElement.getAttribute("data-vimeo-muted") === "true";
    player.setVolume(muted ? 1 : 0).catch(() => { });
    vimeoElement.setAttribute("data-vimeo-muted", muted ? "false" : "true");
  });

  // ── Fullscreen ──
  const fullscreenSupported = !!(
    document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.msFullscreenEnabled
  );
  const fullscreenBtn = vimeoElement.querySelector('[data-vimeo-control="fullscreen"]');

  if (fullscreenBtn && !fullscreenSupported) {
    fullscreenBtn.style.display = "none";
  }

  const isFullscreen = () =>
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;

  fullscreenBtn?.addEventListener("click", () => {
    if (isFullscreen()) {
      vimeoElement.setAttribute("data-vimeo-fullscreen", "false");
      (document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen)?.call(document);
    } else {
      vimeoElement.setAttribute("data-vimeo-fullscreen", "true");
      (vimeoElement.requestFullscreen ||
        vimeoElement.webkitRequestFullscreen ||
        vimeoElement.mozRequestFullScreen ||
        vimeoElement.msRequestFullscreen)?.call(vimeoElement);
    }
  });

  // Document-level → removed on page leave via the page signal
  ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "msfullscreenchange"]
    .forEach((event) => {
      document.addEventListener(
        event,
        () => vimeoElement.setAttribute("data-vimeo-fullscreen", isFullscreen() ? "true" : "false"),
        { signal }
      );
    });

  // ── Duration, timeline, progress ──
  const durationEl = vimeoElement.querySelector("[data-vimeo-duration]");
  const timelineEl = vimeoElement.querySelector('[data-vimeo-control="timeline"]');
  const progressEl = vimeoElement.querySelector("progress");

  player.getDuration()
    .then((duration) => {
      if (!alive()) return;
      if (durationEl) durationEl.textContent = secondsToHMS(duration);
      [timelineEl, progressEl].forEach((el) => el?.setAttribute("max", duration));
    })
    .catch(() => { });

  if (timelineEl) {
    const seek = () => {
      const timeVal = timelineEl.value;
      player.setCurrentTime(timeVal).catch(() => { });
      if (progressEl) progressEl.value = timeVal;
    };
    ["input", "change"].forEach((evt) => timelineEl.addEventListener(evt, seek));
  }

  player.on("timeupdate", (data) => {
    if (timelineEl) timelineEl.value = data.seconds;
    if (progressEl) progressEl.value = data.seconds;
    if (durationEl) durationEl.textContent = secondsToHMS(Math.trunc(data.seconds));
  });

  // ── Hide controls after inactivity ──
  let hoverTimer;
  vimeoElement.addEventListener("mousemove", () => {
    vimeoElement.setAttribute("data-vimeo-hover", "true");
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => vimeoElement.setAttribute("data-vimeo-hover", "false"), 3000);
  });
  onCleanup(() => clearTimeout(hoverTimer));

  // ── Ended ──
  player.on("ended", () => {
    if (vimeoElement.getAttribute("data-vimeo-autoplay") === "false") {
      vimeoElement.setAttribute("data-vimeo-activated", "false");
      vimeoElement.setAttribute("data-vimeo-playing", "false");
      player.unload().catch(() => { });
    } else {
      player.play().catch(() => { });
    }
  });
}

function secondsToHMS(s) {
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s = Math.trunc(s - m * 60);
  return m + ":" + (s < 10 ? "0" + s : s);
}

export default {
  name: "vimeo-player",
  selector: "[data-vimeo-player-init]",
  init({ elements, signal, onCleanup }) {
    if (typeof Vimeo === "undefined") {
      console.warn("[vimeo-player] Vimeo Player SDK not loaded — add player.js as a dependency.");
      return;
    }
    elements.forEach((el, i) => initPlayer(el, i, { signal, onCleanup }));
  },
};