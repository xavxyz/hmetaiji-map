# hmetaiji-map

Carte interactive des lieux de pratique, construite en HTML / CSS / Vanilla JS avec [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) pour https://hmetaiji.fr.

## Prérequis

- Node.js ≥ 18
- Un token Mapbox ([account.mapbox.com](https://account.mapbox.com))
- Une Google Sheet partagée en "Tout le monde avec le lien peut voir"

## Installation

```bash
cp .env.example .env
# Renseigner VITE_MAPBOX_TOKEN et VITE_SHEET_ID dans .env
npm install
```

## Intégration (sans iframe)

L'app s'injecte dans n'importe quelle page via une simple balise `<script>`. La
page hôte n'a besoin que d'un conteneur vide — le bundle crée sa structure HTML
et injecte ses styles lui-même.

```html
<div id="hmetaiji-map"></div>
<script src="/chemin/vers/hmetaiji-map.iife.js"></script>
```

Il n'y a qu'**un seul mode** : développement, build et production utilisent le
même point d'entrée (`embed.ts`). On développe donc directement dans les
conditions réelles de l'intégration.

## Développement local

```bash
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173) : `index.html` est une page
hôte minimale qui charge `embed.ts`. Le serveur autorise le cross-origin, donc
une page hôte distante peut aussi pointer dessus :

```html
<div id="hmetaiji-map"></div>
<script type="module" src="http://localhost:5173/embed.ts"></script>
```

## Build

```bash
npm run build      # génère dist/hmetaiji-map.iife.js (JS + CSS inlinés)
npm run preview    # prévisualise le build en local
```

`VITE_MAPBOX_TOKEN` et `VITE_SHEET_ID` sont bakés dans le bundle au build :
restreindre le token Mapbox par domaine depuis le dashboard Mapbox.

## Déploiement (Netlify)

Le build est configuré dans `netlify.toml` (`npx vite build` → `dist/`). En mode
embed, `dist/` ne contient que le bundle `hmetaiji-map.iife.js` : Netlify sert
donc le bundle comme un CDN, et le site externe (hmetaiji.fr) le référence via
son propre `<script>`.

Ajouter les variables d'environnement dans Netlify :  
**Site settings → Environment variables → `VITE_MAPBOX_TOKEN`** et **`VITE_SHEET_ID`**

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
├── index.html       # Page hôte de dev (conteneur #hmetaiji-map + script vers embed.ts)
├── style.css        # Styles (variables, carte, fiche lieu, markers, filtres, responsive)
├── app.ts           # Logique partagée : mount(container) + génération HTML + injection CSS
├── embed.ts         # Point d'entrée unique (dev = build = prod)
├── vite.config.ts   # Config Vite : dev cross-origin + build IIFE autonome
├── .env             # VITE_MAPBOX_TOKEN (non commité)
├── .env.example     # Template à commiter
└── netlify.toml     # Config build + headers
```
