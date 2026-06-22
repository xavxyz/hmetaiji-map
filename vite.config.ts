import { defineConfig } from "vite";

// `npm run build` enchaîne deux passes de build dans le même dossier `dist` :
//
//  1. Passe `lib` (mode par défaut) : produit le bundle IIFE autonome
//     dist/hmetaiji-map.iife.js (JS + CSS inlinés), clé en main pour
//     l'intégration via <script> dans une page hôte externe.
//
//  2. Passe `page` (`--mode page`) : traite index.html comme une vraie page
//     web et produit dist/index.html + ses assets. `emptyOutDir: false` évite
//     d'effacer le bundle IIFE généré à la passe précédente.
//
// `npm run dev` sert index.html, qui charge embed.ts → développement dans les
// conditions réelles de l'intégration (cross-origin activé).
export default defineConfig(({ mode }) => {
  if (mode === "page") {
    return {
      build: {
        // Ne pas vider dist : on conserve le bundle IIFE de la passe `lib`.
        emptyOutDir: false,
      },
      server: { cors: true },
    };
  }

  return {
    build: {
      lib: {
        entry: "embed.ts",
        name: "HmetaijiMap",
        fileName: "hmetaiji-map",
        formats: ["iife"],
      },
    },
    server: { cors: true },
  };
});
