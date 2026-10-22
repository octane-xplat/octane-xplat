// @octane-xplat/ui/routing — route authoring, navigation, back handling, and
// router state. Route presentation (Link, NavLink, Tabs, AppShell) stays at
// the package root; this entrypoint owns the router itself.
export { registerStack, getStack, stackEntries } from '../stacks'
export { addBackInterceptor } from '../back-interceptors'

export { RouteBoundary } from '../RouteBoundary'
export { useBackInterceptor } from '../use-back'
export { defineRoute, defineRouteGroup, withSearchDecoder, RouteSearchValidationError } from '../define-route'
export { defineTransitions } from '../route-transitions'
export { createPaneRouterHost } from '../pane-router-client'
export { RouterPane } from '../RouterPane.tsrx'
export type { PaneRouterHost, RouterPaneProps } from '../props'

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
	RouteGroup,
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

export { router, configureRouter } from '../default-router'

export {
	redirect,
	DestinationRedirect,
	RouteForbidden,
	RouteResourceNotFound,
} from '../routing-core'

export type { RouteGroupBuilder } from '../define-route'
