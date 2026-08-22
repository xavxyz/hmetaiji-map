# Données : Google Sheets

The database is a public Google Spreadsheet fetched as CSV at runtime. No build step, no cache: editing the sheet changes the map on the next page load. It must stay shared as "anyone with the link can view", or the fetch fails and the map loads empty.

Two tabs: **lieux de pratique** (first sheet, no gid) → `Location[]`, and **groupes d'entraînement** (`VITE_GROUPS_GID`) → `TrainingGroup[]`. The gid is optional; without it `loadGroups()` returns `[]` and the groups layer stays empty.

## Column order is the contract

Both parsers destructure `parseRow(row)` **positionally** and skip the header row. Headers are documentation for humans; renaming one changes nothing, reordering or inserting one breaks parsing silently.

Lieux — `city, lng, lat, activity, description, infos1, infos2, infos3, link, labelPos`

- `activity`: comma-separated `Activity` values in one cell.
- `infos1..3`: three fixed columns collapsed into `infos: string[]`, empties dropped. An info containing `" : "` renders its left part in `<strong>`.
- `labelPos`: `top` | `bottom` | `left` | `right`, empty defaults to `top` — see [layers.md](layers.md).
- Rows without `lng`/`lat` or with an empty `city` are dropped.

Groupes — `region, departement, lng, lat, responsable, email, telephone`

- Rows with an empty `region` or a non-numeric `lng` are dropped.
- `email` and `telephone` are optional per row; the card hides whichever button has no value.

## Activity enum

`Activity` values are the **exact sheet strings**; `ACTIVITY_LABEL` maps each to the human label on filter buttons and activity banners. Adding one means adding the sheet string to the enum and its label to `ACTIVITY_LABEL` (the `Record` makes a missing label a type error) — the filter button follows automatically.

`toActivity()` drops an unrecognised string rather than raising, so a typo in the sheet surfaces as the location appearing under every filter ([layers.md](layers.md)), never as an error.

`Activity.GROUPES_DE_PRATIQUE` is not a location activity: it is the layer toggle.

## parseRow

Hand-rolled CSV: quoted fields, `""` escapes, commas inside quotes, each field trimmed. It does **not** handle newlines inside a quoted field — the upstream split is `csv.split("\n")`, so a multi-line cell corrupts that row and the ones after it. Keep cells single-line.
