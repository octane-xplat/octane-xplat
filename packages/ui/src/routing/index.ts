// @octane-xplat/ui/routing — route authoring, navigation, back handling, and
// router state. Route presentation (Link, NavLink, Tabs, AppShell) stays at
// the package root; this entrypoint owns the router itself.
export { registerStack, getStack, stackEntries } from '../stacks'
export {
	pushRoute,
	popRoute,
	routeStacks,
	pushDeepLink,
	routeFor,
	currentRoute,
	currentModalRoute,
	canGoBack,
	useCanGoBack,
	useRoute,
	useModalRoute,
	redirect,
	addBackInterceptor,
	registerScreens,
	registerRoutes,
	addRoutes,
	screenFor,
	hrefFor,
	layoutsForRoute,
	errorBoundaryFor,
} from '../route'

export { RouteBoundary } from '../RouteBoundary'
export { useBackInterceptor } from '../use-back'

export {
	deriveRouteManifest,
	defineRoutes,
	mergeRouteManifests,
	manifestToJson,
	formatRouteDiagnostic,
	RouteManifestError,
} from '../route-table'

export type {
	AppRoutes,
	AppRouteName,
	AppRouteParams,
	BeforeLoad,
	BeforeLoadArgs,
	Route,
	RouteBoundaryProps,
	RouteContext,
	RouteDiagnostic,
	RouteDiagnosticCode,
	RouteErrorBoundaryProps,
	RouteFor,
	RouteHead,
	RouteHeadExport,
	RouteHeadFn,
	RouteMeta,
	RouteManifest,
	RouteManifestJson,
	RouteJson,
	RouteDataMode,
	RouteNameOfPath,
	RouteParamsFromSpecs,
	RoutePathParams,
	RoutePresentationsFromSpecs,
	RouteSpec,
	RouteSpecParams,
	RouteSpecSet,
	ManifestRouteNames,
	ManifestRouteParams,
	ManifestRoutePresentations,
	SpecRouteInfo,
	TypedRoute,
	ScreenTable,
} from '../props'
