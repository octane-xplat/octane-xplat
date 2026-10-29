// @vitest-environment node
import { expect, it } from 'vitest'
import { createDefaultRouterRuntime } from './default-router-runtime'
import { createRouterRenderScope } from './router-render-scope'
import { defineRoute } from './define-route'
import { defineRoutes } from './route-table'
import type {
	ClientRouterHost,
	PreparedRouteMatch,
	RouterHostChange,
	RouterInstance,
} from '../props'

function fixture() {
	let constructed = 0
	let disposed = 0
	let failAttach = false
	const states = new Map<string, PreparedRouteMatch>()
	const listeners = new Set<(change?: RouterHostChange) => void>()
	let attached: RouterInstance<any>
	const runtime = createDefaultRouterRuntime(() => {
		constructed++
		return {
			host: {
				history: 'independent',
				canReset: true,
				getSnapshot: (flow) => ({
					route: states.get(flow) ?? null,
					canGoBack: false,
					modal: false,
				}),
				subscribe(listener) {
					listeners.add(listener)
					return () => {
						listeners.delete(listener)
					}
				},
				commit(command) {
					if (!command.beginCommit()) {
						return { status: 'cancelled', reason: 'superseded' }
					}
					if (command.route) {
						states.set(command.flow, command.route)
					}
					for (const listener of listeners) {
						listener({ flow: command.flow })
					}
					return { status: 'committed', route: states.get(command.flow) ?? null }
				},
				dispose() {
					disposed++
					listeners.clear()
				},
			},
			attach(instance) {
				attached = instance
				if (failAttach) {
					throw new Error('Attach failed')
				}
			},
			scope(flow) {
				return createRouterRenderScope(attached, flow)
			},
			mount() {
				return () => {}
			},
		} satisfies ClientRouterHost
	})
	const route = defineRoute
		.withContext<{ account: string }>()({
			path: '/items/:id',
			loader: ({ params, context }) => ({ title: context.account + ':' + params.id }),
		})
		.screen(() => null)
	const catalog = defineRoutes([route])
	return {
		runtime,
		catalog,
		states,
		get constructed() {
			return constructed
		},
		get disposed() {
			return disposed
		},
		set failAttach(value: boolean) {
			failAttach = value
		},
		get attached() {
			return attached
		},
	}
}

it('defers host creation until first use and keeps the facade identity in rendering scopes', async () => {
	const f = fixture()
	expect(f.runtime.configured.getSnapshot()).toBe(false)
	expect(() => f.runtime.router.clearFailure()).not.toThrow()
	expect(f.constructed).toBe(0)
	expect(() => f.runtime.getClient()).toThrow('Configure routes')
	f.runtime.configure({ catalog: f.catalog, context: { account: 'a' }, stacks: ['left'] })
	expect(f.runtime.hasStack('root')).toBe(true)
	expect(f.runtime.hasStack('left')).toBe(true)
	expect(f.runtime.hasStack('invented')).toBe(false)
	expect(f.constructed).toBe(0)
	const client = f.runtime.getClient()
	expect(f.constructed).toBe(1)
	expect(f.runtime.getClient()).toBe(client)
	expect(f.attached).toBe(f.runtime.router)
	const scope = client.platform.scope('root')
	expect(scope.instance).toBe(f.runtime.router)
	expect((await scope.navigator.navigateUrl('/items/coat')).status).toBe('committed')
	expect(f.runtime.router.getSnapshot()).toBe(scope.navigator.getSnapshot())
	expect(f.states.get('root')?.data).toEqual({ title: 'a:coat' })
	f.runtime.router.dispose()
})

