// @vitest-environment node
import { expect, it } from 'vitest'
import { createRouter } from './router-instance'
import { defineRoute } from './define-route'
import { defineRoutes } from './route-table'
import { createNavigationBlocker, registerNavigationBlocker } from './navigation-blocker'
import type { PreparedRouteMatch, RouterHost, RouterHostChange } from '../props'

// Host protocol only. Real browser/native history and input are qualified separately.
function fixture() {
	const histories = new Map<string, (PreparedRouteMatch | null)[]>()
	const listeners = new Set<(change?: RouterHostChange) => void>()
	const entries = (flow: string) => {
		let found = histories.get(flow)
		if (!found) {
			found = [null]
			histories.set(flow, found)
		}
		return found
	}
	const events: string[] = []
	let account = 'a',
		contexts = 0
	const host: RouterHost = {
		history: 'independent',
		canReset: true,
		getSnapshot: (flow) => ({
			route: entries(flow).at(-1) ?? null,
			canGoBack: entries(flow).length > 1,
			modal: false,
		}),
		subscribe(listener) {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
		async commit(command) {
			const values = entries(command.flow)
			let target = values.at(-2)
			if (command.action === 'back' && target) {
				const result = await command.prepare!(target.href, command.flow)
				if (result.status !== 'ready') {
					return result
				}

				target = result.route
			}
			if (!command.beginCommit()) {
				return { status: 'cancelled', reason: 'superseded' }
			}
			if (command.action === 'back') {
				values.pop()
				values[values.length - 1] = target ?? null
			} else if (command.action === 'replace' || command.action === 'refresh') {
				values[values.length - 1] = command.route!
			} else if (command.action === 'reset') {
				histories.set(command.flow, [command.route!])
			} else {
				values.push(command.route!)
			}
			events.push('commit:' + command.action)
			for (const listener of listeners) {
				listener({ flow: command.flow })
			}
			return { status: 'committed', route: host.getSnapshot(command.flow).route }
		},
	}
	const catalog = defineRoutes([
		defineRoute
			.withContext<{ account: string }>()({
				path: '/items/:id',
				beforeLoad({ params }) {
					events.push('guard:' + params.id)
				},
				loader({ params, context }) {
					events.push('load:' + params.id)
					return { account: context.account }
				},
			})
			.screen(() => null),
	])
	const router = createRouter({
		catalog,
		host,
		stacks: ['detail'],
		context: () => {
			contexts++
			return { account }
		},
	})
	const root = router.forStack('root')
	const blocker = createNavigationBlocker()
	let when = true
	let remove = () => {}
	return {
		router,
		root,
		blocker,
		events,
		entries,
		setAccount(value: string) {
			account = value
		},
		get contexts() {
			return contexts
		},
		setWhen(value: boolean) {
			when = value
		},
		register() {
			remove = registerNavigationBlocker(root, { blocker, shouldBlock: () => when })
			return remove
		},
		close() {
			remove()
			router.dispose()
		},
	}
}

function controls(test: ReturnType<typeof fixture>) {
	const value = test.blocker.getSnapshot()
	if (value.status !== 'blocked') {
		throw new Error('Expected confirmation')
	}
	return value
}

it('holds before context/guards/loaders and snapshots current context after proceeding', async () => {
	const test = fixture()
	try {
		await test.root.push({ to: '/items/:id', params: { id: 'coat' } })
		test.register()
		test.events.length = 0
		const contexts = test.contexts
		const next = test.root.push({ to: '/items/:id', params: { id: 'hat' } })
		expect(test.root.getSnapshot().route?.params.id).toBe('coat')
		expect(test.root.getSnapshot().navigation.status).toBe('pending')
		expect(test.events).toEqual([])
		expect(test.contexts).toBe(contexts)
		test.setAccount('b')
		controls(test).proceed()
		expect(await next).toMatchObject({ status: 'committed', route: { data: { account: 'b' } } })
		expect(test.events).toEqual(['guard:hat', 'load:hat', 'commit:push'])
		expect(test.contexts).toBe(contexts + 1)
		await Promise.resolve()
		expect(test.blocker.getSnapshot().status).toBe('idle')
	} finally {
		test.close()
	}
})

it('reset cancels without failure feedback, loading or history mutation', async () => {
	const test = fixture()
	try {
		await test.root.push({ to: '/items/:id', params: { id: 'coat' } })
		test.register()
		const current = test.root.getSnapshot().route
		test.events.length = 0
		const next = test.root.replace({ to: '/items/:id', params: { id: 'hat' } })
		controls(test).reset()
		expect(await next).toEqual({ status: 'cancelled', reason: 'aborted' })
		expect(test.root.getSnapshot()).toMatchObject({
			route: current,
			navigation: { status: 'idle' },
		})

		expect(test.root.getSnapshot().route).toBe(current)
		expect(test.events).toEqual([])
	} finally {
		test.close()
	}
})

it('supersedes held attempts and prevents their controls from accepting a newer destination', async () => {
	const test = fixture()
	try {
		test.register()
		const first = test.root.push({ to: '/items/:id', params: { id: 'coat' } })
		const obsolete = controls(test)
		const next = test.root.push({ to: '/items/:id', params: { id: 'hat' } })
		const current = controls(test)
		obsolete.proceed()
		obsolete.reset()
		expect(await first).toEqual({ status: 'cancelled', reason: 'superseded' })
		expect(test.blocker.getSnapshot()).toBe(current)
		current.proceed()
		expect(await next).toMatchObject({ status: 'committed', route: { params: { id: 'hat' } } })
		expect(test.events).not.toContain('load:coat')
	} finally {
		test.close()
	}
})

it('confirms Back to both a prepared entry and the declaring base', async () => {
	const test = fixture()
	try {
		await test.root.push({ to: '/items/:id', params: { id: 'coat' } })
		await test.root.push({ to: '/items/:id', params: { id: 'hat' } })
		test.register()
		test.events.length = 0
		const refused = test.root.back()
		controls(test).reset()
		expect(await refused).toEqual({ status: 'cancelled', reason: 'aborted' })
		expect(test.entries('root')).toHaveLength(3)
		expect(test.events).toEqual([])
		const admitted = test.root.back()
		test.setAccount('b')
		controls(test).proceed()
		expect(await admitted).toMatchObject({
			status: 'committed',
			route: { params: { id: 'coat' }, data: { account: 'b' } },
		})

		const base = test.root.back()
		controls(test).proceed()
		expect(await base).toMatchObject({ status: 'committed', route: null })
		expect(test.root.getSnapshot().canGoBack).toBe(false)
	} finally {
		test.close()
	}
})

it('keeps confirmation independent per flow and lets refresh stay in the current entry', async () => {
	const test = fixture()
	try {
		await test.root.push({ to: '/items/:id', params: { id: 'coat' } })
		test.register()
		expect(
			(await test.router.forStack('detail').push({ to: '/items/:id', params: { id: 'hat' } }))
				.status,
		).toBe('committed')

		expect(test.blocker.getSnapshot().status).toBe('idle')
		test.setAccount('b')
		expect(await test.root.refresh()).toMatchObject({
			status: 'committed',
			route: { data: { account: 'b' } },
		})

		expect(test.blocker.getSnapshot().status).toBe('idle')
	} finally {
		test.close()
	}
})

it('removal refuses a held request but a new registration still works', async () => {
	const test = fixture()
	try {
		const remove = test.register()
		const held = test.root.push({ to: '/items/:id', params: { id: 'coat' } })
		remove()
		expect(await held).toEqual({ status: 'cancelled', reason: 'aborted' })
		test.register()
		const next = test.root.push({ to: '/items/:id', params: { id: 'hat' } })
		controls(test).proceed()
		expect((await next).status).toBe('committed')
	} finally {
		test.close()
	}
})

it('instance disposal and registry replacement release held work', async () => {
	const test = fixture()
	try {
		test.register()
		const first = test.root.push({ to: '/items/:id', params: { id: 'coat' } })
		const registration = test.router.addRoutes(
			defineRoutes([defineRoute({ path: '/extra' }).screen(() => null)]),
			{ id: 'extra' },
		)

		expect(await first).toEqual({ status: 'cancelled', reason: 'registry-changed' })
		await Promise.resolve()
		expect(test.blocker.getSnapshot().status).toBe('idle')
		registration.dispose()
		const second = test.root.push({ to: '/items/:id', params: { id: 'hat' } })
		test.router.dispose()
		expect(await second).toEqual({ status: 'cancelled', reason: 'disposed' })
		expect(test.events).toEqual([])
	} finally {
		test.close()
	}
})

it('rejects a statically invalid destination without opening an unsaved-change confirmation', async () => {
	const test = fixture()
	try {
		test.register()
		const missing = test.root.navigateUrl('/missing')
		await Promise.resolve()
		const state = test.blocker.getSnapshot()
		// Keep the regression bounded if admission ever asks first.
		if (state.status === 'blocked') {
			state.reset()
		}

		expect(await missing).toMatchObject({ status: 'not-found' })
		expect(state.status).toBe('idle')
		expect(test.events).toEqual([])
	} finally {
		test.close()
	}
})
