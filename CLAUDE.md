# CLAUDE.md

In a git worktree, copy `.env` from the main repo — it is gitignored, so it is absent from worktrees and the map renders blank without it.

## Docs

- [docs/data.md](docs/data.md) — Google Sheets as the database. Read before touching parsing, sheet columns, or activity values.
- [docs/layers.md](docs/layers.md) — lieux and groupes, mutually exclusive. Read before touching filters, markers, or the label layer.
- [docs/card.md](docs/card.md) — the single `#location-card`. Read before touching the fiche, its content, or its animations.
- [docs/build.md](docs/build.md) — the embed must stay one file. Read before touching `vite.config.ts`, env vars, or deployment.

## Agent skills

### Issue tracker

Issues live as GitHub issues on `xavxyz/hmetaiji-map`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, used verbatim as label strings. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
