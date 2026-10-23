import { createElement } from 'octane'
import { renderToString, renderToStaticMarkup } from 'octane/server'
import {
	createRoutePreparation,
	createRouter,
	type PreparedRouteMatch,
	type ContractRouteManifest,
	type ContractsOf,
	type DestinationFor,
	type RouteDestinationInput,
} from '@octane-xplat/ui/routing/core'

import {
	createServerRouterHost,
	routeRenderContent,
	WebRouterRoot,
} from '@octane-xplat/ui/routing/web-host'

import { AppContainer, DefaultDocument, DocumentHead, DocumentScripts } from './document.web.tsrx'
import { identifierPrefix, serializePublic } from './transfer'
import type { WebBootstrap, WebHandlerOptions, WebRenderedPage } from './props'

export type {
	WebHandlerOptions,
	WebRenderedPage,
	WebDocumentProps,
	PublicRouteData,
	WebAssets,
	WebAppProps,
	WebRenderMode,
} from './props'

function renderTemplate(template: string, slots: Record<'head' | 'app' | 'scripts', string>) {
	for (const name of Object.keys(slots)) {
		const marker = `<!--xplat:${name}-->`
		if (template.split(marker).length !== 2) {
			throw new Error(`HTML template requires exactly one ${marker}`)
		}
	}
	// Substitute once: text from a rendered route must never become a new slot.
	return template.replace(
		/<!--xplat:(head|app|scripts)-->/g,
		(_, name: keyof typeof slots) => slots[name],
	)
}

/** Prepare reusable public page content separately from the current document and assets.
 * Cache users must invalidate content when route code, App or preparation behavior changes. */
