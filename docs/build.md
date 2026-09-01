# Build et déploiement

`npm run build` chains two Vite passes over the same `dist/` — the lib pass produces the standalone IIFE, the page pass produces `index.html` without wiping it. The mechanics are commented at the top of `vite.config.ts`; the constraint is that the embed must stay **one file**, so anything emitting a separate asset (a large image, a font, a split chunk) breaks it. Keep assets under `assetsInlineLimit`.

Vite **bakes env vars into the bundle at build time**. Two consequences: the Mapbox token ships in plain text to every host page, so domain-restricting it in the Mapbox dashboard is the only thing protecting it; and changing any var needs a rebuild + redeploy, never just a page reload.

`netlify.toml` drives deployment (its `X-Frame-Options: DENY` is harmless — the embed is a `<script>`, never an iframe). Every var in `.env.example` — `VITE_MAPBOX_TOKEN`, `VITE_SHEET_ID`, `VITE_LIEUX_GID`, `VITE_GROUPS_GID` — must also exist in **Site settings → Environment variables**, or the deployed bundle ships `undefined` baked in. The two gids are optional and may be left empty, which selects their documented fallback (see [data.md](data.md)) rather than shipping `undefined`.
