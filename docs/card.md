# La fiche (`#location-card`)

There is **one** card element, declared once in `TEMPLATE` and re-filled in place — never one per location, never one per mode. It holds both the location fiche and the group fiche; JS decides which blocks show.

## Content switching

- `fillFull(location)` / `fillGroup(group)` fill the fields, then `showOnly()` sets inline `display` on `.loc-only` / `.group-only` children. Both classes are JS-only, with no CSS rules.
- `.group-mode` is the CSS hook: it swaps the header marker SVG for the HME logo (`--group-icon`, set at mount) and styles the region banner.
- `placeholder-mode` is vestigial — the `fill*` functions remove it and nothing ever adds it. Ignore it, or delete it.

Adding a field means markup in `TEMPLATE` tagged `loc-only` or `group-only`, plus a line in the matching `fill*`.

A document-level click closes the card, ignoring clicks inside it or on any `.mapboxgl-marker` — those swap to another fiche instead.

## Animation

Two entry paths, both timed with `setTimeout` rather than transition events:

- **Closed → open** (`showFromHidden`): drop `.card-closed`, force opacity 0 with `transition: none`, reflow (`void card.offsetHeight`), fade in.
- **Open → other content** (`morphCard`): fade out, apply the content change at the midpoint, fade back in. The top-left marker stays fixed throughout, which is what makes it read as one card changing rather than two swapping.

Every path pushes its timers into `morphTimers` and clears the pending ones first. That is what stops rapid marker clicks from interleaving a stale fade-in over fresh content, and any new path must do the same. Inline `transition` / `opacity` are cleared once the animation lands, so CSS stays in control between interactions.

## Styles

`injectStyles()` puts `style.css` into `<head>` once, guarded by `stylesInjected`, because the embed cannot rely on the host page loading a stylesheet. Selectors are therefore global and share the host page's cascade. The `elementor-button` classes on links are deliberate: they let the host site (Elementor) style them as its own buttons.
