import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${import.meta.env.VITE_SHEET_ID}/gviz/tq?tqx=out:csv`;

// ─── TYPES ────────────────────────────────────────────────────────────────────

enum Activity {
  COURS_HEBDO        = "COURS HEBDO",
  CYCLE_JOURNEES     = "CYCLE JOURNEES",
  CYCLE_WEEKENDS     = "CYCLE WEEKENDS",
  STAGE_PETIT_CERCLE = "STAGE PETIT CERCLE",
  STAGE_RESIDENTIEL  = "STAGE RESIDENTIEL",
  GROUPE_DE_PRATIQUE = "GROUPE DE PRATIQUE",
}

const ACTIVITY_LABEL: Record<Activity, string> = {
  [Activity.COURS_HEBDO]:        "Cours hebdo",
  [Activity.CYCLE_JOURNEES]:     "Cycle journées",
  [Activity.CYCLE_WEEKENDS]:     "Cycle weekends",
  [Activity.STAGE_PETIT_CERCLE]: "Stage petit cercle",
  [Activity.STAGE_RESIDENTIEL]:  "Stage résidentiel",
  [Activity.GROUPE_DE_PRATIQUE]: "Groupe de pratique",
};

const KNOWN_ACTIVITIES = new Set<string>(Object.values(Activity));

function toActivity(s: string): Activity | null {
  return KNOWN_ACTIVITIES.has(s) ? (s as Activity) : null;
}

interface Location {
  city: string;
  coordinates: [number, number];
  activities: Activity[];
  description: string;
  infos: string[];
  link: string;
}

// ─── MAP ──────────────────────────────────────────────────────────────────────

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/xavxyz/cmq9jsdv8002a01qp4ml05ho4",
  bounds: [
    [-5.5, 41.0], // SW — Pays Basque / Pyrénées
    [9.7, 51.5],  // NE — Ardennes / Alsace (Corse incluse)
  ],
  fitBoundsOptions: { padding: 40 },
});

map.on("load", async () => {
  map.addSource("mapbox-terrain", {
    type: "vector",
    url: "mapbox://xavxyz.9vcx1li9ymy3",
  });

  map.scrollZoom.disable();
  map.dragPan.disable();
  map.dragRotate.disable();
  map.keyboard.disable();
  map.doubleClickZoom.disable();
  map.touchZoomRotate.disable();
  map.touchPitch.disable();
  map.boxZoom.disable();

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

async function loadLocations(): Promise<Location[]> {
  const res = await fetch(SHEET_URL);
  if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
  const csv = await res.text();
  return parseCSV(csv);
}

function parseCSV(csv: string): Location[] {
  const [, ...rows] = csv.trim().split("\n");
  return rows
    .map((row) => {
      const [
        city,
        lng,
        lat,
        activity,
        description,
        infos1,
        infos2,
        infos3,
        link,
      ] = parseRow(row);
      return {
        city,
        coordinates: [parseFloat(lng), parseFloat(lat)] as [number, number],
        activities: activity
          .split(",")
          .map((s) => toActivity(s.trim()))
          .filter((a): a is Activity => a !== null),
        description,
        infos: [infos1, infos2, infos3].filter(Boolean),
        link,
      };
    })
    .filter((loc) => loc.city !== "" && !isNaN(loc.coordinates[0]));
}

function parseRow(row: string): string[] {
  const result: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') {
        field += '"';
        i++;
      } else inQuotes = !inQuotes;
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

const markerTemplate = document.querySelector<HTMLElement>(
  ".placeholder .marker",
)!;

function cloneMarker(): HTMLElement {
  const el = markerTemplate.cloneNode(true) as HTMLElement;
  el.classList.remove("big");
  return el;
}

function createMarkerEl(): HTMLElement {
  return cloneMarker();
}

// Populate static decorative markers (slots are inside .hidden card, so no flash)
document.getElementById("card-marker-slot")!.replaceWith(cloneMarker());
const infosMarker = cloneMarker();
infosMarker.classList.add("sm");
document.getElementById("infos-marker-slot")!.replaceWith(infosMarker);

interface MarkerEntry {
  marker: mapboxgl.Marker;
  el: HTMLElement;
  location: Location;
  visible: boolean;
}

let markerEntries: MarkerEntry[] = [];

function addMarkers(locations: Location[]): void {
  markerEntries = locations.map((location) => {
    const el = createMarkerEl();
    const marker = new mapboxgl.Marker(el).setLngLat(location.coordinates);
    el.addEventListener("click", () => {
      setActiveMarker(el);
      showCard(location);
    });
    return { marker, el, location, visible: false };
  });
  applyFilters();
}

// ─── FILTERS ──────────────────────────────────────────────────────────────────

const activeFilters = new Set<Activity>(Object.values(Activity));

const filterContainer = document.querySelector<HTMLElement>(".filter-buttons")!;
(Object.values(Activity) as Activity[]).forEach((activity) => {
  const btn = document.createElement("button");
  btn.className = "filter-btn active";
  btn.dataset.filter = activity;
  btn.textContent = ACTIVITY_LABEL[activity];
  btn.addEventListener("click", () => {
    if (activeFilters.has(activity)) {
      activeFilters.delete(activity);
      btn.classList.remove("active");
    } else {
      activeFilters.add(activity);
      btn.classList.add("active");
    }
    applyFilters();
  });
  filterContainer.appendChild(btn);
});

function applyFilters(): void {
  markerEntries.forEach((entry) => {
    // Locations with no recognized activity are always visible
    const { activities } = entry.location;
    const shouldShow =
      activities.length === 0 || activities.some((a) => activeFilters.has(a));
    if (shouldShow === entry.visible) return;
    entry.visible = shouldShow;
    if (shouldShow) {
      entry.marker.addTo(map);
    } else {
      entry.marker.remove();
      if (entry.el === activeMarker) hideCard();
    }
  });
}

// ─── LOADER ───────────────────────────────────────────────────────────────────

function showLoader(): void {
  const overlay = document.createElement("div");
  overlay.id = "map-loader";
  const markerEl = cloneMarker();
  markerEl.classList.add("loading");
  overlay.appendChild(markerEl);
  document.getElementById("map")!.appendChild(overlay);
}

function hideLoader(): void {
  document.getElementById("map-loader")?.remove();
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

const placeholder = document.getElementById("placeholder")!;
const card = document.getElementById("location-card")!;

const fields = {
  title: document.getElementById("title")!,
  activities: document.getElementById("activities")!,
  description: document.getElementById("description")!,
  infos: document.getElementById("infos")!,
  link: document.getElementById("link") as HTMLAnchorElement,
};

let activeMarker: HTMLElement | null = null;

function setActiveMarker(el: HTMLElement | null): void {
  activeMarker?.classList.remove("active");
  el?.classList.add("active");
  activeMarker = el;
}

function showCard(location: Location): void {
  fields.title.textContent = location.city;
  fields.activities.replaceChildren(
    ...location.activities.map((act) => {
      const banner = document.createElement("div");
      banner.className = "activity-banner";
      banner.textContent = act;
      return banner;
    }),
  );
  fields.description.textContent = location.description;
  fields.infos.replaceChildren(
    ...location.infos.map((info) => {
      const li = document.createElement("li");
      li.textContent = info;
      return li;
    }),
  );
  fields.link.href = location.link;
  placeholder.classList.add("hidden");
  card.classList.remove("hidden");
}

function hideCard(): void {
  card.classList.add("hidden");
  placeholder.classList.remove("hidden");
  setActiveMarker(null);
}

document.getElementById("close-btn")!.addEventListener("click", hideCard);
