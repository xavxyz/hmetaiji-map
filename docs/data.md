# Données : Google Sheets

The database is a public Google Spreadsheet, fetched as CSV at runtime (`gviz/tq?tqx=out:csv`). No build step, no cache: editing the sheet changes the map on next page load. The sheet must stay shared as "anyone with the link can view", otherwise the fetch 404s and the map loads empty.

Two tabs, both parsed in `app.ts` under `// ─── DATA ───`:

| Tab | URL | Type | Required |
| --- | --- | --- | --- |
| Lieux de pratique | `SHEET_URL` (first sheet, no gid) | `Location` | yes |
| Groupes d'entraînement | `GROUPS_SHEET_URL` (`VITE_GROUPS_GID`) | `TrainingGroup` | no — absent gid ⇒ `loadGroups()` returns `[]` and the groups layer stays empty |

## Column order is the contract

Both parsers destructure `parseRow(row)` **positionally** and ignore the header row. Column headers are documentation for humans only; renaming one changes nothing, reordering or inserting one breaks parsing silently.

Lieux — `city, lng, lat, activity, description, infos1, infos2, infos3, link, labelPos`

- `activity`: comma-separated list of `Activity` values, in one cell.
- `infos1..3`: three fixed columns collapsed into `infos: string[]`, empties dropped. An info containing `" : "` renders its left part in `<strong>`.
- `labelPos`: `top` | `bottom` | `left` | `right`, drives the Mapbox label anchor (see [layers.md](layers.md)); empty defaults to `top`.
- Rows without `lng`/`lat`, or with an empty `city`, are dropped.

Groupes — `region, departement, coordinates(lng), lat, responsable, email, telephone`

- Rows with an empty `region` or a non-numeric `lng` are dropped.
- `email` and `telephone` are optional per row; the card hides the button that has no value.

## Activity enum

`Activity` values are the **exact sheet strings** (`"COURS HEBDO"`, `"STAGES RESIDENTIELS"`, …); `ACTIVITY_LABEL` maps each to the human label shown on filter buttons and activity banners. Adding an activity means: add the sheet string to the enum, add its label to `ACTIVITY_LABEL` (the `Record` makes this a type error if you forget), and it appears as a filter button automatically.

An unrecognised string in the sheet is dropped by `toActivity()` rather than raising. A location that ends up with **zero** recognised activities is treated as always visible, never filtered out — so a typo in the sheet shows the location under every filter instead of hiding it.

`Activity.GROUPES_DE_PRATIQUE` is not a location activity: it is the layer toggle, see [layers.md](layers.md).

## parseRow

Hand-rolled CSV: handles quoted fields, `""` escapes, commas inside quotes, and trims each field. It does not handle newlines inside quoted fields — the split is `csv.split("\n")` upstream, so a multi-line cell in the sheet corrupts that row and the ones after it. Keep cells single-line.