export function createWebRenderer<const Catalog extends ContractRouteManifest>(
	options: WebHandlerOptions<Catalog>,
) {
	if (!options.buildId) {
		throw new TypeError('A web host requires a buildId')
	}
	if (options.template && options.Document) {
		throw new TypeError('Choose template or Document')
	}
	const render = async (request: Request): Promise<WebRenderedPage | Response> => {
		if (request.method !== 'GET' && request.method !== 'HEAD') {
			return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })
		}
		const engine = createRoutePreparation({
			catalog: options.catalog,
			base: options.base,
			stacks: options.stacks,
			context: () => options.context?.(request) ?? {},
			createCancellationController: () => new AbortController(),
		})
		let router: ReturnType<typeof createRouter> | undefined
		try {
			request.signal.throwIfAborted()
			const url = new URL(request.url)
			const path = url.pathname + url.search
			const mode =
				typeof options.mode === 'function' ? options.mode(request) : (options.mode ?? 'server')

			if (mode !== 'server' && mode !== 'client') {
				throw new TypeError('Unknown web rendering mode')
			}

			let match: PreparedRouteMatch | undefined
			let html = '',
				css = '',
				head = ''

			let metadata: ReturnType<typeof routeRenderContent>['head']
			let init: ResponseInit = {}
			if (mode === 'server') {
				const result = await engine.prepare(path, { signal: request.signal, redirects: 'return' })
				request.signal.throwIfAborted()
				if (result.status === 'redirect') {
					return new Response(null, {
						status: 302,
						headers: { Location: engine.href(result.destination) },
					})
				}

				if (result.status === 'not-found') {
					return new Response('Not Found', { status: 404 })
				}

				if (result.status === 'forbidden') {
					return new Response('Forbidden', { status: 403 })
				}

				if (result.status === 'invalid-input') {
					return new Response('Bad Request', { status: 400 })
				}

				if (result.status === 'failed') {
					throw result.error
				}

				if (result.status !== 'ready') {
					throw new Error('Route preparation was cancelled')
				}

				init = options.response?.(result.match, request) ?? {}
				const projection = await options.transfer(result.match, request)
				// Validate and detach the projection before rendering; server and browser
				// see the same public values, including group-loader context.
				const publicData = JSON.parse(serializePublic(projection))
				if (
					!publicData ||
					!Object.hasOwn(publicData, 'data') ||
					!publicData.context ||
					Array.isArray(publicData.context) ||
					typeof publicData.context !== 'object'
				) {
					throw new TypeError('transfer must return { data, context }')
				}

				const { to, name, stack, params, search, href } = result.match
				match = JSON.parse(
					serializePublic({
						to,
						name,
						stack,
						params,
						search,
						href,
						data: publicData.data,
						context: publicData.context,
					}),
				)

				const platform = createServerRouterHost()
				router = createRouter({
					catalog: options.catalog,
					host: platform.host,
					base: options.base,
					stacks: options.stacks,
					context: {},
				} as never)

				platform.attach(router)
				const content = routeRenderContent(options.catalog, match!)
				metadata = content.head
				platform.initialize(match!, content)
				const rendered = renderToString(
					WebRouterRoot,
					{ host: platform, router, App: options.App },
					{ identifierPrefix, headChannel: 'separate', signal: request.signal },
				)

				platform.assertRendered()

				;({ html, css } = rendered)
				head = rendered.head ?? ''
			}

			const headers = new Headers(init.headers)
			if (!headers.has('Content-Type')) {
				headers.set('Content-Type', 'text/html; charset=utf-8')
			}

			// Request context can be personalized. Caching is an explicit app choice.
			if (!headers.has('Cache-Control')) {
				headers.set('Cache-Control', 'private, no-store')
			}

			const headerEntries: [string, string][] = []
			headers.forEach((value, name) => {
				if (name !== 'set-cookie') {
					headerEntries.push([name, value])
				}
			})

			for (const cookie of headers.getSetCookie()) {
				headerEntries.push(['set-cookie', cookie])
			}

			return {
				version: 1,
				url: path,
				mode,
				...(match ? { match } : {}),
				html,
				css,
				head,
				...(metadata ? { metadata } : {}),
				status: init.status ?? 200,
				statusText: init.statusText ?? '',
				headers: headerEntries,
			}
		} finally {
			router?.dispose()
			engine.dispose()
		}
	}

	const document = async (page: WebRenderedPage, request: Request): Promise<Response> => {
		if (
			page.version !== 1 ||
			page.url !== new URL(request.url).pathname + new URL(request.url).search
		) {
			throw new TypeError('Rendered page does not match the document request')
		}
		const { mode, match, html, css, head, metadata } = page

		const bootstrap: WebBootstrap = {
			version: 1,
			buildId: options.buildId,
			url: page.url,
			mode,
			...(match ? { match } : {}),
		}

		const assets =
			typeof options.assets === 'function' ? await options.assets(request) : options.assets

		const headProps = { ...metadata, styles: assets.styles }
		const scriptProps = { bootstrap: serializePublic(bootstrap), scripts: assets.scripts }
		let documentHtml: string
		if (options.template !== undefined) {
			documentHtml = renderTemplate(options.template, {
				head: renderToStaticMarkup(DocumentHead, headProps).html + head + css,
				app: renderToStaticMarkup(AppContainer, { html }).html,
				scripts: renderToStaticMarkup(DocumentScripts, scriptProps).html,
			})
		} else {
			const rendered = renderToStaticMarkup(
				options.Document ?? DefaultDocument,
				{
					request,
					head: createElement(DocumentHead, headProps),
					children: createElement(AppContainer, { html }),
					scripts: createElement(DocumentScripts, scriptProps),
				},
				{ signal: request.signal },
			)

			if (!/<\/head\s*>/i.test(rendered.html)) {
				throw new Error('Document must render an HTML head')
			}

			documentHtml =
				'<!doctype html>' +
				rendered.html.replace(/<\/head\s*>/i, () => head + css + rendered.css + '</head>')
		}

		request.signal.throwIfAborted()
		return new Response(documentHtml, {
			status: page.status,
			statusText: page.statusText,
			headers: page.headers,
		})
	}

	return {
		render,
		document,
		href(
			destination: DestinationFor<
				ContractsOf<Catalog>,
				keyof ContractsOf<Catalog> & string,
				string
			>,
		) {
			const engine = createRoutePreparation({
				catalog: options.catalog,
				base: options.base,
				stacks: options.stacks,
			})
			try {
				return engine.href(destination as RouteDestinationInput)
			} finally {
				engine.dispose()
			}
		},
	}
}

/** Fetch adapter with request-local state, preserved HTTP outcomes and private caching by default. */
export function createWebHandler<const Catalog extends ContractRouteManifest>(
	options: WebHandlerOptions<Catalog>,
): (request: Request) => Promise<Response> {
	const renderer = createWebRenderer(options)
	return async (request) => {
		const finish = (response: Response) =>
			request.method === 'HEAD'
				? new Response(null, {
						status: response.status,
						statusText: response.statusText,
						headers: response.headers,
					})
				: response
		try {
			const page = await renderer.render(request)
			return finish(page instanceof Response ? page : await renderer.document(page, request))
		} catch (error) {
			if (request.signal.aborted) {
				throw request.signal.reason
			}

			if (error instanceof Response) {
				return finish(error)
			}

			options.onError?.(error, request)
			return finish(new Response('Internal Server Error', { status: 500 }))
		}
	}
}
