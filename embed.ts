import { mount } from "./app";

// Point d'entrée embed : injecté dans une page hôte via <script>.
// La page doit contenir <div id="hmetaiji-map"></div>.
const container = document.getElementById("hmetaiji-map");

if (container) {
  mount(container);
} else {
  console.error(
    '[hmetaiji-map] Conteneur introuvable. Ajoutez <div id="hmetaiji-map"></div> à la page.',
  );
}
