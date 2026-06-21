/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string;
  readonly VITE_SHEET_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
