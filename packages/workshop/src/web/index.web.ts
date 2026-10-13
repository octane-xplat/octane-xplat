/**
 * Web runtime entry — the catalog virtual module and the generated workshop
 * entry import this. Exposes startWorkshop plus the catalog-update seam the
 * virtual catalog calls back into after HMR re-execution.
 */
export { createWebStageHost } from './mount.web'
export { startWorkshop, catalogDidUpdate } from './entry.web'
