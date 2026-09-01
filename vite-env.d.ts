/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string;
  readonly VITE_SHEET_ID: string;
  /** gid de l'onglet de la Google Sheet contenant les groupes d'entraînement. */
  readonly VITE_GROUPS_GID: string;
  /**
   * Contexte de déploiement Netlify (`production`, `branch-deploy`,
   * `deploy-preview`…), assigné en ligne dans la commande de build depuis
   * `$CONTEXT`. Absent d'un build local : le badge ne s'affiche alors pas.
   */
  readonly VITE_DEPLOY_CONTEXT?: string;
  /** Branche buildée, assignée en ligne depuis `$BRANCH`. */
  readonly VITE_BRANCH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
