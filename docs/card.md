# La fiche (`#location-card`)

There is **one** card element, declared once in `TEMPLATE` and re-filled in place — never a card per location, never a card per mode. It holds both the location fiche and the group fiche; JS decides which blocks show.

## Content switching

- `fillFull(location)` / `fillGroup(group)` fill the fields and call `showOnly("loc" | "group")`, which sets inline `display` on `.loc-only` / `.group-only` children. Both classes are JS-only — they have no CSS rules.
- `.group-mode` on the card is the CSS hook: it swaps the header marker SVG for the HME logo (`--group-icon`, set at mount) and styles the region banner.
- `.card-closed` hides the card.
- `placeholder-mode` is vestigial: `fillFull`/`fillGroup` remove it and nothing ever adds it. Ignore it, or delete it.

Adding a field means: add the markup to `TEMPLATE` with `loc-only` or `group-only`, and fill it in the matching `fill*` function. Anything driven by data must be set with `textContent` / `replaceChildren`, not `innerHTML` — the sheet is user-editable content.

The close button is handled by delegation on the card (`closest("#close-btn")`), and a document-level click closes the card, ignoring clicks inside the card or on any `.mapboxgl-marker` (those swap to another fiche instead).

## Animation

Two entry paths, both timed with `setTimeout` rather than transition events:

- **Closed → open** (`showFromHidden`): remove `.card-closed`, force opacity 0 with `transition: none`, reflow (`void card.offsetHeight`), then fade in over `FADE_IN_MS`.
- **Open → other content** (`morphCard`): fade out over `FADE_OUT_MS`, apply the content change at the midpoint, fade back in. The top-left marker stays fixed through the morph, which is what makes it read as one card changing rather than two cards swapping.

Every path pushes its timers into `morphTimers` and clears the pending ones first — that is what keeps rapid marker clicks from interleaving a stale fade-in over fresh content. Any new animation path must do the same. Inline `transition`/`opacity` are cleared once the animation lands, so CSS stays in control between interactions.

## Styles

`style.css` is plain CSS with `:root` variables (`--orange`, `--bg`, `--text`, `--line`) and section banners mirroring the concerns above. It is injected into `<head>` once by `injectStyles()` (guarded by `stylesInjected`), because the embed cannot rely on the host page loading a stylesheet — which also means selectors are global and share the host page's cascade. Breakpoints: 1100px (padding) and 700px (map height, marker sizes, one-column filters). Some `elementor-button` classes on links are deliberate: they let the host site (Elementor) style them like its own buttons.
