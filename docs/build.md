# Build et déploiement

`npm run build` chains **two Vite passes over the same `dist/`** (see the comment at the top of `vite.config.ts` for the mechanics):

1. **lib pass** (default mode) → `dist/hmetaiji-map.iife.js`, the standalone embed: JS + CSS inlined, pictos inlined as data-URLs (`assetsInlineLimit: 100_000`). This is the only artefact the host site consumes.
2. **page pass** (`--mode page`) → `dist/index.html` + assets, with `emptyOutDir: false` so it does not wipe the bundle from pass 1.

Run `build:lib` or `build:page` alone when you need just one. Anything that would emit a separate asset file (a large image, a font, a split chunk) breaks the single-file guarantee — keep assets under the inline limit.

## Env vars

`VITE_MAPBOX_TOKEN`, `VITE_SHEET_ID`, `VITE_GROUPS_GID` (see `.env.example`). Vite **bakes them into the bundle at build time**, so the token ships in plain text to every host page: it must be domain-restricted in the Mapbox dashboard, and it is the only thing standing between the token and anyone reading the bundle. Changing a var requires a rebuild + redeploy, never just a page reload.

## Netlify

`netlify.toml` drives it (`npm run build` → `dist/`, plus `X-Frame-Options: DENY` — harmless, since the embed is a `<script>` and never an iframe). Production serves the bundle as a CDN artefact; hmetaiji.fr embeds it with its own `<script>` tag. The env vars must exist in **Site settings → Environment variables** or the deployed bundle ships with `undefined` baked in.
