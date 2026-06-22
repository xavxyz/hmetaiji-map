import mapboxgl from "mapbox-gl";
import mapboxCss from "mapbox-gl/dist/mapbox-gl.css?inline";
import appCss from "./style.css?inline";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${import.meta.env.VITE_SHEET_ID}/gviz/tq?tqx=out:csv`;

// ─── TYPES ────────────────────────────────────────────────────────────────────

enum Activity {
  COURS_HEBDO = "COURS HEBDO",
  CYCLE_JOURNEES = "CYCLE JOURNEES",
  CYCLE_WEEKENDS = "CYCLE WEEKENDS",
  STAGE_PETIT_CERCLE = "STAGE PETIT CERCLE",
  STAGE_RESIDENTIEL = "STAGE RESIDENTIEL",
  GROUPE_DE_PRATIQUE = "GROUPE DE PRATIQUE",
}

const ACTIVITY_LABEL: Record<Activity, string> = {
  [Activity.COURS_HEBDO]: "Cours hebdo",
  [Activity.CYCLE_JOURNEES]: "Cycle journées",
  [Activity.CYCLE_WEEKENDS]: "Cycle weekends",
  [Activity.STAGE_PETIT_CERCLE]: "Stage petit cercle",
  [Activity.STAGE_RESIDENTIEL]: "Stage résidentiel",
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

// ─── TEMPLATE ───────────────────────────────────────────────────────────────────

const MARKER_SVG = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-40 -40 560 560"
    class="marker-svg"
  >
    <circle class="marker-circle" cx="241.22" cy="247.46" r="270" />
    <path
      class="marker-symbol"
      d="M482.26,310.18c-2.58,16.97-9.55,32.33-17.37,47.38-9.86,18.96-19.49,38.11-33.24,54.63-20.27,24.37-45.63,42.3-73.96,56.06-48.12,23.37-98.9,31.57-151.75,23.87-54.96-8.01-100.58-34.38-138.3-74.66-28.39-30.31-48.24-65.63-58.96-105.76-11.1-41.58-11.65-83.58-1.11-125.28C24.58,119.09,64.06,68.28,123.76,33.32,163.39,10.12,206.52-.89,252.44.06c27.11.56,53.24,6.91,78.87,15.43,4.19,1.39,8.38,2.78,12.5,4.14.13,2.08-1.96,1.25-2.62,2.4,6.35,4.62,13.53,7.8,20.35,11.6,10,5.57,19.85,11.34,25.75,21.77l.17-.04c-1.38,1.69-2.4.08-3.42-.47-4.71-2.59-9.36-5.28-14.04-7.93-18.89-11.44-38.74-20.45-60.61-24.35,19.52,7.8,39.4,14.72,57.41,25.85,1.94,1.55,3.87,3.09,5.81,4.64q3.4,2.72-.49,5.14c10.49,10.7,23.28,18.68,34.11,28.96,1.16,1.1,2.31,2.21,3.38,3.4,1.22,1.36,3.1,2.25,1.07,4.83-1.12,1.42,1.04,3.53,2.13,5.1,6.79,9.78,14.96,18.49,21.38,28.6,22.49,35.41,34.49,73.8,34.06,115.9-.01,1.06.16,2.12.24,3.18-.69,2.25-.62,4.46-.02,7.44,2.94-2.63,1.28-5.27,1.89-7.43,3.5.2,1.9,2.91,1.92,4.43.15,10.81.08,21.63.08,32.67,2.32-1.06.64-3.08,2.02-4.71,5.93,10.57-3.65,20-1.57,30.94,5.92-8.11,5.1-17.35,7.51-26.01,5.02,7.59-.5,14.49-.38,21.51-.4.34-.81.68-1.21,1.02-.63.13-.97.43-.72,1.13-2.44,11.74-6.95,22.76-11.74,33.67-3.71,8.46-7.75,16.77-11.82,25.53,1.04-.35,1.71-.36,2-.7.92-1.07,1.8-2.22,2.53-3.43,9.56-15.81,15.96-32.87,19.87-50.87.47-2.14,1.27-3.16,3.38-3.18ZM434.43,360.7c6.34-12.13,11.66-23.77,16.26-35.74,13.92-36.21,17.95-73.67,12.54-111.9-6.15-43.47-25.92-80.73-55.39-112.82-28.89-31.45-63.92-53.13-105.65-63.27-24.81-6.03-49.99-6.99-75.37-4.82-18.19,1.56-35.92,5.17-53.15,11.22-31.93,11.22-58.89,30-81.98,54.44-37.89,40.11-59.13,87.71-61.97,142.92-2.59,50.47,12.28,95.89,41.99,136.62,23.75,32.56,53.75,57.42,91.08,72.78,45.33,18.65,92.04,21.28,139.32,9,47.93-12.45,87.85-37.36,116.76-78.38.9-1.28,2.82-2.54,2.2-4.02-.85-2-3.18-.86-4.8-.86-41.19-.07-82.38.36-123.56-.26-16.95-.26-34.15,3.24-50.94-3.32-7-2.74-15.24-.51-22.78-2.16-3.2-.7-6.55-1.11-9.19-4.87,21.54-2.21,42.56-.1,63.29-3.08-6.84-1.74-13.77-1.55-20.65-1.65-10.34-.15-20.68,0-31.02-.08-1.64-.01-5.08.48-3.37-2.61,2.81-5.08-1.17-3.53-3.07-3.55-10.16-.12-20.33-.01-30.49-.11-1.32-.01-4.24.72-3.61-1.41,1.28-4.28-1.5-2.96-3.27-2.96-23-.04-46,0-69-.07-4.43-.01-7,1.56-8.53,6.01-1.28,3.72-2.49,8.04-7.23,10.05.31-4.2,3.13-6.75,4.49-9.95,2.27-5.31,1.69-6.2-3.91-6.14-3.03.03-6.06.28-9.08.21-2.03-.04-4.25-.11-5.39-3.06,4.99,0,9.57.03,14.14-.02,1.21-.01,3.27.05,3.5-.5,2.64-6.55,9.23-12.34,7.87-19.41-1.19-6.17,1.29-9.47,4.12-13.63,1.69-2.48,3.87-5.33.84-8.57q-7.83,12.29-11.43,12.96c4.99-5.9,5.57-12.96,10.33-18.62,6.7-7.97,12.12-17.16,16.23-26.89.67-1.58,2.04-3.35.74-5.73-7.49,10.39-11.74,22.59-20.07,32.12-.46-.85-.29-1.3-.06-1.71,20.07-36.08,39.73-72.39,60.42-108.13,21.5-37.13,43.4-74.04,63.27-112.09,5.58-10.68,11.46-21.17,19.97-30.71,58.77,106.85,121.94,210.49,185.58,314.79ZM387.44,345.46c-45.94-81.08-91.98-161.05-140.1-240.6-47.87,80.31-94.7,160.29-139.97,241.96,93.56-1.29,186.32-1.74,280.07-1.36Z"
    />
    <path
      class="marker-symbol"
      d="M387.29,55.4c.01.32.02.64.03.96-.19-.16-.37-.31-.56-.47.22-.17.43-.34.67-.52.02,0-.15.04-.15.04Z"
    />
  </svg>`;

