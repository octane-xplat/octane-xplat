import { registerRoutes } from '@octane-xplat/ui';
import { routes } from './route-manifest';

/** Shared route table, derived from app/ — the *table* is shared; web
 *  assigns URLs, native assigns Pages (docs/navigation-notes.md).
 *  Importing registers it: native pushRoute resolves route.name through
 *  routes.screens, web outlets and URL matching read the same manifest. */
registerRoutes(routes);

export { routes };
export const screens = routes.screens;

/** Route names come from the manifest ('detail', 'demo/:id'). Literal
 *  typing needs routes.d.ts codegen — build-order step 5 in
 *  docs/navigation-notes.md; string until then. */
export type RouteName = string;
