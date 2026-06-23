import mapboxgl from "mapbox-gl";
import mapboxCss from "mapbox-gl/dist/mapbox-gl.css?inline";
import appCss from "./style.css?inline";

import picto1 from "./assets/pictos/picto-1.png";
import picto2 from "./assets/pictos/picto-2.png";
import picto3 from "./assets/pictos/picto-3.png";
import picto4 from "./assets/pictos/picto-4.png";
import picto5 from "./assets/pictos/picto-5.png";
import picto6 from "./assets/pictos/picto-6.png";
import picto7 from "./assets/pictos/picto-7.png";
import groupIcon from "./assets/groupes-icon.jpg";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SHEET_BASE = `https://docs.google.com/spreadsheets/d/${import.meta.env.VITE_SHEET_ID}/gviz/tq?tqx=out:csv`;

// Onglet « lieux » = première feuille (par défaut) ; onglet « groupes » ciblé par gid.
const SHEET_URL = SHEET_BASE;
const GROUPS_GID = import.meta.env.VITE_GROUPS_GID;
const GROUPS_SHEET_URL = GROUPS_GID
  ? `${SHEET_BASE}&gid=${encodeURIComponent(GROUPS_GID)}`
  : null;

// Pictogramme attribué à chaque groupe d'après l'index de sa ligne dans l'onglet.
const PICTOS = [picto1, picto2, picto3, picto4, picto5, picto6, picto7];

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