it('replaces the generated contribution while preserving plugins and reading current context', async () => {
	const f = fixture()
	f.runtime.configure({ catalog: f.catalog, context: { account: 'a' } })
	const plugin = f.runtime.router.addRoutes(
		defineRoutes([defineRoute({ path: '/help' }).screen(() => null)]),
		{ id: 'plugin' },
	)
	await f.runtime.router.navigateUrl('/items/coat')
	f.runtime.configure({ catalog: f.catalog, context: async () => ({ account: 'b' }) })
	await f.runtime.router.navigateUrl('/items/hat')
	expect(f.states.get('root')?.data).toEqual({ title: 'b:hat' })
	expect((await f.runtime.router.navigateUrl('/help')).status).toBe('committed')
	plugin.dispose()
	expect(await f.runtime.router.navigateUrl('/help')).toEqual({
		status: 'not-found',
		reason: 'pattern',
	})
	expect(f.constructed).toBe(1)
	f.runtime.router.dispose()
})

it('accepts only canonical destination fields after configuration', async () => {
	const f = fixture()
	f.runtime.configure({ catalog: f.catalog, context: { account: 'a' } })
	expect(
		await f.runtime.router.validateDestination({
			stack: 'root',
			name: 'items/:id',
			params: { id: 'coat' },
		}),
	).toMatchObject({ status: 'invalid-input' })
	expect(
		await f.runtime.router.validateDestination({ to: '/items/:id', params: { id: 'coat' } }),
	).toMatchObject({ status: 'valid' })
	f.runtime.router.dispose()
})

it('rejects changed host settings without partially replacing a running configuration', async () => {
	const f = fixture()
	f.runtime.configure({ catalog: f.catalog, context: { account: 'a' }, stacks: ['left'] })
	f.runtime.getClient()
	expect(() =>
		f.runtime.configure({ catalog: f.catalog, context: { account: 'b' }, stacks: ['right'] }),
	).toThrow('reload')
	await f.runtime.router.navigateUrl('/items/coat')
	expect(f.states.get('root')?.data).toEqual({ title: 'a:coat' })
	f.runtime.router.dispose()
})

it('disposes a failed host attachment and can retry construction cleanly', async () => {
	const f = fixture()
	f.runtime.configure({ catalog: f.catalog, context: { account: 'a' } })
	f.failAttach = true
	expect(() => f.runtime.getClient()).toThrow('Attach failed')
	expect(f.disposed).toBe(1)
	f.failAttach = false
	expect((await f.runtime.router.navigateUrl('/items/coat')).status).toBe('committed')
	expect(f.constructed).toBe(2)
	f.runtime.router.dispose()
	expect(f.disposed).toBe(2)
})

it('disposing an unused facade creates no host and an active disposed instance stays ended', async () => {
	const f = fixture()
	f.runtime.router.dispose()
	expect(f.constructed).toBe(0)
	f.runtime.configure({ catalog: f.catalog, context: { account: 'a' } })
	f.runtime.getClient()
	f.runtime.router.dispose()
	f.runtime.router.dispose()
	expect(f.disposed).toBe(1)
	expect(await f.runtime.router.navigateUrl('/items/coat')).toEqual({
		status: 'cancelled',
		reason: 'disposed',
	})
	expect(f.constructed).toBe(1)
})

it('applies configured incoming-link policy and snapshots its allowlists', async () => {
	const f = fixture()
	const allowedSchemes = ['pack']
	const allowedOrigins = ['https://app.test']
	f.runtime.configure({
		catalog: f.catalog,
		context: { account: 'a' },
		allowedSchemes,
		allowedOrigins,
	})
	allowedSchemes.push('other')
	allowedOrigins.push('https://other.test')
	expect((await f.runtime.router.navigateUrl('pack://items/coat')).status).toBe('committed')
	expect((await f.runtime.router.navigateUrl('https://app.test/items/hat')).status).toBe(
		'committed',
	)
	expect((await f.runtime.router.navigateUrl('other://items/coat')).status).toBe('invalid-input')
	expect((await f.runtime.router.navigateUrl('https://other.test/items/coat')).status).toBe(
		'invalid-input',
	)
	expect(() => f.runtime.configure({ catalog: f.catalog, allowedSchemes: ['other'] })).toThrow(
		'reload',
	)
	f.runtime.router.dispose()
})