// Texte d'invite affiché à la place du titre dans l'état placeholder.
const PLACEHOLDER_HTML =
  "<strong>Clique sur la carte</strong> pour en savoir plus sur les lieux de pratique et les activités concernées.";

const TEMPLATE = `
  <div class="app">
    <div class="map-wrap">
      <div id="map"></div>

      <div id="location-card" class="location-card placeholder-mode">
        <!-- Le marker reste fixe en haut à gauche et ne participe pas au fondu. -->
        <div id="card-marker-slot" class="marker">${MARKER_SVG}</div>

        <div class="card-content">
          <button id="close-btn" class="close-btn">×</button>

          <div class="header">
            <h1 id="title"></h1>
          </div>

          <div class="section">
            <div id="activities"></div>
            <p id="description"></p>
          </div>

          <div class="section">
            <h4 class="section-title">
              Infos pratiques
            </h4>
            <ul id="infos"></ul>
          </div>

          <a id="link" href="#" class="btn">EN SAVOIR PLUS</a>
        </div>
      </div>
    </div>
  </div>

  <nav class="filter-bar">
    <p class="filter-label">
      Tu peux également <strong>filtrer les lieux</strong> selon les types
      d'activités qui t'intéressent :
    </p>
    <div class="filter-buttons"></div>
  </nav>`;

