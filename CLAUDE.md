# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Always run Node/npm via Volta (`~/.volta/bin/node`, `~/.volta/bin/npm`), not the system PATH.

```bash
npm run dev          # Dev server at http://localhost:5173 (cross-origin enabled)
npm run build        # Two-pass build: lib (IIFE bundle) then page (standalone HTML)
npm run build:lib    # IIFE bundle only → dist/hmetaiji-map.iife.js
npm run build:page   # Standalone page only → dist/index.html
npm run preview      # Preview the build locally
```

There is no test framework and no lint script.

## Architecture

This is a **single-file IIFE embed** — the entire app (JS + CSS + assets) ships as `dist/hmetaiji-map.iife.js`. A host page needs only:

```html
<div id="hmetaiji-map"></div>
<script src="/hmetaiji-map.iife.js"></script>
```

**Entry points:**
- `embed.ts` — sole entry point; finds `#hmetaiji-map` and calls `mount(container)`
- `app.ts` — contains everything else: data loading, HTML template, all map logic, and the exported `mount()` function
- `index.html` — minimal host page for local development only

**Data flow:**
- Two Google Sheets tabs fetched as CSV at runtime via `VITE_SHEET_ID` / `VITE_GROUPS_GID`
- Tab 1 (SHEET_URL): lieux de pratique → parsed into `Location[]`
- Tab 2 (GROUPS_SHEET_URL, optional): groupes d'entraînement → parsed into `TrainingGroup[]`
- Both parsed by a hand-rolled CSV parser (`parseRow`) that handles quoted fields

**Two rendering modes (mutually exclusive):**
- **Locations mode** (default): shows `Location` markers + Mapbox label layer; filterable by `Activity` enum
- **Groups mode**: activated by the "Groupes de pratique" filter button; swaps to `TrainingGroup` markers; locations and labels hidden

**Card/fiche:** a single `#location-card` element toggled between location and group content with CSS class switches (`group-mode`, `placeholder-mode`, `card-closed`) and fade animations.

**Build:** Vite runs two passes (`build` script chains `vite build && vite build --mode page`). The lib pass produces the IIFE (JS + CSS inlined, pictos inlined as data-URLs). The page pass builds `index.html` with `emptyOutDir: false` to preserve the IIFE.

## Environment variables

```
VITE_MAPBOX_TOKEN   # Mapbox access token
VITE_SHEET_ID       # Google Spreadsheet ID (sheet must be publicly readable)
VITE_GROUPS_GID     # gid of the groups tab (optional; disables groups layer if absent)
```

Copy `.env.example` → `.env` before running locally. When working in a git worktree, copy `.env` from the main repo (it is gitignored and not present in worktrees).
