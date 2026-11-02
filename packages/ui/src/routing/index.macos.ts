// @octane-xplat/ui/routing on macOS — same names as the shared routing
// barrel, bound to the AppKit route leaves.
export { registerStack, getStack, stackEntries } from '../components/layout/stacks.macos'
export { addBackInterceptor } from './back-interceptors.macos'

export { RouteBoundary } from './RouteBoundary.macos.tsrx'
export { useBackInterceptor } from './use-back.tsrx'

export {
	deriveRouteManifest,
	defineRoutes,
	defineRuntimeRoutes,
	mergeRouteManifests,
	manifestToJson,
	formatRouteDiagnostic,
	RouteManifestError,
} from './route-table'

export {
	defineRoute,
	defineRouteGroup,
	withSearchDecoder,
	RouteSearchValidationError,
} from './define-route'

export { defineTransitions } from './route-transitions'
export { createPaneRouterHost } from './pane-router-client'
export { RouterPane } from './RouterPane.tsrx'

export { createRouter } from './router-instance'

export { RouteRegistrationError } from './route-registry'

export {
	RouterProvider,
	useRouter,
	useRouterState,
	useNavigation,
	useNavigationBlocker,
	useCanGoBack,
	useRouteMatch,
	getRouteApi,
} from './router-hooks.tsrx'

export { router, configureRouter } from './default-router.macos'

export {
	redirect,
	DestinationRedirect,
	RouteForbidden,
	RouteResourceNotFound,
} from './routing-core'