// ─── STYLES ───────────────────────────────────────────────────────────────────

let stylesInjected = false;

function injectStyles(): void {
  if (stylesInjected) return;
  for (const css of [mapboxCss, appCss]) {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }
  stylesInjected = true;
}

// ─── MOUNT ──────────────────────────────────────────────────────────────────────

export function mount(container: HTMLElement): void {
  injectStyles();
  container.innerHTML = TEMPLATE;

  const mapEl = container.querySelector<HTMLElement>("#map")!;
  const card = container.querySelector<HTMLElement>("#location-card")!;
  const cardContent = container.querySelector<HTMLElement>(".card-content")!;
  const markerTemplate =
    container.querySelector<HTMLElement>("#card-marker-slot")!;

  // L'état initial est le placeholder : l'invite occupe la place du titre.
  card.querySelector<HTMLElement>("#title")!.innerHTML = PLACEHOLDER_HTML;

  // ─── MAP ──────────────────────────────────────────────────────────────────

  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

  const map = new mapboxgl.Map({
    container: mapEl,
    style: "mapbox://styles/xavxyz/cmq9jsdv8002a01qp4ml05ho4",
    bounds: [
      [-5.5, 41.0], // SW — Pays Basque / Pyrénées
      [9.7, 51.5], // NE — Ardennes / Alsace (Corse incluse)
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

  // ─── MARKERS ────────────────────────────────────────────────────────────────

  function cloneMarker(): HTMLElement {
    const el = markerTemplate.cloneNode(true) as HTMLElement;
    el.removeAttribute("id");
    el.classList.remove("sm");
    return el;
  }

  function createMarkerEl(): HTMLElement {
    return cloneMarker();
  }

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

  // ─── FILTERS ────────────────────────────────────────────────────────────────

  const activeFilters = new Set<Activity>(Object.values(Activity));

  const filterContainer =
    container.querySelector<HTMLElement>(".filter-buttons")!;
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

  // ─── LOADER ─────────────────────────────────────────────────────────────────

  function showLoader(): void {
    const overlay = document.createElement("div");
    overlay.id = "map-loader";
    const markerEl = cloneMarker();
    markerEl.classList.add("loading");
    overlay.appendChild(markerEl);
    mapEl.appendChild(overlay);
  }

  function hideLoader(): void {
    mapEl.querySelector("#map-loader")?.remove();
  }

  // ─── CARTE / FICHE UNIFIÉES ───────────────────────────────────────────────
  // Un seul élément bascule entre l'état "placeholder" et l'état "fiche".
  // Séquence d'animation (t = interaction) :
  //   • fade-out du contenu (ease-in, 200 ms) — le marker top-left reste fixe
  //   • transition de taille (200 ms, délai 100 ms)
  //   • fade-in du nouveau contenu (ease-out, 400 ms, délai 200 ms)

  const FADE_OUT_MS = 200;
  const SIZE_MS = 200;
  const SIZE_DELAY = 100;
  const FADE_IN_MS = 400;
  const FADE_IN_DELAY = 200;

  let morphTimers: number[] = [];

  function morphCard(apply: () => void): void {
    morphTimers.forEach((t) => window.clearTimeout(t));
    morphTimers = [];

    const startH = card.offsetHeight;

    // Pré-mesure de la hauteur cible sans repeindre le nouveau contenu :
    // on applique, on mesure, puis on restaure l'état courant dans la même
    // tâche JS (aucune peinture intermédiaire).
    const savedHTML = cardContent.innerHTML;
    const wasPlaceholder = card.classList.contains("placeholder-mode");
    card.style.transition = "none";
    card.style.height = "";
    apply();
    const endH = card.offsetHeight;
    cardContent.innerHTML = savedHTML;
    card.classList.toggle("placeholder-mode", wasPlaceholder);

    // Verrouille la hauteur de départ, contenu pleinement visible.
    cardContent.style.transition = "none";
    cardContent.style.opacity = "1";
    card.style.height = `${startH}px`;
    void card.offsetHeight; // reflow

    // Fade-out du contenu courant (ease-in).
    cardContent.style.transition = `opacity ${FADE_OUT_MS}ms ease-in`;
    cardContent.style.opacity = "0";

    // Transition de taille (démarre à SIZE_DELAY).
    card.style.transition = `height ${SIZE_MS}ms ease ${SIZE_DELAY}ms`;
    card.style.height = `${endH}px`;

    // Bascule du contenu (invisible) puis fade-in (ease-out).
    morphTimers.push(
      window.setTimeout(() => {
        apply();
        cardContent.style.transition = `opacity ${FADE_IN_MS}ms ease-out`;
        cardContent.style.opacity = "1";
      }, FADE_IN_DELAY),
    );

    // Libère la hauteur explicite pour laisser le contenu se redimensionner.
    morphTimers.push(
      window.setTimeout(
        () => {
          card.style.transition = "";
          card.style.height = "";
          cardContent.style.transition = "";
        },
        FADE_IN_DELAY + FADE_IN_MS + 20,
      ),
    );
  }

  function fillFull(location: Location): void {
    card.classList.remove("placeholder-mode");
    card.querySelector<HTMLElement>("#title")!.textContent = location.city;
    card.querySelector<HTMLElement>("#activities")!.replaceChildren(
      ...location.activities.map((act) => {
        const banner = document.createElement("div");
        banner.className = "activity-banner";
        banner.textContent = act;
        return banner;
      }),
    );
    card.querySelector<HTMLElement>("#description")!.textContent =
      location.description;
    card.querySelector<HTMLElement>("#infos")!.replaceChildren(
      ...location.infos.map((info) => {
        const li = document.createElement("li");
        li.textContent = info;
        return li;
      }),
    );
    card.querySelector<HTMLAnchorElement>("#link")!.href = location.link;
  }

  function fillPlaceholder(): void {
    card.classList.add("placeholder-mode");
    card.querySelector<HTMLElement>("#title")!.innerHTML = PLACEHOLDER_HTML;
  }

  let activeMarker: HTMLElement | null = null;

  function setActiveMarker(el: HTMLElement | null): void {
    activeMarker?.classList.remove("active");
    el?.classList.add("active");
    activeMarker = el;
  }

  function showCard(location: Location): void {
    morphCard(() => fillFull(location));
  }

  function hideCard(): void {
    morphCard(fillPlaceholder);
    setActiveMarker(null);
  }

  // Délégation : le bouton de fermeture est recréé lors des bascules de contenu.
  card.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("#close-btn")) hideCard();
  });

  // Tout clic en dehors de la card (quand elle affiche une fiche) la referme.
  // On ignore les clics sur un marker, qui basculent vers une autre fiche.
  document.addEventListener("click", (e) => {
    if (card.classList.contains("placeholder-mode")) return;
    const target = e.target as HTMLElement;
    if (target.closest("#location-card") || target.closest(".mapboxgl-marker"))
      return;
    hideCard();
  });
}
