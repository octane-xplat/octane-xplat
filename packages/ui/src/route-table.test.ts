import { describe, expect, it } from 'vitest'
import {
	buildRoutePath,
	deriveRouteManifest,
	layoutChain,
	linkPath,
	matchRoute,
	matchUrl,
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
			'./app/settings.native.tsrx': { S: C('native') },
			'./app/only.tsrx': { O: C('only') },
		}

		const web = manifest(files, ['web'])
		expect(web.screens.settings.displayName).toBe('web')
		const nat = manifest(files, ['ios', 'native'])
		expect(nat.screens.settings.displayName).toBe('native')
	})

	it('skips a suffix that is not in the prefer list', () => {
		const m = manifest({ './app/x.ios.tsrx': { X: C('x') } }, ['android', 'native'])
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
				'./app/sheet+modal.native.tsrx': { S: C('native') },
			},
			['ios', 'native'],
		)

		expect(m.screens.sheet.displayName).toBe('native')
		expect(m.routes[0].name).toBe('sheet')
		expect(m.routes[0].presentation).toBe('modal')
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
