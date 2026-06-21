// ─── DATA ─────────────────────────────────────────────────────────────────────

const LOCATIONS = [
  {
    id: 1,
    city: "Avignon",
    coordinates: [4.8055, 43.9493],
    address: "5 Rue Louis Pasteur, 84000 Avignon",
    activity: "Cycle Journées",
    description:
      "Cycle de journées de Taijiquan : Ji Ben Gong, Zhan Zhuang, Song Gong, Forme.",
    infos: "10h à 12h30 - 14h à 16h30. Parking gratuit.",
    link: "/avignon",
  },
  {
    id: 2,
    city: "Lyon",
    coordinates: [4.8357, 45.764],
    address: "Lyon",
    activity: "Cours hebdomadaires",
    description: "Cours réguliers de Taijiquan tous les lundi.",
    infos: "20h - 21h30",
    link: "/lyon",
  },
];

// ─── MAP ──────────────────────────────────────────────────────────────────────

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/xavxyz/cmq9jsdv8002a01qp4ml05ho4",
  center: [2.2, 46.5],
  zoom: 5.2,
});

map.on("load", () => {
  map.addSource("mapbox-terrain", {
    type: "vector",
    url: "mapbox://xavxyz.9vcx1li9ymy3",
  });
  map.scrollZoom.disable();
});

// ─── MARKERS ──────────────────────────────────────────────────────────────────

// Clone le marker SVG depuis le placeholder — une seule source de vérité dans le HTML.
const markerTemplate = document.querySelector(".placeholder .marker");

function createMarkerEl() {
  const el = markerTemplate.cloneNode(true);
  el.classList.remove("big");
  return el;
}

LOCATIONS.forEach((location) => {
  const el = createMarkerEl();
  el.addEventListener("click", () => {
    setActiveMarker(el);
    showCard(location);
  });
  new mapboxgl.Marker(el).setLngLat(location.coordinates).addTo(map);
});

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

const placeholder = document.getElementById("placeholder");
const card = document.getElementById("location-card");

const fields = {
  title: document.getElementById("title"),
  address: document.getElementById("address"),
  activity: document.getElementById("activity"),
  description: document.getElementById("description"),
  infos: document.getElementById("infos"),
  link: document.getElementById("link"),
};

let activeMarker = null;

function setActiveMarker(el) {
  activeMarker?.classList.remove("active");
  el?.classList.add("active");
  activeMarker = el;
}

function showCard(location) {
  fields.title.textContent = location.city;
  fields.address.textContent = location.address;
  fields.activity.textContent = location.activity;
  fields.description.textContent = location.description;
  fields.infos.textContent = location.infos;
  fields.link.href = location.link;

  placeholder.classList.add("hidden");
  card.classList.remove("hidden");
}

function hideCard() {
  card.classList.add("hidden");
  placeholder.classList.remove("hidden");
  setActiveMarker(null);
}

document.getElementById("close-btn").addEventListener("click", hideCard);
