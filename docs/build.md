# Build et déploiement

`npm run build` chains two Vite passes over the same `dist/` — the lib pass produces the standalone IIFE, the page pass produces `index.html` without wiping it. The mechanics are commented at the top of `vite.config.ts`; the constraint is that the embed must stay **one file**, so anything emitting a separate asset (a large image, a font, a split chunk) breaks it. Keep assets under `assetsInlineLimit`.

Vite **bakes env vars into the bundle at build time**. Two consequences: the Mapbox token ships in plain text to every host page, so domain-restricting it in the Mapbox dashboard is the only thing protecting it; and changing any var needs a rebuild + redeploy, never just a page reload.

`netlify.toml` drives deployment (its `X-Frame-Options: DENY` is harmless — the embed is a `<script>`, never an iframe). Every var in `.env.example` must also exist in **Site settings → Environment variables**, or the deployed bundle ships `undefined` baked in.

Two vars are the exception, set by neither the dashboard nor `.env`: `VITE_DEPLOY_CONTEXT` and `VITE_BRANCH`, which feed the non-production build badge. Netlify injects `CONTEXT` and `BRANCH` into every build, but Vite only exposes variables prefixed `VITE_`, so they are **assigned inline in the build command** — `VITE_DEPLOY_CONTEXT=$CONTEXT VITE_BRANCH=$BRANCH npm run build` — which is the only place the rename can happen. Setting them by hand in the dashboard would defeat the point: the badge exists precisely so it cannot go stale. A build with no context value (any plain local `npm run build`) renders no badge. See [environments.md](environments.md).
