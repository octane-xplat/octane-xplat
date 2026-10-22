// @vitest-environment jsdom
/** @jsxImportSource octane */
import { act, createRoot } from 'octane'
import { expect, it } from 'vitest'
import { NavLink } from './NavLink.web.tsrx'
import { RouterProvider } from './router-hooks.tsrx'
import { createRouter } from './router-instance'
import { createBrowserRouterHost } from './browser-router-host.web'
import { ClientRouteOutlet } from './ClientRouteOutlet.web.tsrx'
import { defineRoute } from './define-route'
import { defineRoutes } from './route-table'
import { navLinkActivation, navLinkIsActive } from './nav-link'

const catalog = defineRoutes([
	defineRoute({ path: '/items' }).screen(() => <p>Items</p>),
	defineRoute({ path: '/items/:id' }).screen(() => <p>Item</p>),
])

const platform = createBrowserRouterHost()
const navigation = createRouter({ catalog, host: platform.host, stacks: ['catalog'] })
platform.attach(navigation)
let cancel = false
let disabledPresses = 0
function Links() {
	return (
		<RouterProvider router={navigation} stack="catalog">
			<NavLink
				router={navigation}
				to="/items/:id"
				params={{ id: 'coat' }}
				id="coat"
				activeClassName="selected"
				onPress={(event) => {
					if (cancel) {
						event.preventDefault()
					}
				}}
			>
				Coat
			</NavLink>
			<NavLink router={navigation} to="/items" match="prefix" id="all">
				All items
			</NavLink>
			<NavLink router={navigation} to="/items" target="_blank" rel="noopener" id="new">
				New context
			</NavLink>
			<NavLink router={navigation} to="/items" download="items.html" id="download">
				Download
			</NavLink>
			<NavLink
				router={navigation}
				to="/items"
				disabled
				id="disabled"
				onPress={() => {
					disabledPresses++
				}}
			>
				Disabled
			</NavLink>
			<ClientRouteOutlet host={platform} flow="catalog">
				<p>Base</p>
			</ClientRouteOutlet>
		</RouterProvider>
	)
}

it('keeps anchor behavior and routes ordinary activation within the owning pane', async () => {
	history.replaceState(null, '', '/')
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	// Observe the component's decision, then suppress jsdom's external navigation.
	let intercepted = false
	const observe = (event: Event) => {
		intercepted = event.defaultPrevented
		event.preventDefault()
	}

	document.addEventListener('click', observe)
	const click = (id: string, init: MouseEventInit = {}) => {
		const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init })
		act(() => container.querySelector('#' + id)!.dispatchEvent(event))
		return intercepted
	}

	try {
		act(() => root.render(Links, {}))
		expect(container.querySelector('#coat')?.getAttribute('href')).toBe('/@catalog/items/coat')
		for (const init of [
			{ ctrlKey: true },
			{ metaKey: true },
			{ shiftKey: true },
			{ altKey: true },
			{ button: 1 },
		]) {
			expect(click('coat', init)).toBe(false)
		}

		expect(click('new')).toBe(false)
		expect(click('download')).toBe(false)
		expect(navigation.forStack('catalog').getSnapshot().route).toBeNull()
		cancel = true
		expect(click('coat')).toBe(true)
		expect(click('disabled')).toBe(true)
		expect(disabledPresses).toBe(0)
		expect(navigation.forStack('catalog').getSnapshot().route).toBeNull()
		cancel = false
		expect(click('coat')).toBe(true)
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 30))
		})

		expect(location.pathname).toBe('/@catalog/items/coat')
		expect(navigation.forStack('catalog').getSnapshot().route?.params.id).toBe('coat')
		expect(container.querySelector('#coat')?.classList.contains('selected')).toBe(true)
		expect(container.querySelector('#coat')?.getAttribute('aria-current')).toBe('page')
		expect(container.querySelector('#all')?.getAttribute('aria-current')).toBe('page')
		expect(container.querySelector('#disabled')?.getAttribute('aria-disabled')).toBe('true')
	} finally {
		document.removeEventListener('click', observe)
		act(() => root.unmount())
		navigation.dispose()
		container.remove()
	}
})

it('matches path segments and explicitly selected search/hash values', () => {
	expect(navLinkIsActive('/items-old', '/items', { match: 'prefix' })).toBe(false)
	expect(navLinkIsActive('/items/coat?tab=activity#title', '/items', { match: 'prefix' })).toBe(
		true,
	)

	expect(
		navLinkIsActive('/items/coat?tab=activity', '/items/coat?tab=details', { matchSearch: true }),
	).toBe(false)

	expect(
		navLinkIsActive('/items?tab=activity&sort=new', '/items?tab=activity', {
			matchSearch: ['tab'],
		}),
	).toBe(true)

	expect(navLinkIsActive('/items#old', '/items#new', { matchHash: true })).toBe(false)
	const event = navLinkActivation()
	event.preventDefault()
	expect(event.defaultPrevented).toBe(true)
})
