# hmetaiji-map

Carte interactive des lieux de pratique, construite en HTML / CSS / Vanilla JS avec [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) pour https://hmetaiji.fr.

## Prérequis

- Node.js ≥ 18
- Un token Mapbox ([account.mapbox.com](https://account.mapbox.com))

## Installation

```bash
cp .env.example .env
# Renseigner VITE_MAPBOX_TOKEN dans .env
npm install
```

## Développement local

```bash
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173).

- **CSS** → rechargé à chaud sans recharger la page
- **HTML / JS** → rechargement complet de la page

## Build

```bash
npm run build      # génère dist/
npm run preview    # prévisualise le build en local
```

## Déploiement (Netlify)

Le build est configuré dans `netlify.toml` (`npx vite build` → `dist/`).

Ajouter la variable d'environnement dans Netlify :  
**Site settings → Environment variables → `VITE_MAPBOX_TOKEN`**

```bash
# Première mise en ligne
npm install -g netlify-cli
netlify login
netlify init

# Déploiement (Netlify lit netlify.toml et build automatiquement)
netlify deploy --prod
```

---

## Structure

```
hmetaiji-map/
├── index.html       # Structure, sidebar, SVG markers
├── style.css        # Styles (variables, carte, fiche lieu, markers, responsive)
├── main.js          # Données locations[], init Mapbox, markers, interactions
├── .env             # VITE_MAPBOX_TOKEN (non commité)
├── .env.example     # Template à commiter
└── netlify.toml     # Config build + headers
```
