import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import type {
	ManifestRouteNames,
	ManifestRouteParams,
	ManifestRoutePresentations,
	RouteManifest,
} from './props'

import {
	buildRoutePath,
	defineRoutes,
	deriveRouteManifest,
	layoutChain,
	linkPath,
	manifestToJson,
	matchRoute,
	matchUrl,
	mergeRouteManifests,
} from './route-table'

const C = (n: string) => Object.assign(() => null, { displayName: n })

function manifest(files: Record<string, any>, prefer: string[] = ['web']) {
	return deriveRouteManifest(files, prefer)
}

describe('deriveRouteManifest', () => {
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
})

describe('matchRoute + buildRoutePath', () => {
	const { routes } = manifest({
		'./app/detail.tsrx': { D: C('D') },
		'./app/demo/[id].tsrx': { DD: C('DD') },
		'./app/demo/new.tsrx': { DN: C('DN') },
	})

	it('static beats param at the same depth', () => {
		expect(matchRoute(routes, ['demo', 'new'])!.meta.name).toBe('demo/new')
		expect(matchRoute(routes, ['demo', 'x'])!.meta.name).toBe('demo/:id')
	})

	it('extracts path params', () => {
		const hit = matchRoute(routes, ['demo', 'counter'])!
		expect(hit.params).toEqual({ id: 'counter' })
	})

	it('builds path with substituted params; leftovers go to query', () => {
		expect(
			buildRoutePath(routes, {
				stack: 'demos',
				name: 'demo/:id',
				params: { id: 'counter', tab: '2' },
			}),
		).toBe('/demos/demo/counter?tab=2')

		expect(
			buildRoutePath(routes, { stack: 'root', name: 'detail', params: { from: 'home' } }),
		).toBe('/detail?from=home')
	})

	it('non-manifest names keep the legacy shape', () => {
		expect(buildRoutePath(routes, { stack: 'root', name: 'other', params: { a: '1' } })).toBe(
			'/other?a=1',
		)
	})

	it('JSON-encodes non-scalar params and restores them on match', () => {
		const path = buildRoutePath(routes, {
			stack: 'root',
			name: 'detail',
			params: { filter: { unread: true } },
		})

		const matched = matchUrl(routes, path)!

		expect(path).toContain('json%3A%7B%22unread%22%3Atrue%7D')
		expect(matched.params.filter).toEqual({ unread: true })
	})

	it('strips a +presentation suffix into meta.presentation', () => {
		const m = manifest({
			'./app/settings+modal.tsrx': { S: C('S') },
			'./app/fade+fade.tsrx': { F: C('F') },
		})

		expect(m.screens.settings.displayName).toBe('S')
		expect(m.routes.find((r) => r.name === 'settings')!.presentation).toBe('modal')
		expect(m.routes.find((r) => r.name === 'fade')!.presentation).toBe('fade')
	})

	it('presentation suffix composes with platform suffixes', () => {
		const m = manifest(
			{
				'./app/sheet+modal.tsrx': { S: C('shared') },
				'./app/sheet+modal.mobile.tsrx': { S: C('mobile') },
			},
			['ios', 'mobile'],
		)

		expect(m.screens.sheet.displayName).toBe('mobile')
		expect(m.routes[0].name).toBe('sheet')
		expect(m.routes[0].presentation).toBe('modal')
	})

	it('picks up a loader export; loader-only files have no screen', () => {
		const loader = (p: Record<string, unknown>) => p
		const m = manifest({
			'./app/detail.tsrx': { screen: C('D'), loader },
			'./app/data.tsrx': { loader },
		})

		expect(m.routes.find((r) => r.name === 'detail')!.loader).toBe(loader)
		expect(m.screens.data).toBeUndefined()
	})

	it('records beforeLoad and head exports without mistaking them for screens', () => {
		const beforeLoad = () => ({ role: 'member' })
		const head = (params: Record<string, unknown>) => ({ title: String(params.id) })
		const m = manifest({
			'./app/detail.tsrx': { Detail: C('D'), beforeLoad, head },
		})

		const detail = m.routes[0]

		expect(detail.beforeLoad).toBe(beforeLoad)
		expect(detail.head).toBe(head)
		expect(m.screens.detail.displayName).toBe('D')
	})

	it('picks up an ErrorBoundary export without mistaking it for the screen', () => {
		const boundary = C('Boundary')
		const m = manifest({
			// No default/screen export — the lone component still wins over
			// the reserved boundary export.
			'./app/detail.tsrx': { Detail: C('D'), ErrorBoundary: boundary },
			'./app/bare.tsrx': { screen: C('B'), ErrorBoundary: boundary },
		})

		const detail = m.routes.find((r) => r.name === 'detail')!
		expect(detail.errorBoundary).toBe(boundary)
		expect(m.screens.detail.displayName).toBe('D')
		expect(m.screens.bare.displayName).toBe('B')
		expect(m.routes.find((r) => r.name === 'bare')!.errorBoundary).toBe(boundary)
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

		expect(matchRoute(routes, ['en', 'guides', 'x'])!).toMatchObject({
			meta: { name: ':locale?/guides/:doc' },
			params: { locale: 'en', doc: 'x' },
		})

		const absent = matchRoute(routes, ['guides', 'x'])!
		expect(absent.meta.name).toBe(':locale?/guides/:doc')
		expect(absent.params).toEqual({ doc: 'x' })
		expect('locale' in absent.params).toBe(false)
	})

	it('optional param backtracks so a later static still aligns', () => {
		// 'guides' could fill :locale? greedily — the matcher must release
		// it so the static 'guides' segment aligns and :doc gets 'x'.
		const { routes } = coreframe
		expect(matchRoute(routes, ['guides', 'x'])!.params.doc).toBe('x')
	})

	it('terminal catch-all captures the remaining path, joined', () => {
		expect(matchRoute(coreframe.routes, ['en', 'guides', 'a', 'b'])!).toMatchObject({
			meta: { name: ':locale?/guides/*' },
			params: { locale: 'en', '*': 'a/b' },
		})
	})

	it('catch-all matches zero remaining segments', () => {
		expect(matchRoute(coreframe.routes, ['guides'])!).toMatchObject({
			meta: { name: ':locale?/guides/*' },
			params: { '*': '' },
		})
	})

	it('decodes per-segment inside the splat', () => {
		const m = defineRoutes([{ path: 'docs/*', screen: C('D') }])
		expect(matchRoute(m.routes, ['docs', 'a%20b', 'c'])!.params['*']).toBe('a b/c')
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
		expect(matchRoute(m.routes, ['docs', 'new'])!.meta.name).toBe('docs/new')
		expect(matchRoute(m.routes, ['docs', 'x'])!.meta.name).toBe('docs/:id')
		expect(matchRoute(m.routes, ['docs'])!.meta.name).toBe('docs/:id?')
		expect(matchRoute(m.routes, ['docs', 'a', 'b'])!).toMatchObject({
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

		expect(matchRoute(m.routes, ['a', 'b'])!.meta.name).toBe('a/b')
		expect(matchRoute(m.routes, ['a', 'q'])!.params.x).toBe('q')
		expect(matchRoute(m.routes, ['a'])!.params).toEqual({})
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

		expect(matchRoute(m.routes, ['en', 'doc'])!).toMatchObject({
			meta: { name: ':lang/:locale?/doc' },
			params: { lang: 'en' },
		})

		expect(matchRoute(m.routes, ['files', 'a', 'b'])!.params.rest).toBe('a/b')
	})

	it('a mid-path * warns and matches literally', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const m = defineRoutes([{ path: 'a/*/b', screen: C('Mid') }])

		expect(warn).toHaveBeenCalledWith(expect.stringContaining('mid-path'))
		expect(matchRoute(m.routes, ['a', 'x', 'b'])).toBeNull()
		expect(matchRoute(m.routes, ['a', '*', 'b'])!.meta.name).toBe('a/*/b')
		warn.mockRestore()
	})

	it('buildRoutePath drops an absent optional segment', () => {
		expect(
			buildRoutePath(coreframe.routes, {
				stack: 'root',
				name: ':locale?/guides/:doc',
				params: { doc: 'x' },
			}),
		).toBe('/guides/x')

		expect(
			buildRoutePath(coreframe.routes, {
				stack: 'root',
				name: ':locale?/guides/:doc',
				params: { locale: 'en', doc: 'x' },
			}),
		).toBe('/en/guides/x')
	})

	it('buildRoutePath splices a splat param as segments', () => {
		expect(
			buildRoutePath(coreframe.routes, {
				stack: 'root',
				name: ':locale?/guides/*',
				params: { '*': 'a/b c' },
			}),
		).toBe('/guides/a/b%20c')

		expect(
			buildRoutePath(coreframe.routes, {
				stack: 'root',
				name: ':locale?/guides/*',
				params: {},
			}),
		).toBe('/guides')
	})

	it('matchUrl routes a localized doc URL end to end', () => {
		expect(matchUrl(coreframe.routes, '/en/guides/x?tab=2')!).toMatchObject({
			stack: 'root',
			name: ':locale?/guides/:doc',
			params: { locale: 'en', doc: 'x', tab: '2' },
		})

		expect(matchUrl(coreframe.routes, '/guides/no/such/doc')!).toMatchObject({
			stack: 'root',
			name: ':locale?/guides/*',
			params: { '*': 'no/such/doc' },
		})
	})

	it('round-trips optional + splat params through build/match', () => {
		const path = buildRoutePath(coreframe.routes, {
			stack: 'root',
			name: ':locale?/guides/*',
			params: { locale: 'fr', '*': 'a/b' },
		})

		expect(path).toBe('/fr/guides/a/b')
		expect(matchUrl(coreframe.routes, path)!.params).toEqual({ locale: 'fr', '*': 'a/b' })
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

describe('matchUrl + linkPath', () => {
	const { routes } = manifest({
		'./app/detail.tsrx': { D: C('D') },
		'./app/demo/[id].tsrx': { DD: C('DD') },
		'./app/settings+modal.tsrx': { S: C('S') },
	})

	it('root path wins over stack interpretation', () => {
		expect(matchUrl(routes, '/demo/x')).toMatchObject({ stack: 'root', name: 'demo/:id' })
	})

	it('first segment is the stack when the whole path misses', () => {
		const r = matchUrl(routes, '/demos/demo/x?tab=2')!
		expect(r).toMatchObject({ stack: 'demos', name: 'demo/:id' })
		expect(r.params).toEqual({ id: 'x', tab: '2' })
	})

	it('carries meta.presentation into the route', () => {
		expect(matchUrl(routes, '/settings')!.presentation).toBe('modal')
	})

	it('normalizes http(s) and app-scheme URLs', () => {
		expect(linkPath('https://x.com/demo/9?a=1')).toBe('/demo/9?a=1')
		expect(linkPath('textcoral://demo/9')).toBe('/demo/9')
		expect(linkPath('/demo/9')).toBe('/demo/9')
	})

	it.each(['/demo/%', '/demo/%E0%A4%A', '/detail?from=%', '/detail?%=x'])(
		'rejects malformed encoding without throwing: %s',
		(url) => expect(matchUrl(routes, url)).toBeNull(),
	)

	it('ignores fragments for params but carries them into route.hash', () => {
		expect(matchUrl(routes, linkPath('xplat://demo/counter?from=a?b#ignored'))).toMatchObject({
			params: { id: 'counter', from: 'a?b' },
			hash: 'ignored',
		})
	})

	it('emits route.hash back into the built path', () => {
		expect(
			buildRoutePath(routes, {
				stack: 'root',
				name: 'detail',
				params: { from: 'home' },
				hash: 'section-2',
			}),
		).toBe('/detail?from=home#section-2')
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

	it('warns and skips a non-component screen', () => {
		const m = defineRoutes([{ path: 'bad', screen: { default: C('B') } as any }])
		expect(m.screens.bad).toBeUndefined()
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

		// Still a plain RouteManifest — registerRoutes/matchRoute accept it.
		expectTypeOf(m).toMatchTypeOf<RouteManifest>()
	})

	it('spec parity — a spec produces the same meta its file would', () => {
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
		expect({ ...sm, file: undefined }).toEqual({ ...fm, file: undefined })
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

	it('a baked route with no baked entry throws like a loader failure', () => {
		const m = defineRoutes([{ path: 'gone', screen: C('Gone'), dataMode: 'baked' }])
		// commitRoute wraps the call in Promise.resolve().then() — a sync
		// throw becomes a rejection there, landing as the screen's error prop.
		expect(() => m.loaders!.gone({})).toThrow(/no baked data/)
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

		file.baked = { 'guides/:slug': { ok: true } }

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

		const fj = manifestToJson(file).routes[0]
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
		expect(matchRoute(merged.routes, ['demo', 'x'])!.meta.name).toBe('demo/:id')
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
		const merged = mergeRouteManifests(dynamic, files)

		expect(merged.screens.detail.displayName).toBe('FileDetail')
	})

	it('a static dynamic route outranks a file param route in match order', () => {
		const dynamic = defineRoutes([{ path: 'demo/new', screen: C('NewDemo') }])
		const merged = mergeRouteManifests(files, dynamic)

		expect(matchRoute(merged.routes, ['demo', 'new'])!.meta.name).toBe('demo/new')
	})
})