interface TrainingGroup {
  region: string;
  departement: string;
  coordinates: [number, number];
  responsable: string;
  email: string;
  telephone: string;
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

async function loadGroups(): Promise<TrainingGroup[]> {
  if (!GROUPS_SHEET_URL) return [];
  const res = await fetch(GROUPS_SHEET_URL);
  if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
  const csv = await res.text();
  return parseGroupsCSV(csv);
}

function parseGroupsCSV(csv: string): TrainingGroup[] {
  const [, ...rows] = csv.trim().split("\n");
  return rows
    .map((row) => {
      const [region, departement, lng, lat, responsable, email, telephone] =
        parseRow(row);
      return {
        region,
        departement,
        coordinates: [parseFloat(lng), parseFloat(lat)] as [number, number],
        responsable,
        email,
        telephone,
      };
    })
    .filter((g) => g.region !== "" && !isNaN(g.coordinates[0]));
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

const TEMPLATE = `
  <div class="app">
    <div class="map-wrap">
      <div id="location-card" class="location-card card-closed">
        <div id="card-marker-slot" class="marker big">${MARKER_SVG}</div>

        <div class="card-content">
          <a href="#" id="close-btn" class="close-btn elementor-button elementor-button-link elementor-size-sm">×</a>

          <div class="header">
            <h1 id="title"></h1>
          </div>

          <div class="section loc-only">
            <div id="activities"></div>
            <p id="description"></p>
          </div>

          <div class="section loc-only">
            <h4 class="section-title">
              Infos pratiques
            </h4>
            <ul id="infos"></ul>
          </div>

          <a id="link" href="#" class="btn elementor-button elementor-button-link elementor-size-sm loc-only">EN SAVOIR PLUS</a>

          <div class="section group-only">
            <div id="group-region" class="activity-banner"></div>
            <p id="group-responsable" class="section-content"></p>
            <a id="group-email" class="btn elementor-button elementor-button-link elementor-size-sm"></a>
            <a id="group-tel" class="btn btn-secondary elementor-button elementor-button-link elementor-size-sm"></a>
          </div>
        </div>
      </div>

      <div id="map"></div>
    </div>
  </div>

  <nav class="filter-bar">
    <p class="filter-label">
      Vous pouvez également <strong>filtrer les lieux</strong> selon les types
      d'activités qui vous intéressent :
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

  // Logo affiché à la place du marker d'en-tête en mode groupes.
  card.style.setProperty("--group-icon", `url(${groupIcon})`);

  // ─── MAP ──────────────────────────────────────────────────────────────────

  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

  const map = new mapboxgl.Map({
    container: mapEl,
    style: "mapbox://styles/xavxyz/cmq9jsdv8002a01qp4ml05ho4",
    bounds: [
      [-4.9, 42.2], // SW — Finistère / Cerbère (Pyrénées)
      [8.3, 51.1], // NE — Alsace / Dunkerque
    ],
    fitBoundsOptions: { padding: 40 },
  });

  showLoader();

  map.on("load", async () => {
    map.scrollZoom.disable();
    map.dragPan.disable();
    map.dragRotate.disable();
    map.keyboard.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();
    map.touchPitch.disable();
    map.boxZoom.disable();

    try {
      const [locations, groups] = await Promise.all([
        loadLocations(),
        loadGroups(),
      ]);
      addMarkers(locations);
      addGroupMarkers(groups);
      syncFilterButtons();
      render();
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
  }

  // ─── GROUP MARKERS ────────────────────────────────────────────────────────

  function pictoFor(index: number): string {
    return PICTOS[index % PICTOS.length];
  }

  function createGroupMarkerEl(index: number): HTMLElement {
    const el = document.createElement("div");
    el.className = "group-marker";
    el.style.setProperty("--picto", `url(${pictoFor(index)})`);
    return el;
  }

  interface GroupEntry {
    marker: mapboxgl.Marker;
    el: HTMLElement;
    group: TrainingGroup;
    index: number;
    visible: boolean;
  }

  let groupEntries: GroupEntry[] = [];

  function addGroupMarkers(groups: TrainingGroup[]): void {
    groupEntries = groups.map((group, index) => {
      const el = createGroupMarkerEl(index);
      const marker = new mapboxgl.Marker(el).setLngLat(group.coordinates);
      el.addEventListener("click", () => {
        setActiveMarker(el);
        showGroupCard(group);
      });
      return { marker, el, group, index, visible: false };
    });
  }

  // ─── FILTERS ────────────────────────────────────────────────────────────────
  // Le filtre « Groupe de pratique » n'est pas un filtre d'activité comme les
  // autres : il bascule sur la couche des groupes d'entraînement. Il est
  // mutuellement exclusif avec les filtres de lieux — sélectionner « Groupe de
  // pratique » masque les lieux et affiche les groupes ; sélectionner n'importe
  // quel autre filtre masque les groupes et revient aux lieux.

  const GROUP_FILTER = Activity.GROUPE_DE_PRATIQUE;
  const LOCATION_ACTIVITIES = (Object.values(Activity) as Activity[]).filter(
    (a) => a !== GROUP_FILTER,
  );

  let groupsMode = false;
  const activeFilters = new Set<Activity>(LOCATION_ACTIVITIES);

  const filterContainer =
    container.querySelector<HTMLElement>(".filter-buttons")!;
  const filterButtons = new Map<Activity, HTMLButtonElement>();

  (Object.values(Activity) as Activity[]).forEach((activity) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.dataset.filter = activity;
    btn.textContent = ACTIVITY_LABEL[activity];
    btn.addEventListener("click", () => onFilterClick(activity));
    filterButtons.set(activity, btn);
    filterContainer.appendChild(btn);
  });

  function onFilterClick(activity: Activity): void {
    const wasGroupsMode = groupsMode;
    if (activity === GROUP_FILTER) {
      groupsMode = !groupsMode;
    } else if (groupsMode) {
      // On quitte la couche groupes en activant uniquement le filtre cliqué.
      groupsMode = false;
      activeFilters.clear();
      activeFilters.add(activity);
    } else if (activeFilters.size === 1 && activeFilters.has(activity)) {
      // Re-clic sur le filtre déjà seul actif → on réaffiche tous les lieux.
      LOCATION_ACTIVITIES.forEach((a) => activeFilters.add(a));
    } else {
      // Un clic n'affiche que ce filtre et désactive tous les autres.
      activeFilters.clear();
      activeFilters.add(activity);
    }
    if (groupsMode !== wasGroupsMode) hideCard();
    syncFilterButtons();
    render();
  }

  function syncFilterButtons(): void {
    filterButtons.forEach((btn, activity) => {
      const active =
        activity === GROUP_FILTER
          ? groupsMode
          : !groupsMode && activeFilters.has(activity);
      btn.classList.toggle("active", active);
    });
  }

  // ─── RENDER (couches mutuellement exclusives) ───────────────────────────────

  function render(): void {
    if (groupsMode) {
      setLocationsVisible(false);
      setGroupsVisible(true);
    } else {
      setGroupsVisible(false);
      applyLocationFilters();
    }
  }

  function setGroupsVisible(visible: boolean): void {
    groupEntries.forEach((entry) => {
      if (visible === entry.visible) return;
      entry.visible = visible;
      if (visible) entry.marker.addTo(map);
      else entry.marker.remove();
    });
  }

  function setLocationsVisible(visible: boolean): void {
    markerEntries.forEach((entry) => {
      if (visible === entry.visible) return;
      entry.visible = visible;
      if (visible) entry.marker.addTo(map);
      else entry.marker.remove();
    });
  }

  function applyLocationFilters(): void {
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
  const FADE_IN_MS = 400;

  let morphTimers: number[] = [];

  function morphCard(apply: () => void): void {
    morphTimers.forEach((t) => window.clearTimeout(t));
    morphTimers = [];

    card.style.transition = `opacity ${FADE_OUT_MS}ms ease-in`;
    card.style.opacity = "0";

    morphTimers.push(
      window.setTimeout(() => {
        apply();
        card.style.transition = `opacity ${FADE_IN_MS}ms ease-out`;
        card.style.opacity = "1";
        morphTimers.push(
          window.setTimeout(() => {
            card.style.transition = "";
          }, FADE_IN_MS + 20),
        );
      }, FADE_OUT_MS),
    );
  }

  // Bascule l'affichage des blocs lieu/groupe au sein de la card (styles inline
  // sur des enfants de .card-content → sauvegardés/restaurés par morphCard).
  function showOnly(kind: "loc" | "group" | "none"): void {
    cardContent.querySelectorAll<HTMLElement>(".loc-only").forEach((el) => {
      el.style.display = kind === "loc" ? "" : "none";
    });
    cardContent.querySelectorAll<HTMLElement>(".group-only").forEach((el) => {
      el.style.display = kind === "group" ? "" : "none";
    });
  }

  function fillFull(location: Location): void {
    card.classList.remove("placeholder-mode");
    card.classList.remove("group-mode");
    showOnly("loc");
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
        const colonIdx = info.indexOf(" : ");
        if (colonIdx !== -1) {
          const strong = document.createElement("strong");
          strong.textContent = info.slice(0, colonIdx);
          li.append(strong, info.slice(colonIdx));
        } else {
          li.textContent = info;
        }
        return li;
      }),
    );
    card.querySelector<HTMLAnchorElement>("#link")!.href = location.link;
  }

  function fillGroup(group: TrainingGroup): void {
    card.classList.remove("placeholder-mode");
    card.classList.add("group-mode");
    showOnly("group");
    card.querySelector<HTMLElement>("#group-region")!.textContent =
      group.region;
    card.querySelector<HTMLElement>("#title")!.textContent = group.departement;
    card.querySelector<HTMLElement>("#group-responsable")!.textContent =
      group.responsable;

    const email = card.querySelector<HTMLAnchorElement>("#group-email")!;
    email.textContent = group.email;
    email.href = `mailto:${group.email}`;
    email.style.display = group.email ? "" : "none";

    const tel = card.querySelector<HTMLAnchorElement>("#group-tel")!;
    tel.textContent = group.telephone;
    tel.href = `tel:${group.telephone.replace(/\s+/g, "")}`;
    tel.style.display = group.telephone ? "" : "none";
  }

  let activeMarker: HTMLElement | null = null;

  function setActiveMarker(el: HTMLElement | null): void {
    activeMarker?.classList.remove("active");
    el?.classList.add("active");
    activeMarker = el;
  }

  function showFromHidden(fill: () => void): void {
    morphTimers.forEach((t) => window.clearTimeout(t));
    morphTimers = [];
    fill();
    card.classList.remove("card-closed");
    card.style.transition = "none";
    card.style.opacity = "0";
    void card.offsetHeight;
    card.style.transition = `opacity ${FADE_IN_MS}ms ease-out`;
    card.style.opacity = "1";
    morphTimers.push(
      window.setTimeout(() => {
        card.style.transition = "";
      }, FADE_IN_MS + 20),
    );
  }

  function showCard(location: Location): void {
    if (card.classList.contains("card-closed")) {
      showFromHidden(() => fillFull(location));
    } else {
      morphCard(() => fillFull(location));
    }
  }

  function showGroupCard(group: TrainingGroup): void {
    if (card.classList.contains("card-closed")) {
      showFromHidden(() => fillGroup(group));
    } else {
      morphCard(() => fillGroup(group));
    }
  }

  function hideCard(): void {
    if (card.classList.contains("card-closed")) return;
    setActiveMarker(null);
    morphTimers.forEach((t) => window.clearTimeout(t));
    morphTimers = [];
    card.style.transition = `opacity ${FADE_OUT_MS}ms ease-in`;
    card.style.opacity = "0";
    morphTimers.push(
      window.setTimeout(() => {
        card.classList.add("card-closed");
        card.style.transition = "";
        card.style.opacity = "";
      }, FADE_OUT_MS),
    );
  }

  // Délégation : le bouton de fermeture est recréé lors des bascules de contenu.
  card.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("#close-btn")) hideCard();
  });

  // Tout clic en dehors de la card (quand elle affiche une fiche) la referme.
  // On ignore les clics sur un marker, qui basculent vers une autre fiche.
  document.addEventListener("click", (e) => {
    if (card.classList.contains("card-closed")) return;
    const target = e.target as HTMLElement;
    if (target.closest("#location-card") || target.closest(".mapboxgl-marker"))
      return;
    hideCard();
  });
}
