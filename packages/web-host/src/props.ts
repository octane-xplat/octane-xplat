import type {
	PreparedRouteMatch,
	ContractRouteManifest,
	RoutePreparationOptions,
	RouterInstance,
	ContractsOf,
	RouterOptions,
	RouterRootContext,
} from '@octane-xplat/ui/routing/core'

/** Public transfer values. Numbers must be finite; objects and arrays must be plain JSON. */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
/** Explicit screen props shared by server rendering and the first browser render. */
export interface PublicRouteData {
	data: Json
	context: { [key: string]: Json }
}

/** Render the initial app on the server (default) or prepare it in the browser. */
export type WebRenderMode = 'server' | 'client'
/** Current build's public module-script and stylesheet URLs. */
export interface WebAssets {
	scripts: readonly string[]
	styles?: readonly string[]
}

/** Props for an interactive app shell supplied to both Web entry points. */
export interface WebAppProps<Contracts = any> {
	router: RouterInstance<Contracts, string>
}

/** Server-only shell. Place head inside <head>, children and scripts inside
 * <body>. Only the app inside children hydrates; document hooks are not live. */
export interface WebDocumentProps {
	request: Request
	head: any
	children: any
	scripts: any
}

/** Shared catalog, stack configuration and build identity for paired Web entry points. */
export type WebRoutingOptions<Catalog extends ContractRouteManifest = ContractRouteManifest> = Pick<
	RoutePreparationOptions,
	'base' | 'stacks'
> & {
	readonly catalog: Catalog
	readonly buildId: string
	App?: (props: WebAppProps<ContractsOf<Catalog>>) => any
} & (unknown extends ContractsOf<Catalog>
		? { readonly 'Preserve the inferred catalog type': never }
		: unknown)

type RequestContext<Catalog> = (
	request: Request,
) => RouterRootContext<ContractsOf<Catalog>> | Promise<RouterRootContext<ContractsOf<Catalog>>>

type ServerContext<Catalog> =
	{} extends RouterRootContext<ContractsOf<Catalog>>
		? { context?: RequestContext<Catalog> }
		: { context: RequestContext<Catalog> }

/** Request-local rendering, public transfer and document configuration for createWebHandler. */
export type WebHandlerOptions<Catalog extends ContractRouteManifest = ContractRouteManifest> =
	WebRoutingOptions<Catalog> &
		ServerContext<Catalog> & {
			assets: WebAssets | ((request: Request) => WebAssets | Promise<WebAssets>)
			Document?: (props: WebDocumentProps) => any
			/** Existing HTML can use exactly one <!--xplat:head-->, <!--xplat:app-->
			 * and <!--xplat:scripts--> slot instead of a Document component. */
			template?: string
			/** Required public projection. Both the server screen and first browser
			 * render receive this value; private preparation context never crosses. */
			transfer: (
				match: PreparedRouteMatch,
				request: Request,
			) => PublicRouteData | Promise<PublicRouteData>
			mode?: WebRenderMode | ((request: Request) => WebRenderMode)
			response?: (match: PreparedRouteMatch, request: Request) => ResponseInit
			onError?: (error: unknown, request: Request) => void
		}

/** Fresh services for later navigation; initial hydration uses the document's public data. */
export type WebClientOptions<Catalog extends ContractRouteManifest = ContractRouteManifest> =
	WebRoutingOptions<Catalog> &
		Pick<RouterOptions<Catalog, string>, 'context'> & {
			/** Report markup mismatches that Octane recovers by rendering in the browser. */
			onRecoverableError?: (error: unknown) => void
		}

/** Versioned document payload written by the server and consumed once during startup. */
export interface WebBootstrap {
	version: 1
	buildId: string
	url: string
	mode: WebRenderMode
	match?: PreparedRouteMatch
}

/** Serializable public page content. Documents, asset URLs and build IDs are assembled afresh.
 * Persist only for public routes; never reuse across viewers or incompatible renderer revisions. */
export interface WebRenderedPage {
	version: 1
	url: string
	mode: WebRenderMode
	match?: PreparedRouteMatch
	html: string
	css: string
	head: string
	metadata?: import('@octane-xplat/ui').RouteHead
	status: number
	statusText: string
	headers: [string, string][]
}
