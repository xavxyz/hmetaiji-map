/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string;
  readonly VITE_SHEET_ID: string;
  /** gid de l'onglet de la Google Sheet contenant les groupes d'entraînement. */
  readonly VITE_GROUPS_GID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
