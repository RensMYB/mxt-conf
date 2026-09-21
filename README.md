# mxt-conf

A live mirror of an [Odyn](https://app.odyn.dev) project. Synced one-way from Odyn to GitHub on every successful production deploy, so every version of your code is preserved in your own repository.

**Latest version:** v1
**Deployed:** 2026-09-21T12:35:04.098Z

## Layout

- `src/` — current project source. Mirrors what you write in the Odyn editor.
- `dist/v1/` — built artifacts for each deploy. Versions accumulate; nothing here is ever overwritten.
- `dist/latest/` — built artifacts for v1 (the most recent deploy). Overwritten on every deploy; files no longer produced are removed.
- Each deploy commit is tagged `v{n}`.

## One-way mirror

Odyn is the source of truth. Edits made in this repo will **not** sync back to Odyn — they will be overwritten by the next deploy. Clone the repo any time to inspect the project locally, browse version history, or mirror the artifacts to other hosts.

## Serve from jsDelivr (optional)

If this repo is **public** on GitHub, [jsDelivr](https://www.jsdelivr.com/github) will serve any file under `dist/` over a free global CDN. This is in addition to your Odyn-hosted CDN URLs, not a replacement — the URLs in the Odyn dashboard are faster, with proper cache invalidation.

For jsDelivr embeds in production, **always pin to a version tag**. Tagged URLs are immutable and cached forever; branch-path URLs (`@main/dist/latest/...`) are cached for up to 12 hours, so they lag your deploys.

### Pinned to v1 (recommended for jsDelivr — immutable, cached forever)

- `entry.js` → https://cdn.jsdelivr.net/gh/RensMYB/mxt-conf@v1/dist/v1/entry.js
- `utils/math.js` → https://cdn.jsdelivr.net/gh/RensMYB/mxt-conf@v1/dist/v1/utils/math.js
- `webflow/detect-editor.js` → https://cdn.jsdelivr.net/gh/RensMYB/mxt-conf@v1/dist/v1/webflow/detect-editor.js
- `style.css` → https://cdn.jsdelivr.net/gh/RensMYB/mxt-conf@v1/dist/v1/style.css
- `README.md` → https://cdn.jsdelivr.net/gh/RensMYB/mxt-conf@v1/dist/v1/README.md
- `bundle.js` → https://cdn.jsdelivr.net/gh/RensMYB/mxt-conf@v1/dist/v1/bundle.js
- `bundle.css` → https://cdn.jsdelivr.net/gh/RensMYB/mxt-conf@v1/dist/v1/bundle.css

`dist/latest/` is best used for direct GitHub raw, GitHub Pages, or local checkout — not for jsDelivr-fronted production traffic.

If this repo is private, jsDelivr cannot reach it — keep using your Odyn-hosted CDN URLs.
