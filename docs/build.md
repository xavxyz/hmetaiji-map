# Build et déploiement

`npm run build` chains two Vite passes over the same `dist/` — the lib pass produces the standalone IIFE, the page pass produces `index.html` without wiping it. The mechanics are commented at the top of `vite.config.ts`; the constraint is that the embed must stay **one file**, so anything emitting a separate asset (a large image, a font, a split chunk) breaks it. Keep assets under `assetsInlineLimit`.

Vite **bakes env vars into the bundle at build time**. Two consequences: the Mapbox token ships in plain text to every host page, so domain-restricting it in the Mapbox dashboard is the only thing protecting it; and changing any var needs a rebuild + redeploy, never just a page reload.

`netlify.toml` drives deployment (its `X-Frame-Options: DENY` is harmless — the embed is a `<script>`, never an iframe). Every var in `.env.example` must also exist in **Site settings → Environment variables**, or the deployed bundle ships `undefined` baked in.

## CI et formatage

La seule vérification requise sur une pull request est `npm run typecheck` (`tsc --noEmit`), défini dans `.github/workflows/ci.yml`. Même commande en local et en CI, pour qu'un échec soit reproductible sans passer par GitHub. Le gate existe parce que les deux régressions de #28 et #30 étaient des références périmées à un membre d'enum renommé — des erreurs de type que rien ici n'attrapait.

Prettier tourne en **hook git** (`.husky/pre-commit` → `lint-staged`), pas en check requis, et n'est jamais bloquant pour un merge : une PR rouge sur une histoire d'espaces apprend à son auteur à ignorer les checks rouges. Le hook s'installe tout seul via le script `prepare` au premier `npm install` ; `npm run format` reformate tout le dépôt à la main si besoin.

Les tests end-to-end (Playwright) sont hors périmètre tant qu'il n'existe pas d'URL de staging stable.
