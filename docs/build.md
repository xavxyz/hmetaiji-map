# Build et déploiement

`npm run build` chains two Vite passes over the same `dist/` — the lib pass produces the standalone IIFE, the page pass produces `index.html` without wiping it. The mechanics are commented at the top of `vite.config.ts`; the constraint is that the embed must stay **one file**, so anything emitting a separate asset (a large image, a font, a split chunk) breaks it. Keep assets under `assetsInlineLimit`.

Vite **bakes env vars into the bundle at build time**. Two consequences: the Mapbox token ships in plain text to every host page, so domain-restricting it in the Mapbox dashboard is the only thing protecting it; and changing any var needs a rebuild + redeploy, never just a page reload.

`netlify.toml` drives deployment (its `X-Frame-Options: DENY` is harmless — the embed is a `<script>`, never an iframe). Every var in `.env.example` must also exist in **Site settings → Environment variables**, or the deployed bundle ships `undefined` baked in.

## CI et formatage

The only required check on a pull request is `npm run typecheck` (`tsc --noEmit`), defined in `.github/workflows/ci.yml`. Same command locally and in CI, so a failure is reproducible without going through GitHub. The gate exists because the two regressions in #28 and #30 were stale references to a renamed enum member — type errors that nothing here caught. Note its one blind spot: `tsconfig.json`'s `include` covers `embed.ts`, `app.ts` and `vite-env.d.ts` only, so **`vite.config.ts` is not typechecked**.

Making it _block_ a merge is a repo setting, not code: `typecheck` must be marked a required status check in branch protection (Settings → Branches, or `gh api -X PUT repos/xavxyz/hmetaiji-map/branches/master/protection`). Without that the check runs and goes red, but merge stays available.

Prettier runs as a **git hook** (`.husky/pre-commit` → `lint-staged`), never as a required check: a pull request failing on whitespace teaches its author to ignore red checks. The hook installs itself through the `prepare` script on the first `npm install` (lint-staged 17 needs Node >= 22.22, which the Volta pin already guarantees); `npm run format` reformats the whole repo by hand. The repo is not Prettier-clean at rest yet, so the first commit touching `app.ts` or `docs/layers.md` will carry a reformat.

End-to-end tests (Playwright) stay out of scope until a stable staging URL exists.
