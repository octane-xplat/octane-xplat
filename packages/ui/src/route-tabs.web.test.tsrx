/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { act, createContext, createRoot, useContext, useState } from 'octane'
import { expect, it, vi } from 'vitest'
vi.mock('./theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }))
import { createBrowserRouterHost } from './browser-router-host.web'
import { ClientRouteOutlet } from './ClientRouteOutlet.web.tsrx'
import { createRouter } from './router-instance'
import { Tabs } from './Tabs.web.tsrx'
import { RouteOutlet } from './RouteOutlet.web.tsrx'
import { configureRouter, router } from './default-router.web'
import { defineRoute } from './define-route'
import { defineRoutes } from './route-table'
import { useRouter } from './router-hooks.tsrx'
import type { TabSpec } from './props'

const Person = createContext('missing')
const Provider: any = Person
const bases = new Map<string, { count: number; person: string; increment(): void }>()
let screenPerson = ''
let screenStack = ''
function Base(props: { name: string }) {
	const [count, setCount] = useState(0)
	const person = useContext(Person)
	const navigation = useRouter()
	bases.set(props.name, { count, person, increment: () => setCount(count + 1) })
	return (
		<button id={'base-' + props.name} onClick={() => setCount(count + 1)}>
			{props.name}:{person}:{count}:{navigation.getSnapshot().modal}
		</button>
	)
}

function Item(props: { params: { id: string }; data: { title: string } }) {
	screenPerson = useContext(Person)
	screenStack = useRouter().getSnapshot().route?.stack ?? ''
	return (
		<p id="tab-item">
			{props.params.id}:{props.data.title}
		</p>
	)
}

const tabs: readonly TabSpec[] = [
	{ key: 'home', title: 'Home', render: () => <span>Home base</span> },
	{ key: 'left', title: 'Left', stack: 'left', render: () => <Base name="left" /> },
	{ key: 'right', title: 'Right', stack: 'right', render: () => <Base name="right" /> },
]

function App(props: {
	tabs: readonly TabSpec[]
	selectedKey?: string
	onSelectionChange?(key: string): void
	person: string
}) {
	return (
		<Provider value={props.person}>
			<RouteOutlet>
				<Tabs
					defaultSelectedKey="left"
					tabs={props.tabs}
					selectedKey={props.selectedKey}
					onSelectionChange={props.onSelectionChange}
				/>
			</RouteOutlet>
		</Provider>
	)
}

const visible = (element: Element | null) => {
	if (!element) {
		return false
	}

	for (let current: Element | null = element; current; current = current.parentElement) {
		if ((current as HTMLElement).hidden || getComputedStyle(current).display === 'none') {
			return false
		}
	}

	return true
}

it('binds configured tab panes to owned flows while retaining shell state and accessible selection', async () => {
	history.replaceState(null, '', '/')
	configureRouter({
		catalog: defineRoutes([
			defineRoute({
				path: '/items/:id',
				loader: ({ params }) => ({ title: params.id }),
			}).screen(Item),
			defineRoute({ path: '/settings' }).screen(() => <p id="tab-settings">Settings</p>),
		]),
		stacks: ['left', 'right'],
	})

	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	try {
		act(() => root.render(App, { tabs, person: 'Avery' }))
		await act(async () => {
			await Promise.resolve()
			await Promise.resolve()
		})

		const left = container.querySelector('#base-left') as HTMLButtonElement
		const right = container.querySelector('#base-right') as HTMLButtonElement
		expect(visible(left)).toBe(true)
		expect(visible(right)).toBe(false)
		act(() => left.click())
		act(() => (container.querySelector('[data-tab-value="right"]') as HTMLButtonElement).click())
		expect(visible(left)).toBe(false)
		expect(visible(right)).toBe(true)
		expect(bases.get('left')?.count).toBe(1)
		const rightTab = container.querySelector('[data-tab-value="right"]')!
		const panel = document.getElementById(rightTab.getAttribute('aria-controls')!)!
		expect(panel.getAttribute('aria-labelledby')).toBe(rightTab.id)
		expect(rightTab.getAttribute('aria-selected')).toBe('true')
		expect((await router.navigateUrl('/@left/items/coat')).status).toBe('committed')
		expect(visible(container.querySelector('#tab-item'))).toBe(true)
		expect(screenPerson).toBe('Avery')
		expect(screenStack).toBe('left')
		expect(container.querySelector('[data-tab-value="left"]')?.getAttribute('aria-selected')).toBe(
			'true',
		)

		act(() => root.render(App, { tabs: [...tabs].reverse(), person: 'Jordan' }))
		expect(container.querySelector('#base-left')).toBe(left)
		expect(container.querySelector('#base-right')).toBe(right)
		expect(bases.get('left')).toMatchObject({ count: 1, person: 'Jordan' })
		expect(bases.get('right')?.person).toBe('Jordan')
		expect(screenPerson).toBe('Jordan')
		expect((await router.navigateUrl('/settings')).status).toBe('committed')
		expect(container.querySelector('#base-left')).toBe(left)
		expect(visible(left)).toBe(false)
		expect(visible(container.querySelector('#tab-settings'))).toBe(true)
		expect((await router.back()).status).toBe('committed')
		expect(visible(container.querySelector('#tab-item'))).toBe(true)
		expect(bases.get('left')?.count).toBe(1)
		expect((await router.back()).status).toBe('committed')
		expect(visible(left)).toBe(true)
		expect(container.querySelector('#base-left')).toBe(left)
		const change = vi.fn()
		act(() =>
			root.render(App, { tabs, person: 'Jordan', selectedKey: 'left', onSelectionChange: change }),
		)

		act(() => (container.querySelector('[data-tab-value="right"]') as HTMLButtonElement).click())
		expect(change).toHaveBeenCalledWith('right')
		expect(visible(left)).toBe(true)
		expect(visible(right)).toBe(false)
	} finally {
		act(() => root.unmount())
		router.dispose()
		container.remove()
	}
})

it('selects incoming panes through the explicitly owning browser host', async () => {
	history.replaceState(null, '', '/')
	const platform = createBrowserRouterHost()
	const navigation = createRouter({
		catalog: defineRoutes([
			defineRoute({ path: '/owned' }).screen(() => <p id="owned-item">Owned</p>),
		]),
		host: platform.host,
		stacks: ['right'],
	})

	platform.attach(navigation)
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	function Owned() {
		return (
			<ClientRouteOutlet host={platform}>
				<Tabs
					tabs={[
						{ key: 'home', title: 'Home', render: () => <p>Home</p> },
						{
							key: 'right',
							title: 'Right',
							stack: 'right',
							render: () => <p id="owned-base">Right base</p>,
						},
					]}
				/>
			</ClientRouteOutlet>
		)
	}

	try {
		act(() => root.render(Owned))
		expect((await navigation.forStack('right').navigateUrl('/@right/owned')).status).toBe(
			'committed',
		)

		expect(visible(container.querySelector('#owned-item'))).toBe(true)
		expect(container.querySelector('[data-tab-value="right"]')?.getAttribute('aria-selected')).toBe(
			'true',
		)

		await navigation.back()
		expect(visible(container.querySelector('#owned-base'))).toBe(true)
	} finally {
		act(() => root.unmount())
		navigation.dispose()
		container.remove()
	}
})
