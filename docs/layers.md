# Couches et filtres

The map shows exactly one of two layers at a time — **lieux** (default: `Location` markers + the label layer) or **groupes** (`TrainingGroup` markers; locations *and* labels hidden). `groupsMode` picks the branch and `render()` is the only place that acts on it.

Every state change mutates `groupsMode` / `activeFilters`, then calls `syncFilterButtons()` + `render()`. Nothing else touches marker visibility; a second write path is how both layers end up on screen at once.

## Filter-button semantics

One button per `Activity` value, generated from the enum. A click, in `onFilterClick`:

- `GROUPES_DE_PRATIQUE` toggles `groupsMode`.
- Another button while in groups mode: leave groups mode, activate **only** that filter.
- A button that is already the sole active filter: re-show **all** locations — the reset gesture.
- Otherwise: activate only that button.

So location filters are radio-like, not checkboxes: there is no multi-select, and "all active" is reachable only through that reset. Entering or leaving groups mode closes the card, which would otherwise describe a marker no longer on the map.

Locations with zero recognised activities bypass filtering and are always visible. That rule lives twice — `applyLocationFilters` for markers, `syncLabelFilter` for labels — so change it in both or the two desynchronise.

## Label layer

City names are **not** DOM: they are a Mapbox `symbol` layer over a GeoJSON source built from the same `Location[]`, filtered with `map.setFilter` (the marker filter logic again, in expression form) and hidden outright in groups mode.

- `labelPos` drives `text-anchor` / `text-offset`; the anchor is the **opposite** of the position (`labelPos: "bottom"` ⇒ anchor `top`).
- `text-allow-overlap: false`, so crowded labels drop out silently. Expected at low zoom, not a bug.
- Clicking a label opens the matching card **by city name**, so two rows sharing a city resolve to the first.

## Map interaction

All navigation is disabled on `load`: the map is a static illustration, only markers and labels are clickable. Initial framing branches on viewport, measured once at mount, so it does not follow a resize.

The Mapbox style is a custom one (`mapbox://styles/xavxyz/...`): colours of roads, borders and base labels live in Mapbox Studio, not in this repo.
