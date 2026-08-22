# Couches et filtres

The map shows exactly one of two layers at a time. `render()` is the single place that decides:

- **Lieux** (default): `Location` markers filtered by `activeFilters`, plus the Mapbox label layer.
- **Groupes**: `TrainingGroup` markers, picto-based; locations *and* labels hidden.

`groupsMode: boolean` picks the branch. Every state change (filter click, data load) mutates `groupsMode` / `activeFilters` and then calls `syncFilterButtons()` + `render()` — nothing else touches marker visibility. Keep it that way: adding a second write path is how the two layers end up on screen together.

Markers are plain DOM `mapboxgl.Marker`s held in `markerEntries` / `groupEntries`, each entry caching a `visible` flag so `addTo`/`remove` only fire on an actual change.

## Filter-button semantics

One button per `Activity` value, generated from the enum. Behaviour of a click, all in `onFilterClick`:

- `GROUPES_DE_PRATIQUE` toggles `groupsMode`.
- Any other button while in groups mode: leave groups mode, and activate **only** that filter.
- Any other button while it is already the sole active filter: re-show **all** locations (the reset gesture).
- Otherwise: activate only that button.

So the location filters are radio-like, not checkboxes — there is no multi-select, and "all active" is the state you get back by clicking the lone active filter again. Leaving or entering groups mode closes the card (`hideCard()`), since the fiche would otherwise describe a marker that is no longer on the map.

Locations with zero recognised activities bypass filtering entirely and are always visible (`applyLocationFilters`, mirrored in `syncLabelFilter`). If you change that rule, change it in both places or markers and labels desynchronise.

## Label layer

City names are **not** DOM: they are a Mapbox `symbol` layer (`location-labels`) over a GeoJSON source built from the same `Location[]`. Each feature carries `city`, `activities` (joined string), `activityCount`, `labelPos`.

- `labelPos` drives `text-anchor` / `text-offset` via `match` expressions — note the anchor is the **opposite** of the position (`labelPos: "bottom"` ⇒ anchor `top`).
- `text-allow-overlap: false`, so labels drop out silently when crowded. That is the expected behaviour at low zoom, not a bug.
- Filtering happens with `map.setFilter` on the layer, duplicating `applyLocationFilters`' logic in Mapbox expression form. Groups mode sets `visibility: none` instead.
- Clicking a label opens the matching location's card, matched **by city name**, so two rows sharing a city name resolve to the first one.

## Map interaction

All navigation is disabled on `load` (scroll, drag, rotate, keyboard, double-click, touch): the map is a static illustration, only markers and labels are clickable. Initial framing differs by viewport — mobile (`max-width: 700px`) fits French bounds, desktop uses a fixed `center` + `zoom`. Measured once at mount, so it does not follow a resize.

The Mapbox style is a custom one (`mapbox://styles/xavxyz/...`); colours of roads, borders and base labels live in Mapbox Studio, not in this repo.
