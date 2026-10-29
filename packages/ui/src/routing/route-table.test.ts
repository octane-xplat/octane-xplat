import { sealGeneratedRouteCatalog } from './route-contract-scope'
import { createRoutePreparation } from './routing-core'
import { matchRouteSegments, parseRouteLocation } from '@octane-xplat/lib/route-pattern'
import type { RouteDestinationInput, RouteMeta } from '../props'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import type {
	ManifestRouteNames,
	ManifestRouteParams,
	ManifestRoutePresentations,
	RouteManifest,
	RouteSpec,
	RouteSpecParams,
} from '../props'

import {
	defineRoutes,
	defineRuntimeRoutes,
	deriveRouteManifest,
	formatRouteDiagnostic,
	layoutChain,
	manifestToJson,
	mergeRouteManifests,
	RouteManifestError,
} from './route-table'

const C = (n: string) => Object.assign(() => null, { displayName: n })
// Inspect the shared matcher without introducing a second production URL codec.
function matchMeta(routes: readonly RouteMeta[], segments: string[]) {
	for (const meta of routes) {
		const params = matchRouteSegments(meta.segments, segments.map(decodeURIComponent))
		if (params) {
			return { meta, params }
		}
	}
	return null
}

function preparation(routes: readonly RouteMeta[]) {
	return createRoutePreparation({
		catalog: {
			screens: Object.fromEntries(routes.map((route) => [route.name, C(route.name)])),
			routes: [...routes],
			layouts: {},
		},
		stacks: ['demos'],
	})
}

function resolveRoute(routes: readonly RouteMeta[], url: string) {
	const result = preparation(routes).resolveUrl(url)
	return result.status === 'matched' ? { ...result.destination, name: result.name } : null
}

const routeHref = (routes: readonly RouteMeta[], destination: RouteDestinationInput) =>
	preparation(routes).href(destination)

it('stores reserved JavaScript names as ordinary route and loader keys', () => {
	const screen = C('Reserved')
	const baked = Object.fromEntries([['__proto__', { title: 'Reserved' }]])
	const routes = defineRoutes({ routes: [{ path: '__proto__', screen, dataMode: 'baked' }], baked })
	expect(Object.hasOwn(routes.screens, '__proto__')).toBe(true)
	expect(Object.hasOwn(routes.loaders!, '__proto__')).toBe(true)
	const combined = mergeRouteManifests(routes)
	expect(Object.hasOwn(combined.screens, '__proto__')).toBe(true)
	expect(Object.hasOwn(combined.baked!, '__proto__')).toBe(true)
	expect(combined.loaders!.__proto__({})).toEqual({ title: 'Reserved' })
})

it('keeps filename animation separate from presentation in catalog JSON', () => {
	const catalog = deriveRouteManifest({ './app/help+fade.web.tsrx': { screen: C('Help') } }, [
		'web',
	])
	expect(manifestToJson(catalog).routes[0]).toMatchObject({
		name: 'help',
		presentation: 'push',
		transition: 'fade',
	})
})

it('does not treat inherited properties as directory layouts', () => {
	expect(layoutChain({}, 'constructor/item')).toEqual([])
	const routes = defineRoutes([{ path: 'constructor/item', screen: C('Item') }])
	expect(manifestToJson({ ...routes, layouts: {} }).routes[0].layouts).toEqual([])
})

it('retains reserved external search keys as string data without changing their prototype', () => {
	const params = parseRouteLocation(
		'/?__proto__=json:%7B%22injected%22:true%7D&constructor=ordinary',
	).search
	expect(Object.hasOwn(params, '__proto__')).toBe(true)
	expect(params.__proto__).toBe('json:{"injected":true}')
	expect(params.injected).toBeUndefined()
	expect(params.constructor).toBe('ordinary')
})

it('matches the declared index at the root URL, without inventing one for an empty catalog', () => {
	const routes = defineRoutes([{ path: 'index', screen: C('Home') }]).routes
	expect(resolveRoute(routes, '/')?.name).toBe('index')
	expect(resolveRoute(routes, '/?from=link')?.search).toEqual({ from: 'link' })
	expect(resolveRoute([], '/')).toBeNull()
})

function manifest(files: Record<string, any>, prefer: string[] = ['web']) {
	return sealGeneratedRouteCatalog(deriveRouteManifest(files, prefer))
}

