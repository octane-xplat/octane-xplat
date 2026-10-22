// @octane-xplat/ui/routing on macOS — same names as the shared routing
// barrel, bound to the AppKit route leaves.
export { registerStack, getStack, stackEntries } from '../stacks.macos'
export { addBackInterceptor } from '../back-interceptors.macos'

export { RouteBoundary } from '../RouteBoundary.macos.tsrx'
export { useBackInterceptor } from '../use-back.tsrx'

export {
	deriveRouteManifest,
	defineRoutes,
	defineRuntimeRoutes,
	mergeRouteManifests,
	manifestToJson,
	formatRouteDiagnostic,
	RouteManifestError,
} from '../route-table'

export type {
	RouteBoundaryProps,
	RouteContext,
	RouteDiagnostic,
	RouteDiagnosticCode,
	RouteErrorBoundaryProps,
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
	ScreenTable,
} from '../props'

export { defineRoute, withSearchDecoder, RouteSearchValidationError } from '../define-route'
export { defineTransitions } from '../route-transitions'
export { createPaneRouterHost } from '../pane-router-client'
export { RouterPane } from '../RouterPane.tsrx'
export type { PaneRouterHost, RouterPaneProps } from '../props'
export type {
	AbsoluteRoutePath,
	AppRouteContracts,
	AppRouteStacks,
	AppRouteTransitions,
	ContractsOf,
	MergeRouteContracts,
	RouteCatalog,
	ContractRouteManifest,
	RuntimeRouteCatalog,
	RouterMatch,
	RouteMatchFor,
	NavigationResult,
	NavigationFailure,
	RouterNavigationState,
	NavigationBlockerOptions,
	NavigationBlockerState,
	NavigationDestinationSnapshot,
	NavigationDestination,
	ValidatedDestination,
	DestinationValidationResult,
	RouteTransitionResult,
	RouteTransitionContext,
	TransitionDefinition,
	TransitionRegistry,
	TransitionNames,
	WebTransitionOptions,
	RouterInstance,
	RouteRegistration,
	RouteRegistrationOptions,
	RouterNavigator,
	RouterHost,
	RouterHostContent,
	RouterHostChange,
	RouterHostCommand,
	RouterHostPreparation,
	RouterHostResult,
	RouterHostSnapshot,
	RouterOptions,
	RouterConfiguration,
	RouterRootContext,
	RouterState,
	FileRouteContract,
	RouteBakedLoaderData,
	FileRouteGuardArgs,
	FileRouteLoaderArgs,
	RouteRootContext,
	DefinedRoute,
	Destination,
	DestinationFor,
	RegisteredRouteContracts,
	RouteContract,
	RouteContractsFromSpecs,
	RouteDefinitionArgs,
	RouteDefinitionInput,
	RouteDefinitionBuilder,
	RouteGuardResult,
	RouteProps,
	RouteScreenProps,
	RouteSearchInputOf,
	RouteSearchOutput,
	RouteSearchSchema,
	DecodedRouteSearchSchema,
	RawRouteSearch,
	RouteSearchValidationCheck,
	RouteSearchValidator,
	RouteSearchRecord,
	RouteTransitionName,
	BuiltinRouteTransitionName,
	NativeTransitionDefinition,
} from '../props'

export { createRouter } from '../router-instance'

export { RouteRegistrationError } from '../route-registry'

export {
	RouterProvider,
	useRouter,
	useRouterState,
	useNavigation,
	useNavigationBlocker,
	useCanGoBack,
	useRouteMatch,
	getRouteApi,
} from '../router-hooks.tsrx'

export type { RouterProviderProps, RouteApi, RouteSearchUpdater } from '../props'

export { router, configureRouter } from '../default-router.macos'

export {
	redirect,
	DestinationRedirect,
	RouteForbidden,
	RouteResourceNotFound,
} from '../routing-core'
