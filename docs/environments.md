# Environnements

Reference for the deploy contexts of the single Netlify site. Rows marked _pending_ are established by later tickets of #25 — this document is filled in as they land.

## Contexts

|                | production          | staging                     | deploy preview      |
| -------------- | ------------------- | --------------------------- | ------------------- |
| Source         | `master`            | `staging` branch            | any open PR         |
| Consumer       | hmetaiji.fr         | hidden page on hmetaiji.fr  | the PR itself       |
| Sheet          | production          | production                  | sandbox _(pending)_ |
| Mapbox token   | production, restricted _(pending)_ | non-production _(pending)_ | non-production _(pending)_ |
| Cache (after #8) | 1h + purge on publish _(pending)_ | none _(pending)_ | none _(pending)_ |
| Badge          | hidden              | shown                       | shown               |

There is **one Netlify site**, not three: isolation is by context-scoped configuration. Staging and previews are the same build as production, differing only in the variables baked into the bundle.

## Badge de build

Every non-production build renders a small badge in the bottom-left corner **of the map** naming the context and the branch (`branch-deploy · staging`), so a deployed map is never ambiguous about which build — and therefore which data — it is showing.

The text is **derived from the platform, never maintained by hand**. Netlify injects `CONTEXT` and `BRANCH` into every build; they are not `VITE_`-prefixed, so they do not reach Vite on their own and are reassigned inline in the build command in `netlify.toml`:

```toml
command = "VITE_DEPLOY_CONTEXT=$CONTEXT VITE_BRANCH=$BRANCH npm run build"
```

The badge renders only when `VITE_DEPLOY_CONTEXT` is present **and** is not `production`. Its absence in production is therefore structural rather than a conditional to trust: a plain local `npm run build` has no context value and produces no badge either. A hand-maintained label variable was rejected — one more thing to set per context, whose only failure mode would be silently claiming to be the wrong environment.

The badge is markup plus CSS inside the existing inlined stylesheet, so it emits no separate asset and the single-file embed constraint holds. It is `pointer-events: none`, so it never intercepts a click meant for the map.

## Variables

Every variable in `.env.example` must also exist in **Site settings → Environment variables**, scoped per context where the contexts differ, or the deployed bundle ships `undefined` baked in. `VITE_DEPLOY_CONTEXT` and `VITE_BRANCH` are the exception: they come from the build command, not the dashboard, and must not be set by hand.

Variables declared in `netlify.toml` are **not** available to functions or edge functions at runtime — only those set through the UI, CLI or API reach `process.env`. Any per-context value a future function needs must therefore live in the dashboard.

## Branch policy

_Pending_ — established by the tickets that create the `staging` branch deploy. In short: `staging` is a disposable client-validation lane, re-cut from `master` on demand and **never merged back into it**; feature branches merge to `master` directly.

## Search engine exclusion

_Pending_ — staging must carry `X-Robots-Tag: noindex` while remaining loadable cross-origin by the hidden hmetaiji.fr page.