describe('deriveRouteManifest', () => {
	it('normalizes configured route roots without stripping parent or hidden-directory prefixes', () => {
		for (const dir of ['./screens', '../screens', '.screens']) {
			const routes = deriveRouteManifest(
				{ [dir + '/items/[id].tsx']: { screen: C('Item') } },
				['web'],
				dir,
			)

			expect(routes.routes[0].name).toBe('items/:id')
			expect(resolveRoute(routes.routes, '/items/coat')?.params).toEqual({ id: 'coat' })
		}
	})

	it('maps file paths to route names', () => {
		const m = manifest({
			'./app/detail.tsrx': { Detail: C('Detail') },
			'./app/demo/[id].tsrx': { DemoDetail: C('DemoDetail') },
			'./app/chat/index.tsrx': { Chat: C('Chat') },
		})

		expect(Object.keys(m.screens).sort()).toEqual(['chat', 'demo/:id', 'detail'])
		const demo = m.routes.find((r) => r.name === 'demo/:id')!
		expect(demo.segments).toEqual(['demo', ':id'])
		expect(demo.params).toEqual(['id'])
	})

	it('keeps _layout files out of screens and catalogs them by dir', () => {
		const m = manifest({
			'./app/_layout.tsrx': { Root: C('Root') },
			'./app/chat/_layout.tsrx': { ChatShell: C('ChatShell') },
			'./app/detail.tsrx': { Detail: C('Detail') },
		})

		expect(Object.keys(m.screens)).toEqual(['detail'])
		expect(m.layouts[''].displayName).toBe('Root')
		expect(m.layouts['chat'].displayName).toBe('ChatShell')
	})

	it('prefers platform variants; skips other platforms entirely', () => {
		const files = {
			'./app/settings.tsrx': { S: C('shared') },
			'./app/settings.web.tsrx': { S: C('web') },
			'./app/settings.mobile.tsrx': { S: C('mobile') },
			'./app/only.tsrx': { O: C('only') },
		}

		const web = manifest(files, ['web'])
		expect(web.screens.settings.displayName).toBe('web')
		const mobile = manifest(files, ['ios', 'mobile'])
		expect(mobile.screens.settings.displayName).toBe('mobile')
	})

	it('skips a suffix that is not in the prefer list', () => {
		const m = manifest({ './app/x.ios.tsrx': { X: C('x') } }, ['android', 'mobile'])
		expect(m.screens.x).toBeUndefined()
	})

	it('rejects same-rank files producing one route name', () => {
		try {
			manifest({
				'./app/detail.tsrx': { D: C('A') },
				'./app/detail.tsx': { D: C('B') },
			})

			expect.unreachable()
		} catch (e) {
			const err = e as RouteManifestError
			expect(err).toBeInstanceOf(RouteManifestError)
			expect(err.issues).toHaveLength(1)
			expect(err.issues[0]).toMatchObject({
				code: 'route/duplicate-name',
				path: './app/detail.tsx',
			})

			expect(err.issues[0]!.detail).toContain('./app/detail.tsrx')
		}
	})

	it('rejects malformed metadata instead of silently removing guards', () => {
		const loader = vi.fn(() => ({ private: true }))
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		try {
			const invalid = () =>
				manifest({
					'./app/detail.tsrx': {
						default: C('Detail'),
						beforeLoad: 'yes',
						dataMode: 'warm',
						loader,
					},
				})

			expect(invalid).toThrow(RouteManifestError)
			try {
				invalid()
			} catch (error) {
				expect((error as RouteManifestError).issues.map((issue) => issue.path)).toEqual([
					'./app/detail.tsrx:dataMode',
					'./app/detail.tsrx:beforeLoad',
				])
			}

			expect(loader).not.toHaveBeenCalled()
			expect(warn).not.toHaveBeenCalled()
		} finally {
			warn.mockRestore()
		}
	})

	it.each([
		['loader', 1],
		['beforeLoad', 'yes'],
		['ErrorBoundary', {}],
		['validateSearch', { '~standard': { version: 2, validate: () => ({ value: {} }) } }],
		['head', []],
		['head', null],
	])('rejects an invalid %s export with a source-aware repair', (field, value) => {
		try {
			manifest({ './app/detail.tsrx': { screen: C('Detail'), [field]: value } })
			expect.unreachable()
		} catch (error) {
			expect(error).toBeInstanceOf(RouteManifestError)
			expect((error as RouteManifestError).issues).toMatchObject([
				{
					code: 'route/invalid-export',
					path: './app/detail.tsrx:' + field,
					hint: expect.stringContaining('before constructing the route catalog'),
				},
			])
		}
	})

	it('picks default export, then screen, then single function export', () => {
		const m = manifest({
			'./app/a.tsrx': { default: C('d'), other: C('o') },
			'./app/b.tsrx': { screen: C('s'), helper: () => 1 },
			'./app/c.tsrx': { only: C('only') },
		})

		expect(m.screens.a.displayName).toBe('d')
		expect(m.screens.b.displayName).toBe('s')
		expect(m.screens.c.displayName).toBe('only')
	})

	it('rejects malformed runtime loader metadata even when a file uses baked data', () => {
		expect(() =>
			manifest({
				'./app/detail.tsrx': {
					default: C('Detail'),
					dataMode: 'baked',
					loader: 42,
				},
			}),
		).toThrow('route/invalid-export ./app/detail.tsrx:loader')
	})
})

