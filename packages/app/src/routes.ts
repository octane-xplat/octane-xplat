// Generated manifest glue lives in routes.gen.web.ts / routes.gen.mobile.ts
// (`xplat routes` — re-run after touching app/). Importing registers the
// route table: native pushRoute resolves route.name through routes.screens,
// web outlets and URL matching read the same manifest.
export { routes, screens } from './routes.gen'

import type {
	ManifestRouteNames,
	ManifestRouteParams,
	ManifestRoutePresentations,
} from '@octane-xplat/ui'

import type {
	RouteName as FileRouteName,
	RouteParams as FileRouteParams,
	RoutePresentations as FileRoutePresentations,
} from './routes.gen.types'

import { wireRouteLinks } from './route-links'
// Programmatic routes — layered over the file manifest via addRoutes at
// module scope (survives routes.gen re-registration under HMR). The
// imported binding is type-only; the spec-derived names/params merge into
// RouteName/RouteParams below.
// oxlint-disable-next-line xplat/no-ts-imports-tsrx — vite transforms this edge; the import registers routes
import './guides.tsrx'
import type { guideRoutes } from './guides.tsrx'

wireRouteLinks()

export type RouteName = FileRouteName | ManifestRouteNames<typeof guideRoutes>
export type RouteParams = FileRouteParams & ManifestRouteParams<typeof guideRoutes>
export type RoutePresentations = FileRoutePresentations &
	ManifestRoutePresentations<typeof guideRoutes>

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
