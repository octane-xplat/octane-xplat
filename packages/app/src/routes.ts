// Generated manifest glue lives in routes.gen.web.ts / routes.gen.native.ts
// (`xplat routes` — re-run after touching app/). Importing registers the
// route table: native pushRoute resolves route.name through routes.screens,
// web outlets and URL matching read the same manifest.
export { routes, screens } from './routes.gen'
export type { RouteName, RouteParams, RoutePresentations } from './routes.gen'

import { wireRouteLinks } from './route-links'
import type { RouteName, RouteParams } from './routes.gen'

wireRouteLinks()

export type NavigateArgs = {
	[Name in RouteName]: keyof RouteParams[Name] extends never
		? [
				name: Name,
				params?: RouteParams[Name],
				opts?: { into?: string; presentation?: 'push' | 'modal' | 'fade' },
			]
		: [
				name: Name,
				params: RouteParams[Name],
				opts?: { into?: string; presentation?: 'push' | 'modal' | 'fade' },
			]
}[RouteName]

export type RouteLinkProps = {
	[Name in RouteName]: (keyof RouteParams[Name] extends never
		? { params?: RouteParams[Name] }
		: { params: RouteParams[Name] }) & {
		to: Name
		into?: string
		presentation?: 'push' | 'modal' | 'fade'
		className?: any
		children?: any
	}
}[RouteName]