describe('optional segments and catch-alls', () => {
	// The Coreframe content-route shapes: a localized document route and a
	// per-section not-found splat.
	const coreframe = defineRoutes({
		routes: [
			{ path: ':locale?/guides/:doc', screen: C('Doc') },
			{ path: ':locale?/guides/*', screen: C('NotFound') },
		],
	})

	it('optional param present and absent on one route', () => {
		const { routes } = coreframe

		expect(matchMeta(routes, ['en', 'guides', 'x'])!).toMatchObject({
			meta: { name: ':locale?/guides/:doc' },
			params: { locale: 'en', doc: 'x' },
		})

		const absent = matchMeta(routes, ['guides', 'x'])!
		expect(absent.meta.name).toBe(':locale?/guides/:doc')
		expect(absent.params).toEqual({ doc: 'x' })
		expect('locale' in absent.params).toBe(false)
	})

	it('optional param backtracks so a later static still aligns', () => {
		// 'guides' could fill :locale? greedily — the matcher must release
		// it so the static 'guides' segment aligns and :doc gets 'x'.
		const { routes } = coreframe
		expect(matchMeta(routes, ['guides', 'x'])!.params.doc).toBe('x')
	})

	it('terminal catch-all captures the remaining path, joined', () => {
		expect(matchMeta(coreframe.routes, ['en', 'guides', 'a', 'b'])!).toMatchObject({
			meta: { name: ':locale?/guides/*' },
			params: { locale: 'en', '*': 'a/b' },
		})
	})

	it('catch-all matches zero remaining segments', () => {
		expect(matchMeta(coreframe.routes, ['guides'])!).toMatchObject({
			meta: { name: ':locale?/guides/*' },
			params: { '*': '' },
		})
	})

	it('decodes per-segment inside the splat', () => {
		const m = defineRoutes([{ path: 'docs/*', screen: C('D') }])
		expect(matchMeta(m.routes, ['docs', 'a%20b', 'c'])!.params['*']).toBe('a b/c')
	})

	it('precedence: static and required params beat optionals and splats', () => {
		const m = defineRoutes({
			routes: [
				{ path: 'docs/*rest', screen: C('Splat') },
				{ path: 'docs/:id?', screen: C('Opt') },
				{ path: 'docs/:id', screen: C('Param') },
				{ path: 'docs/new', screen: C('Static') },
			],
		})

		// static > required > optional > splat, regardless of spec order
		expect(matchMeta(m.routes, ['docs', 'new'])!.meta.name).toBe('docs/new')
		expect(matchMeta(m.routes, ['docs', 'x'])!.meta.name).toBe('docs/:id')
		expect(matchMeta(m.routes, ['docs'])!.meta.name).toBe('docs/:id?')
		expect(matchMeta(m.routes, ['docs', 'a', 'b'])!).toMatchObject({
			meta: { name: 'docs/*rest' },
			params: { rest: 'a/b' },
		})
	})

	it('sibling optional static beats a bare optional', () => {
		const m = defineRoutes({
			routes: [
				{ path: 'a/:x?', screen: C('Opt') },
				{ path: 'a/b', screen: C('Static') },
			],
		})

		expect(matchMeta(m.routes, ['a', 'b'])!.meta.name).toBe('a/b')
		expect(matchMeta(m.routes, ['a', 'q'])!.params.x).toBe('q')
		expect(matchMeta(m.routes, ['a'])!.params).toEqual({})
	})

	it('file syntax: [[p]] is optional, [...p] is a named catch-all', () => {
		const m = manifest({
			'./app/[lang]/[[locale]]/doc.tsrx': { D: C('D') },
			'./app/files/[...rest].tsrx': { F: C('F') },
		})

		const doc = m.routes.find((r) => r.name === ':lang/:locale?/doc')!
		expect(doc.params).toEqual(['lang', 'locale'])

		const files = m.routes.find((r) => r.name === 'files/*rest')!
		expect(files.params).toEqual(['rest'])

		expect(matchMeta(m.routes, ['en', 'doc'])!).toMatchObject({
			meta: { name: ':lang/:locale?/doc' },
			params: { lang: 'en' },
		})

		expect(matchMeta(m.routes, ['files', 'a', 'b'])!.params.rest).toBe('a/b')
	})

	it('a mid-path * warns and matches literally', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const m = defineRoutes([{ path: 'a/*/b', screen: C('Mid') }])

		expect(warn).toHaveBeenCalledWith(expect.stringContaining('mid-path'))
		expect(matchMeta(m.routes, ['a', 'x', 'b'])).toBeNull()
		expect(matchMeta(m.routes, ['a', '*', 'b'])!.meta.name).toBe('a/*/b')
		warn.mockRestore()
	})

	it('canonical href drops an absent optional segment', () => {
		expect(
			routeHref(coreframe.routes, {
				stack: 'root',
				to: '/:locale?/guides/:doc',
				params: { doc: 'x' },
			}),
		).toBe('/guides/x')

		expect(
			routeHref(coreframe.routes, {
				stack: 'root',
				to: '/:locale?/guides/:doc',
				params: { locale: 'en', doc: 'x' },
			}),
		).toBe('/en/guides/x')
	})

	it('canonical href splices a splat param as segments', () => {
		expect(
			routeHref(coreframe.routes, {
				stack: 'root',
				to: '/:locale?/guides/*',
				params: { '*': 'a/b c' },
			}),
		).toBe('/guides/a/b%20c')

		expect(
			routeHref(coreframe.routes, {
				stack: 'root',
				to: '/:locale?/guides/*',
				params: {},
			}),
		).toBe('/guides')
	})

	it('canonical resolution routes a localized doc URL end to end', () => {
		expect(resolveRoute(coreframe.routes, '/en/guides/x?tab=2')!).toMatchObject({
			stack: 'root',
			name: ':locale?/guides/:doc',
			params: { locale: 'en', doc: 'x' },
			search: { tab: '2' },
		})

		expect(resolveRoute(coreframe.routes, '/guides/no/such/doc')!).toMatchObject({
			stack: 'root',
			to: '/:locale?/guides/*',
			params: { '*': 'no/such/doc' },
		})
	})

	it('round-trips optional + splat params through build/match', () => {
		const path = routeHref(coreframe.routes, {
			stack: 'root',
			to: '/:locale?/guides/*',
			params: { locale: 'fr', '*': 'a/b' },
		})

		expect(path).toBe('/fr/guides/a/b')
		expect(resolveRoute(coreframe.routes, path)!.params).toEqual({ locale: 'fr', '*': 'a/b' })
	})

	it('a root catch-all coexists with named-stack URLs', () => {
		const m = defineRoutes({
			routes: [
				{ path: '*', screen: C('NotFound') },
				{ path: 'demo/:id', screen: C('Demo') },
			],
		})

		expect(resolveRoute(m.routes, '/@demos/demo/x')!).toMatchObject({
			stack: 'demos',
			name: 'demo/:id',
			params: { id: 'x' },
		})
	})

	it('types: optional and splat params are optional keys', () => {
		const m = defineRoutes({
			routes: [
				{ path: ':locale?/guides/:doc', screen: C('Doc') },
				{ path: 'docs/*rest', screen: C('Splat') },
				{ path: 'files/*', screen: C('Anon') },
			],
		})

		expectTypeOf<ManifestRouteParams<typeof m>[':locale?/guides/:doc']>().toEqualTypeOf<{
			doc: string
			locale?: string
		}>()

		expectTypeOf<ManifestRouteParams<typeof m>['docs/*rest']>().toEqualTypeOf<{
			rest?: string
		}>()

		expectTypeOf<ManifestRouteParams<typeof m>['files/*']>().toEqualTypeOf<{
			'*'?: string
		}>()

		expectTypeOf<ManifestRouteNames<typeof m>>().toEqualTypeOf<
			':locale?/guides/:doc' | 'docs/*rest' | 'files/*'
		>()
	})
})

