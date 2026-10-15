// @octane-xplat/ui/routing on macOS — same names as the shared routing
// barrel, bound to the AppKit route leaves.
export { registerStack, getStack, stackEntries } from '../stacks.macos'
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
	layoutsFor as layoutsForRoute,
	errorBoundaryFor,
} from '../route.macos'

export { RouteBoundary } from '../RouteBoundary.macos.tsrx'
export { useBackInterceptor } from '../use-back.tsrx'

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
