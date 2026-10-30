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
	/** Public route data handed to the screen — must be plain JSON. */
	data: Json
	/** Public projection of the router context; the first browser render rebuilds
	 *  its private context from exactly this. */
	context: { [key: string]: Json }
}

/** Render the initial app on the server (default) or prepare it in the browser. */
export type WebRenderMode = 'server' | 'client'
/** Current build's public module-script and stylesheet URLs. */
export interface WebAssets {
	/** Module-script URLs for the client bundle, in load order. */
	scripts: readonly string[]
	/** Stylesheet URLs to link; omit when the build inlines CSS. */
	styles?: readonly string[]
}

/** Props for an interactive app shell supplied to both Web entry points. */
export interface WebAppProps<Contracts = any> {
	/** The router driving the app shell. */
	router: RouterInstance<Contracts, string>
}

/** Server-only shell. Place head inside <head>, children and scripts inside
 * <body>. Only the app inside children hydrates; document hooks are not live. */
export interface WebDocumentProps {
	/** The incoming request being rendered. */
	request: Request
	/** Element rendering `<head>` content: collected route metadata plus build styles. */
	head: any
	/** Element wrapping the rendered app markup — place inside `<body>`. */
	children: any
	/** Element emitting the serialized bootstrap payload and module scripts. */
	scripts: any
}

/** Shared catalog, stack configuration and build identity for paired Web entry points. */
export type WebRoutingOptions<Catalog extends ContractRouteManifest = ContractRouteManifest> = Pick<
	RoutePreparationOptions,
	'base' | 'stacks'
> & {
	/** Route manifest shared by the paired server and client entry points. */
	readonly catalog: Catalog
	/** Build identity stamped into the bootstrap payload; a mismatch makes the client fail fast instead of hydrating stale markup. */
	readonly buildId: string
	/** App shell component rendered around the routed screen; receives `{ router }`. */
	App?: (props: WebAppProps<ContractsOf<Catalog>>) => any
} & (unknown extends ContractsOf<Catalog>
		? { readonly 'Preserve the inferred catalog type': never }
		: unknown)

type RequestContext<Catalog> = (
	request: Request,
) => RouterRootContext<ContractsOf<Catalog>> | Promise<RouterRootContext<ContractsOf<Catalog>>>

/** Request-local router context factory; optional when the catalog's root context is empty. */
interface ServerContextOptional<Catalog> {
	/** Request-local router context factory. */
	context?: RequestContext<Catalog>
}
/** Request-local router context factory — the catalog's routes require it. */
interface ServerContextRequired<Catalog> {
	/** Request-local router context factory. */
	context: RequestContext<Catalog>
}

type ServerContext<Catalog> =
	{} extends RouterRootContext<ContractsOf<Catalog>>
		? ServerContextOptional<Catalog>
		: ServerContextRequired<Catalog>

/** Request-local rendering, public transfer and document configuration for createWebHandler. */
export type WebHandlerOptions<Catalog extends ContractRouteManifest = ContractRouteManifest> =
	WebRoutingOptions<Catalog> &
		ServerContext<Catalog> & {
			/** Current build's script/style URLs, or a per-request resolver for them. */
			assets: WebAssets | ((request: Request) => WebAssets | Promise<WebAssets>)
			/** Document shell component; mutually exclusive with `template` — the default document is used when neither is given. */
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
			/** Per-request render mode; static or a request resolver. Defaults to 'server'. */
			mode?: WebRenderMode | ((request: Request) => WebRenderMode)
			/** Extra ResponseInit for the rendered page — status and headers merge over the host defaults. */
			response?: (match: PreparedRouteMatch, request: Request) => ResponseInit
			/** Called when rendering throws; the response still falls back to a 500. */
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
	/** Payload schema version; currently always 1. */
	version: 1
	/** Build identity the client compares against its own before hydrating. */
	buildId: string
	/** Pathname + search the payload was rendered for. */
	url: string
	/** Render mode that produced the document. */
	mode: WebRenderMode
	/** Prepared route match with its public data; absent in 'client' mode. */
	match?: PreparedRouteMatch
}

/** Serializable public page content. Documents, asset URLs and build IDs are assembled afresh.
 * Persist only for public routes; never reuse across viewers or incompatible renderer revisions. */
export interface WebRenderedPage {
	/** Payload schema version; currently always 1. */
	version: 1
	/** Pathname + search the page was rendered for. */
	url: string
	/** Render mode that produced the page. */
	mode: WebRenderMode
	/** Prepared route match with its public data; absent in 'client' mode. */
	match?: PreparedRouteMatch
	/** Rendered app markup; empty in 'client' mode. */
	html: string
	/** Critical CSS collected during render. */
	css: string
	/** Extra head markup rendered by the route (title/meta/links). */
	head: string
	/** Structured head metadata for the document's `<head>` element. */
	metadata?: import('@octane-xplat/ui').RouteHead
	/** HTTP status the document response should carry. */
	status: number
	/** HTTP status text; empty string keeps the runtime default. */
	statusText: string
	/** Response headers as name/value pairs (set-cookie preserved per entry). */
	headers: [string, string][]
}