describe('layoutChain', () => {
	const m = manifest({
		'./app/_layout.tsrx': { Root: C('Root') },
		'./app/chat/_layout.tsrx': { ChatShell: C('ChatShell') },
		'./app/chat/room.tsrx': { Room: C('Room') },
		'./app/detail.tsrx': { D: C('D') },
	})

	it("chains ancestor dir layouts, outermost first, '' excluded", () => {
		expect(layoutChain(m.layouts, 'chat/room').map((c) => c.displayName)).toEqual(['ChatShell'])
		expect(layoutChain(m.layouts, 'detail')).toEqual([])
		expect(layoutChain(m.layouts, 'chat')).toEqual([])
	})
})

describe('defineRoutes', () => {
	it('turns path specs into metas + screens, sorted by specificity', () => {
		const m = defineRoutes({
			routes: [
				{ path: 'guides/:slug', screen: C('Guide') },
				{ path: 'guides', screen: C('GuideIndex') },
				{ path: 'guides/new', screen: C('NewGuide') },
			],
		})

		expect(Object.keys(m.screens).sort()).toEqual(['guides', 'guides/:slug', 'guides/new'])
		expect(m.routes.map((r) => r.name)).toEqual(['guides/new', 'guides/:slug', 'guides'])
		const guide = m.routes.find((r) => r.name === 'guides/:slug')!
		expect(guide.segments).toEqual(['guides', ':slug'])
		expect(guide.params).toEqual(['slug'])
	})

	it('accepts [param] syntax, a bare array, and index/empty paths', () => {
		const m = defineRoutes([
			{ path: 'docs/[slug]', screen: C('Doc') },
			{ path: 'docs/index', screen: C('DocIndex') },
			{ path: '', screen: C('Root') },
		])

		expect(m.screens['docs/:slug'].displayName).toBe('Doc')
		expect(m.screens.docs.displayName).toBe('DocIndex')
		expect(m.screens.index.displayName).toBe('Root')
	})

	it('carries presentation, loader, beforeLoad, head, and errorBoundary onto the meta', () => {
		const loader = (p: Record<string, unknown>) => p
		const beforeLoad = () => ({ ok: true })
		const head = { title: 'Doc' }
		const errorBoundary = C('Boundary')
		const m = defineRoutes([
			{
				path: 'doc',
				screen: C('Doc'),
				presentation: 'modal',
				loader,
				beforeLoad,
				head,
				errorBoundary,
			},
		])

		const meta = m.routes[0]
		expect(meta.presentation).toBe('modal')
		expect(meta.loader).toBe(loader)
		expect(meta.beforeLoad).toBe(beforeLoad)
		expect(meta.head).toBe(head)
		expect(meta.errorBoundary).toBe(errorBoundary)
		expect(m.loaders!.doc).toBe(loader)
	})

	it('collects path-keyed layouts like _layout files', () => {
		const m = defineRoutes({
			routes: [{ path: 'guides/:slug', screen: C('Guide') }],
			layouts: { guides: C('GuideShell'), '': C('RootShell') },
		})

		expect(m.layouts.guides.displayName).toBe('GuideShell')
		expect(m.layouts[''].displayName).toBe('RootShell')
		expect(layoutChain(m.layouts, 'guides/:slug').map((c) => c.displayName)).toEqual(['GuideShell'])
	})

	it('rejects a non-component screen with a coded issue', () => {
		try {
			defineRoutes([{ path: 'bad', screen: { default: C('B') } as any }])
			expect.unreachable()
		} catch (e) {
			const err = e as RouteManifestError
			expect(err).toBeInstanceOf(RouteManifestError)
			expect(err.issues).toHaveLength(1)
			expect(err.issues[0]).toMatchObject({
				code: 'route/missing-screen',
				path: 'routes[0].screen',
				expected: 'a component function',
			})

			expect(err.message).toContain('route/missing-screen')
		}
	})

	it('rejects duplicate route names, reporting every collision at once', () => {
		try {
			defineRoutes([
				{ path: 'a', screen: C('A') },
				{ path: 'docs/[id]', screen: C('Doc') },
				{ path: 'a/index', screen: C('A2') }, // normalizes to 'a'
				{ path: 'docs/:id', screen: C('Doc2') }, // same name as docs/[id]
			])

			expect.unreachable()
		} catch (e) {
			const err = e as RouteManifestError
			expect(err).toBeInstanceOf(RouteManifestError)

			expect(err.issues.map((i) => i.code)).toEqual([
				'route/duplicate-name',
				'route/duplicate-name',
			])

			expect(err.issues[0]).toMatchObject({ path: 'routes[2].path' })
			expect(err.issues[0]!.detail).toContain("routes[0] ('a')")
			expect(err.issues[1]).toMatchObject({ path: 'routes[3].path' })
		}
	})

	it('rejects malformed spec fields with field paths and expected shapes', () => {
		try {
			defineRoutes([
				{ path: 'ok', screen: C('Ok') },
				{
					path: 'bad',
					screen: C('Bad'),
					presentation: 'sideways',
					dataMode: 'warm',
					head: 42,
				} as any,
				{ screen: C('NoPath') } as any,
			])

			expect.unreachable()
		} catch (e) {
			const err = e as RouteManifestError
			expect(err.issues.map((i) => i.path)).toEqual([
				'routes[1].presentation',
				'routes[1].dataMode',
				'routes[1].head',
				'routes[2].path',
			])

			expect(err.issues[0]!.expected).toBe("'push' | 'modal'")
		}
	})

	it('warns when a baked spec has no baked data in the set', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const m = defineRoutes([{ path: 'gone', screen: C('Gone'), dataMode: 'baked' }])

		expect(warn).toHaveBeenCalledWith(expect.stringContaining('route/missing-baked-data'))
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('routes[0].dataMode'))
		expect(m.routes[0]!.dataMode).toBe('baked')
		warn.mockRestore()
	})

	it('warns when a layouts key matches no route', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		defineRoutes({
			routes: [{ path: 'guides/:slug', screen: C('Guide') }],
			layouts: { guid: C('TypoShell') },
		})

		expect(warn).toHaveBeenCalledWith(expect.stringContaining('route/unmatched-layout'))
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("layouts['guid']"))
		warn.mockRestore()
	})

	it('formats a diagnostic with code, path, expected shape, and hint', () => {
		expect(
			formatRouteDiagnostic({
				code: 'route/missing-screen',
				path: 'routes[0].screen',
				detail: 'received object',
				expected: 'a component function',
				hint: 'pass the component itself',
			}),
		).toBe(
			'[octane-xplat] route/missing-screen routes[0].screen — received object; expected a component function. pass the component itself',
		)
	})

	it('brands literal route names, params, and presentations onto the manifest type', () => {
		const m = defineRoutes({
			routes: [
				{ path: 'guides', screen: C('GuideIndex') },
				{ path: 'guides/:slug', screen: C('Guide'), presentation: 'modal' },
				{ path: 'docs/[id]', screen: C('Doc') },
				{ path: 'settings/index', screen: C('Settings') },
				{ path: '', screen: C('Root') },
			],
		})

		expectTypeOf<ManifestRouteNames<typeof m>>().toEqualTypeOf<
			'guides' | 'guides/:slug' | 'docs/:id' | 'settings' | 'index'
		>()

		expectTypeOf<ManifestRouteParams<typeof m>['guides/:slug']>().toEqualTypeOf<{
			slug: string
		}>()

		expectTypeOf<ManifestRouteParams<typeof m>['docs/:id']>().toEqualTypeOf<{ id: string }>()
		expectTypeOf<ManifestRouteParams<typeof m>['guides']>().toEqualTypeOf<{}>()
		expectTypeOf<ManifestRoutePresentations<typeof m>['guides/:slug']>().toEqualTypeOf<'modal'>()

		// Inferred contracts keep the normalized RouteManifest surface.
		expectTypeOf(m).toMatchTypeOf<RouteManifest>()
	})

	it('file and programmatic routes expose the same structured preparation', () => {
		const loader = (p: Record<string, unknown>) => p
		const beforeLoad = () => ({ ok: true })
		const head = { title: 'Guide' }

		const file = manifest({
			'./app/guides/[slug]+modal.tsrx': {
				G: C('Guide'),
				loader,
				beforeLoad,
				head,
			},
		})

		const spec = defineRoutes([
			{ path: 'guides/:slug', screen: C('Guide'), presentation: 'modal', loader, beforeLoad, head },
		])

		const fm = file.routes.find((r) => r.name === 'guides/:slug')!
		const sm = spec.routes.find((r) => r.name === 'guides/:slug')!
		expect({ ...sm, file: undefined, preparation: undefined }).toEqual({
			...fm,
			file: undefined,
			preparation: undefined,
		})
		expect(fm.preparation).toMatchObject({ loader, beforeLoad })
		expect(sm.preparation).toMatchObject({ loader, beforeLoad })
		expect(spec.loaders!['guides/:slug']).toBe(loader)
	})

	it('baked routes resolve data from the manifest baked map, not a loader call', async () => {
		const m = defineRoutes({
			routes: [
				{ path: 'changelog', screen: C('Changelog'), dataMode: 'baked' },
				{ path: 'live', screen: C('Live'), loader: () => 'live-data' },
			],
			baked: { changelog: { entries: ['a', 'b'] } },
		})

		const baked = m.routes.find((r) => r.name === 'changelog')!
		expect(baked.dataMode).toBe('baked')
		expect(await m.loaders!.changelog({})).toEqual({ entries: ['a', 'b'] })

		const live = m.routes.find((r) => r.name === 'live')!
		expect(live.dataMode).toBeUndefined()
		expect(await m.loaders!.live({})).toBe('live-data')
	})

	it('a baked route with no baked entry throws a coded error like a loader failure', () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {}) // expected route/missing-baked-data
		const m = defineRoutes([{ path: 'gone', screen: C('Gone'), dataMode: 'baked' }])
		vi.restoreAllMocks()
		// commitRoute wraps the call in Promise.resolve().then() — a sync
		// throw becomes a rejection there, landing as the screen's error prop.
		try {
			m.loaders!.gone({})
			expect.unreachable()
		} catch (e) {
			const err = e as RouteManifestError
			expect(err).toBeInstanceOf(RouteManifestError)
			expect(err.issues[0]).toMatchObject({
				code: 'route/missing-baked-data',
				path: "baked['gone']",
			})

			expect(err.message).toMatch(/no baked data/)
		}
	})

	it('baked reads the owning manifest through merges', async () => {
		const prog = defineRoutes({
			routes: [{ path: 'docs', screen: C('Docs'), dataMode: 'baked' }],
			baked: { docs: { pages: 3 } },
		})

		const merged = mergeRouteManifests(
			manifest({ './app/detail.tsrx': { D: C('FileDetail') } }),
			prog,
		)

		expect(await merged.loaders!.docs({})).toEqual({ pages: 3 })
		expect(merged.baked).toEqual({ docs: { pages: 3 } })
	})

	it('manifestToJson emits the host schema identically for files and specs', () => {
		const loader = () => 'data'
		const head = { title: 'Guide' }
		const file = manifest({
			'./app/_layout.tsrx': { L: C('Shell') },
			'./app/guides/_layout.tsrx': { G: C('GuidesShell') },
			'./app/guides/[slug]+modal.tsrx': {
				G: C('Guide'),
				loader,
				head,
				dataMode: 'baked',
				ErrorBoundary: C('GuideError'),
			},
		})

		const fileWithData = { ...file, baked: { 'guides/:slug': { ok: true } } }

		const spec = defineRoutes({
			routes: [
				{
					path: 'guides/:slug',
					screen: C('Guide'),
					presentation: 'modal',
					loader,
					head,
					dataMode: 'baked',
					errorBoundary: C('GuideError'),
					source: './app/guides/[slug]+modal.tsrx',
				},
			],
			layouts: { '': C('Shell'), guides: C('GuidesShell') },
			baked: { 'guides/:slug': { ok: true } },
		})

		const fj = manifestToJson(fileWithData).routes[0]
		const sj = manifestToJson(spec).routes[0]
		expect(sj).toEqual(fj)
		expect(fj).toEqual({
			name: 'guides/:slug',
			path: 'guides/:slug',
			params: ['slug'],
			presentation: 'modal',
			dataMode: 'baked',
			layouts: ['', 'guides'],
			source: './app/guides/[slug]+modal.tsrx',
			loader: true,
			guard: false,
			head: true,
			errorBoundary: true,
		})

		expect(manifestToJson(spec).layouts).toEqual(['', 'guides'])
	})

	it('file routes honor dataMode and warn on an in-file loader', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const loader = () => 'live'
		const m = manifest({
			'./app/report.tsrx': { R: C('Report'), dataMode: 'baked', loader },
			'./app/report.loader.ts': { loader }, // never a route itself
		})

		const meta = m.routes.find((r) => r.name === 'report')!
		expect(meta.dataMode).toBe('baked')
		expect(meta.loader).not.toBe(loader) // baked lookup, not the file's
		expect(m.routes.map((r) => r.name)).toEqual(['report'])
		warn.mockRestore()
	})

	it('unbranded manifests extract to never/empty', () => {
		const m = manifest({ './app/detail.tsrx': { D: C('D') } })
		expectTypeOf<ManifestRouteNames<typeof m>>().toEqualTypeOf<never>()
		expectTypeOf<ManifestRouteParams<typeof m>>().toEqualTypeOf<{}>()
	})
})

