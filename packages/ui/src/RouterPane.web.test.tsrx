// @vitest-environment jsdom
/** @jsxImportSource octane */
import { act, createContext, createRoot, useContext, useState } from 'octane'
import { expect, it, vi } from 'vitest'
import { qualifyPaneRouterExample } from '../tests/pane-router-example.tsrx'
import { createPaneRouterHost } from './pane-router-client'
import { RouterPane } from './RouterPane.tsrx'
import { createRouter } from './router-instance'
import { defineRoute } from './define-route'
import { defineRoutes } from './route-table'
import { RouterProvider, getRouteApi, useRouter } from './router-hooks.tsrx'
import { RouteOutlet } from './RouteOutlet.web.tsrx'
const Person = createContext('missing')
const Provider: any = Person
it('retains pane entries, provider values and entry-owned hooks in the real DOM renderer', async () => {
	const host = createPaneRouterHost()
	let removePane = () => {}
	function Item(): any {
		const match = getRouteApi('/items/:id', navigation).useMatch()
		const navigationForEntry = useRouter(navigation)
		const person = useContext(Person)
		const [count, setCount] = useState(0)
		return (
			<button data-item={match.params.id} onClick={() => setCount(count + 1)}>
				{match.data.title +
					':' +
					count +
					':' +
					person +
					':' +
					navigationForEntry.getSnapshot().route?.params.id}
			</button>
		)
	}

	function Layout(props: { children?: any }): any {
		return <RouteOutlet>{props.children}</RouteOutlet>
	}

	const catalog = defineRoutes({
		routes: [
			defineRoute({ path: '/items/:id', loader: ({ params }) => ({ title: params.id }) }).screen(
				Item,
			),
		],
		layouts: { items: Layout },
	})

	const navigation = createRouter({ catalog, host: host.host, stacks: ['other'] })
	host.attach(navigation)
	function App(): any {
		const [shown, setShown] = useState(true)
		removePane = () => setShown(false)
		return (
			<Provider value="Avery">
				<RouterProvider router={navigation}>
					{shown ? (
						<RouterPane host={host} router={navigation}>
							<p>Base</p>
						</RouterPane>
					) : null}
					<RouterPane host={host} router={navigation} stack="other">
						<p>Other base</p>
					</RouterPane>
				</RouterProvider>
			</Provider>
		)
	}

	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	try {
		act(() => root.render(App, {}))
		const entered = await navigation.push({ to: '/items/:id', params: { id: 'coat' } })
		expect(entered.status).toBe('committed')
		if (entered.status !== 'committed') {
			throw new Error('Expected the pane to commit')
		}

		expect(await entered.finished).toMatchObject({ status: 'skipped' })

		const coat = container.querySelector('[data-item="coat"]') as HTMLButtonElement
		act(() => coat.click())
		expect(coat.textContent).toBe('coat:1:Avery:coat')
		await navigation.push({ to: '/items/:id', params: { id: 'hat' } })
		expect(container.querySelector('[data-item="coat"]')).toBe(coat)
		expect(coat.textContent).toBe('coat:1:Avery:hat')
		await navigation.forStack('other').push({ to: '/items/:id', params: { id: 'glove' } })
		expect(container.querySelector('[data-item="glove"]')?.textContent).toBe('glove:0:Avery:glove')
		expect((await navigation.back()).status).toBe('committed')
		expect(container.querySelector('[data-item="coat"]')).toBe(coat)
		expect(coat.textContent).toBe('coat:1:Avery:coat')
		act(removePane)
		expect(navigation.getSnapshot().route).toBeNull()
		expect(navigation.getSnapshot().canGoBack).toBe(false)
		expect(container.querySelector('[data-item="glove"]')?.textContent).toBe('glove:0:Avery:glove')
		expect(
			(await navigation.forStack('other').push({ to: '/items/:id', params: { id: 'scarf' } }))
				.status,
		).toBe('committed')
	} finally {
		act(() => root.unmount())
		navigation.dispose()
		container.remove()
	}
})

it('rejects a host bound to another instance before mounting a pane', () => {
	const catalog = defineRoutes([defineRoute({ path: '/help' }).screen(() => null)])
	const firstHost = createPaneRouterHost()
	const secondHost = createPaneRouterHost()
	const first = createRouter({ catalog, host: firstHost.host })
	const second = createRouter({ catalog, host: secondHost.host })
	firstHost.attach(first)
	secondHost.attach(second)
	try {
		expect(() => RouterPane({ host: firstHost, router: second })).toThrow(
			'different router instance',
		)
	} finally {
		first.dispose()
		second.dispose()
	}
})

it('requires host attachment before mounting its instance', () => {
	const host = createPaneRouterHost()
	const navigation = createRouter({ catalog: defineRoutes([]), host: host.host })
	try {
		expect(() => RouterPane({ host, router: navigation })).toThrow('Pane host is not attached')
	} finally {
		navigation.dispose()
	}
})

it('refuses a navigation host already owned by another instance', () => {
	const host = createPaneRouterHost()
	const catalog = defineRoutes([])
	const first = createRouter({ catalog, host: host.host })
	let cleanupUnexpected = () => {}
	try {
		expect(() => {
			const unexpected = createRouter({ catalog, host: host.host })
			cleanupUnexpected = () => unexpected.dispose()
		}).toThrow('A router host can belong to only one instance')
	} finally {
		cleanupUnexpected()
		first.dispose()
	}
})

it('rejects attachment to an instance created with another host', () => {
	const host = createPaneRouterHost()
	const other = createPaneRouterHost()
	const navigation = createRouter({ catalog: defineRoutes([]), host: other.host })
	try {
		expect(() => host.attach(navigation)).toThrow('instance created with this pane host')
	} finally {
		navigation.dispose()
	}
})

it('rejects cloned host objects even when their type witness is preserved', () => {
	const host = createPaneRouterHost()
	const navigation = createRouter({ catalog: defineRoutes([]), host: host.host })
	host.attach(navigation)
	try {
		expect(() => RouterPane({ host: { ...host }, router: navigation })).toThrow('original host')
	} finally {
		navigation.dispose()
	}
})

it('does not recycle a disposed host for another instance', () => {
	const host = createPaneRouterHost()
	const catalog = defineRoutes([])
	const navigation = createRouter({ catalog, host: host.host })
	navigation.dispose()
	expect(() => createRouter({ catalog, host: host.host })).toThrow('only one instance')
})

it('allows construction to retry after invalid configuration is repaired', () => {
	const host = createPaneRouterHost()
	const catalog = defineRoutes([])
	expect(() =>
		Reflect.apply(createRouter, undefined, [{ catalog: { ...catalog }, host: host.host }]),
	).toThrow('original catalog')

	const navigation = createRouter({ catalog, host: host.host })
	try {
		expect(() => host.attach(navigation)).not.toThrow()
	} finally {
		navigation.dispose()
	}
})

it('runs the shared public pane example with DOM identity and lifecycle assertions', async () => {
	const container = document.createElement('div')
	document.body.append(container)
	try {
		await qualifyPaneRouterExample({
			mount(Component, props) {
				const root = createRoot(container)
				act(() => root.render(Component, props))
				return () => act(() => root.unmount())
			},
			find: (id) => container.querySelector('#' + id),
			check: (name, pass) => expect(pass, name).toBe(true),
			wait: (name, predicate) => vi.waitFor(() => expect(predicate(), name).toBe(true)),
		})
	} finally {
		container.remove()
	}
})
