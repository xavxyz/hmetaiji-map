# CLAUDE.md

Code comments are in French, and so is every user-facing string. Match that.

In a git worktree, copy `.env` from the main repo instead — it is gitignored, so it is absent from worktrees and the map renders blank without it.

## Docs

- [docs/data.md](docs/data.md) — Google Sheets as the database: tab layout, column order, the `Activity` enum, the hand-rolled CSV parser. Read before touching parsing, sheet columns, or activity values.
- [docs/layers.md](docs/layers.md) — the two mutually exclusive layers (lieux vs groupes), filter-button semantics, the Mapbox label layer. Read before touching filters, markers, or map layers.
- [docs/card.md](docs/card.md) — the single `#location-card` element and its fade/morph animation. Read before touching the fiche, its content, or its transitions.
- [docs/build.md](docs/build.md) — the two-pass Vite build, env vars baked at build time, Netlify deploy. Read before touching `vite.config.ts`, env vars, or deployment.
