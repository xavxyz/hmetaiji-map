// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${import.meta.env.VITE_SHEET_ID}/gviz/tq?tqx=out:csv`;

// ─── MAP ──────────────────────────────────────────────────────────────────────

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/xavxyz/cmq9jsdv8002a01qp4ml05ho4",
  center: [2.2, 46.5],
  zoom: 5.2,
});

map.on("load", async () => {
  map.addSource("mapbox-terrain", {
    type: "vector",
    url: "mapbox://xavxyz.9vcx1li9ymy3",
  });
  map.scrollZoom.disable();

  showLoader();
  try {
    const locations = await loadLocations();
    addMarkers(locations);
  } catch (err) {
    console.error("Erreur lors du chargement des données :", err);
  } finally {
    hideLoader();
  }
});

// ─── DATA ─────────────────────────────────────────────────────────────────────

async function loadLocations() {
  const res = await fetch(SHEET_URL);
  if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
  const csv = await res.text();
  return parseCSV(csv);
}

function parseCSV(csv) {
  const [, ...rows] = csv.trim().split("\n"); // ignore la ligne de headers
  return rows
    .map((row) => {
      const [city, lat, lng, activity, description, infos1, infos2, infos3, link] =
        parseRow(row);
      return {
        city,
        coordinates: [parseFloat(lng), parseFloat(lat)],
        activity,
        description,
        infos: [infos1, infos2, infos3].filter(Boolean),
        link,
      };
    })
    .filter((loc) => loc.city && !isNaN(parseFloat(lat)));
}

function parseRow(row) {
  const result = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') { field += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(field.trim());
      field = "";
    } else {
      field += ch;
    }
  }
  result.push(field.trim());
  return result;
}

// ─── MARKERS ──────────────────────────────────────────────────────────────────

const markerTemplate = document.querySelector(".placeholder .marker");

function createMarkerEl() {
  const el = markerTemplate.cloneNode(true);
  el.classList.remove("big");
  return el;
}

function addMarkers(locations) {
  locations.forEach((location) => {
    const el = createMarkerEl();
    el.addEventListener("click", () => {
      setActiveMarker(el);
      showCard(location);
    });
    new mapboxgl.Marker(el).setLngLat(location.coordinates).addTo(map);
  });
}

// ─── LOADER ───────────────────────────────────────────────────────────────────

function showLoader() {
  map.dragPan.disable();
  map.keyboard.disable();
  map.doubleClickZoom.disable();
  map.touchZoomRotate.disable();

  const overlay = document.createElement("div");
  overlay.id = "map-loader";
  const markerEl = markerTemplate.cloneNode(true);
  markerEl.classList.add("loading");
  overlay.appendChild(markerEl);
  document.getElementById("map").appendChild(overlay);
}

function hideLoader() {
  document.getElementById("map-loader")?.remove();
  map.dragPan.enable();
  map.keyboard.enable();
  map.doubleClickZoom.enable();
  map.touchZoomRotate.enable();
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

const placeholder = document.getElementById("placeholder");
const card = document.getElementById("location-card");

const fields = {
  title: document.getElementById("title"),
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
  fields.activity.textContent = location.activity;
  fields.description.textContent = location.description;
  fields.infos.replaceChildren(
    ...location.infos.map((info) => {
      const li = document.createElement("li");
      li.textContent = info;
      return li;
    })
  );
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
