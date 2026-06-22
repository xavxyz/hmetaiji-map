import { defineConfig } from "vite";

// Un seul mode : dev = embed = prod.
// - `npm run dev` sert index.html, qui charge embed.ts → on développe dans les
//   conditions réelles de l'intégration (cross-origin activé pour une page hôte
//   distante pointant vers http://localhost:5173/embed.ts).
// - `npm run build` produit le bundle IIFE autonome dist/hmetaiji-map.iife.js
//   (JS + CSS inlinés), clé en main pour la page hôte externe.
export default defineConfig({
  build: {
    lib: {
      entry: "embed.ts",
      name: "HmetaijiMap",
      fileName: "hmetaiji-map",
      formats: ["iife"],
    },
  },
  server: { cors: true },
});
