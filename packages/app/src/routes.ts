// Generated manifest glue lives in routes.gen.web.ts / routes.gen.native.ts
// (`xplat routes` — re-run after touching app/). Importing registers the
// route table: native pushRoute resolves route.name through routes.screens,
// web outlets and URL matching read the same manifest.
export { routes, screens } from './routes.gen'
export type { RouteName, RouteParams, RoutePresentations } from './routes.gen'