describe('mergeRouteManifests', () => {
	const files = manifest({
		'./app/detail.tsrx': { D: C('FileDetail') },
		'./app/demo/[id].tsrx': { DD: C('FileDemo') },
		'./app/guides/_layout.tsrx': { L: C('FileLayout') },
	})

	it('merges screens, metas, and layouts without touching disjoint names', () => {
		const dynamic = defineRoutes({
			routes: [{ path: 'guides/:slug', screen: C('Guide') }],
			layouts: { docs: C('DocsShell') },
		})

		const merged = mergeRouteManifests(files, dynamic)

		expect(Object.keys(merged.screens).sort()).toEqual(['demo/:id', 'detail', 'guides/:slug'])

		expect(merged.layouts.guides.displayName).toBe('FileLayout')
		expect(merged.layouts.docs.displayName).toBe('DocsShell')
		// Sort order is rebuilt — 'demo/:id' still loses to nothing, but a
		// static dynamic route must outrank a file param route.
		expect(matchMeta(merged.routes, ['demo', 'x'])!.meta.name).toBe('demo/:id')
	})

	it('later manifests win same-name routes — meta and config together', () => {
		const fileLoader = () => 'file'
		const file = manifest({
			'./app/detail.tsrx': { D: C('FileDetail'), loader: fileLoader },
		})

		const dynamic = defineRoutes([{ path: 'detail', screen: C('DynDetail') }])
		const merged = mergeRouteManifests(file, dynamic)

		expect(merged.screens.detail.displayName).toBe('DynDetail')
		const meta = merged.routes.find((r) => r.name === 'detail')!
		expect(meta.loader).toBeUndefined()
		expect(merged.loaders!.detail).toBeUndefined()
	})

	it('file manifest wins when merged after the dynamic one', () => {
		const dynamic = defineRoutes([{ path: 'detail', screen: C('DynDetail') }])
		const merged = mergeRouteManifests(dynamic, sealGeneratedRouteCatalog(files))

		expect(merged.screens.detail.displayName).toBe('FileDetail')
	})

	it('a static dynamic route outranks a file param route in match order', () => {
		const dynamic = defineRoutes([{ path: 'demo/new', screen: C('NewDemo') }])
		const merged = mergeRouteManifests(files, dynamic)

		expect(matchMeta(merged.routes, ['demo', 'new'])!.meta.name).toBe('demo/new')
	})
})

