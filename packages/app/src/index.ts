import { routes } from './routes';

// The root _layout is the app shell — the route manifest catalogs
// app/_layout.* at layouts['']; whatever file fills that slot is what
// both entries render.
export const App = routes.layouts[''];
export { routes };
// Platform services resolve through the suffix chain at build time —
// exports-map wildcards don't extension-resolve, so deep imports like
// '@xplat/app/platform/storage' fail; the barrel is the contract.
export { storage } from '@octane-xplat/platform';
export { navigate, goBack, wireHardwareBack } from './platform/nav';
