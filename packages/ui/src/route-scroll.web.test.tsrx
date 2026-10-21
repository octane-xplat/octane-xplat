// @vitest-environment jsdom
/** @jsxImportSource octane */
import { act, createRoot } from 'octane'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createRouter } from './router-instance'
import { createBrowserRouterHost } from './browser-router-host.web'
import { ClientRouteOutlet } from './ClientRouteOutlet.web.tsrx'
import { defineRoute } from './define-route'
import { defineRoutes } from './route-table'

function Page() {
	return (
		<div>
			<h1>Page</h1>
			<div id="section">Section</div>
			<div id="percent%section">Literal percent</div>
		</div>
	)
}

function App(props: { platform: ReturnType<typeof createBrowserRouterHost> }) {
	return (
		<ClientRouteOutlet host={props.platform}>
			<p>Base</p>
		</ClientRouteOutlet>
	)
}

let y = 0
const cleanups: (() => void)[] = []
beforeEach(() => {
	history.replaceState(null, '', '/')
	vi.stubGlobal('matchMedia', (media: string) => ({
		media, matches: false, addEventListener() {}, removeEventListener() {},
	}))
	Object.defineProperty(window, 'scrollY', { get: () => y, configurable: true })
	y = 0
	vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

afterEach(() => {
	for (const cleanup of cleanups.splice(0).reverse()) {
		cleanup()
	}

	vi.restoreAllMocks()
	vi.unstubAllGlobals()
})

function fixture() {
	let guards = 0
	let loads = 0
	const catalog = defineRoutes([
		defineRoute({
			path: '/detail',
			beforeLoad: () => {
				guards++
				return { guarded: true }
			},
			loader: () => ++loads,
			head: { title: 'Detail', meta: { description: 'Detail page' } },
		}).screen(Page),
		defineRoute({ path: '/list', head: { title: 'List' } }).screen(Page),
		defineRoute({ path: '/about', presentation: 'modal' }).screen(Page),
	])

	const platform = createBrowserRouterHost()
	const navigation = createRouter({ catalog, host: platform.host })
	platform.attach(navigation)
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	act(() => root.render(App, { platform }))
	cleanups.push(() => {
		navigation.dispose()
		container.remove()
	})

	cleanups.push(() => act(() => root.unmount()))
	return {
		navigation,
		platform,
		container,
		get guards() {
			return guards
		},
		get loads() {
			return loads
		},
	}
}

const settle = () =>
	act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 30))
	})

it('starts a committed push at the top and restores each history entry independently', async () => {
	const { navigation } = fixture()
	await navigation.push({ to: '/detail' })
	expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0)
	y = 111
	await navigation.push({ to: '/detail' })
	y = 222
	await navigation.back()
	expect(window.scrollTo).toHaveBeenLastCalledWith(0, 111)
	history.forward()
	await settle()
	expect(window.scrollTo).toHaveBeenLastCalledWith(0, 222)
})

it('scrolls a fresh hash after rendering and restores a saved position on Back', async () => {
	const { navigation, container } = fixture()
	const scrollIntoView = vi.fn()
	const original = HTMLElement.prototype.scrollIntoView
	HTMLElement.prototype.scrollIntoView = scrollIntoView
	try {
		await navigation.push({ to: '/detail', hash: 'section' })
		expect(container.querySelector('#section')).not.toBeNull()
		expect(scrollIntoView).toHaveBeenCalledOnce()
		expect(location.hash).toBe('#section')
		y = 400
		await navigation.push({ to: '/list' })
		scrollIntoView.mockClear()
		await navigation.back()
		expect(window.scrollTo).toHaveBeenLastCalledWith(0, 400)
		expect(scrollIntoView).not.toHaveBeenCalled()
	} finally {
		HTMLElement.prototype.scrollIntoView = original
	}
})

it('uses the validated hash without decoding a literal percent twice', async () => {
	const { navigation, container } = fixture()
	const scrollIntoView = vi.fn()
	const original = HTMLElement.prototype.scrollIntoView
	HTMLElement.prototype.scrollIntoView = scrollIntoView
	try {
		await navigation.push({ to: '/detail', hash: 'percent%section' })
		expect(scrollIntoView).toHaveBeenCalledOnce()
		expect(scrollIntoView.mock.instances[0]).toBe(container.querySelector('[id="percent%section"]'))
		expect(location.hash).toBe('#percent%25section')
	} finally {
		HTMLElement.prototype.scrollIntoView = original
	}
})

it('retains modal background scroll and reprepares admitted history data and context', async () => {
	const f = fixture()
	await f.navigation.push({ to: '/detail' })
	y = 150
	vi.mocked(window.scrollTo).mockClear()
	await f.navigation.push({ to: '/about' })
	expect(f.loads).toBe(1)
	expect(f.guards).toBe(1)
	expect(window.scrollTo).not.toHaveBeenCalled()
	expect(f.navigation.getSnapshot().canGoBack).toBe(true)
	expect((await f.navigation.back()).status).toBe('committed')
	expect(f.navigation.getSnapshot().route).toMatchObject({
		to: '/detail',
		data: 2,
		context: { guarded: true },
	})

	expect(window.scrollTo).not.toHaveBeenCalled()
	history.forward()
	await vi.waitFor(() => expect(f.platform.views.getSnapshot().modals).toHaveLength(1))
	expect(f.platform.views.getSnapshot().modals[0].entry.route.to).toBe('/about')
	expect(f.navigation.getSnapshot().route).toMatchObject({ to: '/detail', data: 3 })
	expect(location.pathname).toBe('/about')
	expect(window.scrollTo).not.toHaveBeenCalled()
	expect(f.loads).toBe(3)
	expect(f.guards).toBe(3)
})

it('runs direct-entry guards and loaders once without adding history', async () => {
	history.replaceState(null, '', '/detail')
	const f = fixture()
	const length = history.length
	expect((await f.navigation.navigateUrl('/detail', { replace: true })).status).toBe('committed')
	expect(history.length).toBe(length)
	expect(f.guards).toBe(1)
	expect(f.loads).toBe(1)
	const registration = f.navigation.addRoutes(
		defineRoutes([defineRoute({ path: '/extra' }).screen(Page)]),
		{ id: 'extra' },
	)

	expect(f.navigation.getSnapshot().route).toMatchObject({ data: 1, context: { guarded: true } })
	registration.dispose()
})

it('applies document metadata only after commit and restores it with history and disposal', async () => {
	const initialTitle = document.title
	const f = fixture()
	await f.navigation.push({ to: '/detail' })
	expect(document.title).toBe('Detail')
	expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
		'Detail page',
	)

	await f.navigation.push({ to: '/list' })
	expect(document.title).toBe('List')
	expect(document.head.querySelector('meta[name="description"]')).toBeNull()
	await f.navigation.back()
	expect(document.title).toBe('Detail')
	f.navigation.dispose()
	expect(document.title).toBe(initialTitle)
	expect(document.head.querySelector('meta[name="description"]')).toBeNull()
})
