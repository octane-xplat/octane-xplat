// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest'
import { defineRoutes } from './route-table'
vi.mock('octane', () => ({ useSyncExternalStore: vi.fn() }))

let router: typeof import('./route.web')
beforeEach(async () => {
	vi.resetModules()
	vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
	history.replaceState(null, '', '/')
	router = await import('./route.web')
	router.registerRoutes(
		defineRoutes([
			{
				path: 'detail',
				screen: () => null,
				beforeLoad: () => ({ guarded: true }),
				loader: () => 'loaded',
			},
			{ path: 'about', screen: () => null, presentation: 'modal' },
		]),
	)
})

const settle = () => new Promise((resolve) => setTimeout(resolve, 25))

it('restores guard context and loader data on back and forward', async () => {
	router.pushRoute({ stack: 'root', name: 'detail', params: {} })
	await settle()
	router.pushRoute({ stack: 'root', name: 'about', params: {} })
	history.back()
	await settle()
	expect(router.routeFor('root')).toMatchObject({
		context: { guarded: true },
		loaderData: 'loaded',
	})

	history.forward()
	await settle()
	expect(router.currentModalRoute()?.name).toBe('about')
	expect(router.routeFor('root')?.name).toBe('detail')
})

it('keeps loaded route state when addRoutes updates the registry', async () => {
	router.pushRoute({ stack: 'root', name: 'detail', params: {} })
	await settle()
	router.addRoutes(defineRoutes([{ path: 'extra', screen: () => null }]))
	expect(router.routeFor('root')).toMatchObject({
		context: { guarded: true },
		loaderData: 'loaded',
	})
})

it('counts the visible modal as a back affordance from the base shell', () => {
	router.pushRoute({ stack: 'root', name: 'about', params: {} })
	expect(router.canGoBack()).toBe(true)
})

it('rejects unmatched incoming links without changing history', () => {
	const length = history.length
	expect(router.pushDeepLink('xplat://missing')).toBe(false)
	expect(history.length).toBe(length)
	expect(router.currentRoute()).toBeNull()
})

it('loads a direct URL without adding history or running its guard', async () => {
	const guard = vi.fn()
	const loader = vi.fn(() => ({ entries: ['baked'] }))
	history.replaceState(null, '', '/baked')
	const length = history.length
	router.registerRoutes(
		defineRoutes([{ path: 'baked', screen: () => null, beforeLoad: guard, loader }]),
	)

	await settle()
	expect(router.routeFor('root')).toMatchObject({ loaderData: { entries: ['baked'] } })
	expect(history.length).toBe(length)
	expect(guard).not.toHaveBeenCalled()
	expect(loader).toHaveBeenCalledTimes(1)
})