describe('schema-inferred routes', () => {
	it('derives spec params from the path literal', () => {
		expectTypeOf<RouteSpecParams<'docs/:slug'>>().toEqualTypeOf<{ slug: string }>()
		expectTypeOf<RouteSpecParams<':locale?/docs/:doc'>>().toEqualTypeOf<{
			doc: string
			locale?: string
		}>()

		expectTypeOf<RouteSpecParams<string>>().toEqualTypeOf<Record<string, unknown>>()
	})

	it('types spec callbacks from a literal path', () => {
		const spec = {
			path: 'guides/:doc',
			screen: C('Doc'),
			loader: ({ params }) => params.doc,
			beforeLoad: (args) => ({ doc: args.params.doc }),
			head: ({ params }) => ({ title: params.doc }),
		} satisfies RouteSpec<'guides/:doc'>

		// The narrowed spec still feeds the loose RouteSpec the manifest consumes.
		expectTypeOf(spec).toExtend<RouteSpec>()
		expect(defineRoutes([spec]).screens['guides/:doc'].displayName).toBe('Doc')
	})
})

it('rejects runtime catalogs that shadow a declared contract while retaining typed startup overrides', async () => {
	const first = defineRoutes([
		{ path: '/known', loader: () => ({ title: 'known' }), screen: C('Known') },
	])
	const runtime = defineRuntimeRoutes([{ path: '/known', loader: () => 31, screen: C('Runtime') }])
	expect(() => mergeRouteManifests(first, runtime)).toThrow(
		'cannot replace a declared route contract',
	)
	const last = defineRoutes([{ path: '/known', loader: () => 42, screen: C('Last') }])
	const merged = mergeRouteManifests(first, last)
	expect(await createRoutePreparation({ catalog: merged }).prepare('/known')).toMatchObject({
		status: 'ready',
		match: { data: 42 },
	})
})
