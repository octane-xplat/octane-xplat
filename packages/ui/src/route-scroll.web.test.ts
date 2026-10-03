// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest'
import { defineRoutes } from './route-table'
vi.mock('octane', () => ({ useSyncExternalStore: vi.fn() }))

// Scroll restoration contract (route.web): a push starts at the top — or at
// the element a `hash` names — pop/forward restores the position saved for
// that history entry, and a modal push overlays without touching it.
let router: typeof import('./route.web')
let scrollTo: ReturnType<typeof vi.spyOn>
let pos = 0

beforeEach(async () => {
	vi.resetModules()
	vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
		setTimeout(() => cb(0), 0),
	)

	pos = 0
	Object.defineProperty(window, 'scrollY', { get: () => pos, configurable: true })
	scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
	history.replaceState(null, '', '/')
	document.body.innerHTML = ''
	router = await import('./route.web')
	router.registerRoutes(
		defineRoutes([
			{ path: 'detail', screen: () => null },
			{ path: 'list', screen: () => null },
			{ path: 'about', screen: () => null, presentation: 'modal' },
		]),
	)
})

const settle = () => new Promise((resolve) => setTimeout(resolve, 25))

it('starts a push at the top', async () => {
	pos = 300
	await settle() // boot settle
	scrollTo.mockClear()

	router.pushRoute({ stack: 'root', name: 'detail', params: {} })
	await settle()
	expect(scrollTo).toHaveBeenCalledWith(0, 0)
})

it('restores the saved position on pop and the newer one on forward', async () => {
	router.pushRoute({ stack: 'root', name: 'detail', params: {} })
	await settle()
	pos = 300
	router.pushRoute({ stack: 'root', name: 'list', params: {} })
	await settle()
	pos = 0 // landed at the top of 'list'
	scrollTo.mockClear()

	history.back()
	await settle()
	expect(scrollTo).toHaveBeenCalledWith(0, 300)

	scrollTo.mockClear()
	history.forward()
	await settle()
	expect(scrollTo).toHaveBeenCalledWith(0, 0)
})

it('keeps independent positions for entries sharing a URL', async () => {
	router.pushRoute({ stack: 'root', name: 'detail', params: {} })
	await settle()
	pos = 111
	router.pushRoute({ stack: 'root', name: 'detail', params: {} })
	await settle()
	pos = 222 // scrolled inside the second entry
	scrollTo.mockClear()

	history.back()
	await settle()
	expect(scrollTo).toHaveBeenCalledWith(0, 111)

	scrollTo.mockClear()
	history.forward()
	await settle()
	expect(scrollTo).toHaveBeenCalledWith(0, 222)
})

it('scrolls a pushed hash to its element instead of the top', async () => {
	document.body.innerHTML = '<div id="section">target</div>'
	const target = document.getElementById('section')!
	target.scrollIntoView = vi.fn()
	await settle()
	scrollTo.mockClear()

	router.pushRoute({ stack: 'root', name: 'detail', params: {}, hash: 'section' })
	await settle()
	expect(location.hash).toBe('#section')
	expect(target.scrollIntoView).toHaveBeenCalled()
	expect(scrollTo).not.toHaveBeenCalledWith(0, 0)
})

it('does not restore a saved position over a hash target on pop', async () => {
	document.body.innerHTML = '<div id="section">target</div>'
	const target = document.getElementById('section')!
	target.scrollIntoView = vi.fn()
	router.pushRoute({ stack: 'root', name: 'detail', params: {}, hash: 'section' })
	await settle()
	pos = 400 // scrolled past the anchor
	router.pushRoute({ stack: 'root', name: 'list', params: {} })
	await settle()
	scrollTo.mockClear()
	const scrollIntoView = target.scrollIntoView as ReturnType<typeof vi.fn>
	scrollIntoView.mockClear()

	history.back()
	await settle()
	// The position saved for the entry wins over its hash.
	expect(scrollTo).toHaveBeenCalledWith(0, 400)
	expect(scrollIntoView).not.toHaveBeenCalled()
})

it('leaves the position alone when a modal route pushes over it', async () => {
	router.pushRoute({ stack: 'root', name: 'detail', params: {} })
	await settle()
	pos = 150
	scrollTo.mockClear()

	router.pushRoute({ stack: 'root', name: 'about', params: {} })
	await settle()
	expect(router.currentModalRoute()?.name).toBe('about')
	expect(scrollTo).not.toHaveBeenCalled()
})

it('keys positions by URL when an entry predates registration', async () => {
	// Boot on /list with no route table — the entry has no stamped id, so
	// its position keys on the URL (path+query+hash).
	history.replaceState(null, '', '/list?filter=unread#deep')
	router.registerRoutes(defineRoutes([{ path: 'list', screen: () => null }]))
	pos = 250
	router.pushRoute({ stack: 'root', name: 'detail', params: {} })
	await settle()
	pos = 0
	scrollTo.mockClear()

	history.back()
	await settle()
	expect(scrollTo).toHaveBeenCalledWith(0, 250)
})
