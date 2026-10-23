// @vitest-environment node
// registerRouterDevActions: idempotent registration, announced contract, and
// the DevActionNavigator's NavigationResult → DevNavigationResult mapping on a
// real configured router with a protocol host (not a browser/Frame emulator).
import { afterEach, expect, it } from 'vitest'
import { listDevActions } from '@octane-xplat/platform/dev-actions'
import { createNavigationBlocker, registerNavigationBlocker } from './navigation-blocker'
import { bindRouterFlow, createRouter } from './router-instance'
import { defineRoutes } from './route-table'
import { registerRouterDevActionsFor, devNavigate } from './routing/dev-shared'
import type { PreparedRouteMatch, RouterHost } from './props'

function host() {
	const flows = new Map<string, (PreparedRouteMatch | null)[]>()
	const listeners = new Set<() => void>()
	const entries = (flow: string) => {
		let found = flows.get(flow)
		if (!found) {
			found = [null]
			flows.set(flow, found)
		}
		return found
	}
	const adapter: RouterHost = {
		history: 'independent',
		canReset: true,
		getSnapshot(flow) {
			const values = entries(flow)
			return {
				route: values.at(-1) ?? null,
				canGoBack: values.length > 1,
				modal: flow.startsWith('modal:'),
			}
		},
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
			const values = entries(command.flow)
			if (command.action === 'back') {
				values.pop()
			} else if (command.action === 'replace' || command.action === 'refresh') {
				values[values.length - 1] = command.route!
			} else {
				values.push(command.route!)
			}
			for (const listener of listeners) {
				listener()
			}
			return { status: 'committed', route: adapter.getSnapshot(command.flow).route }
		},
		dispose() {
			listeners.clear()
			flows.clear()
		},
	}
	return { adapter }
}

function fixture() {
	const platform = host()
	const router = createRouter({
		catalog: defineRoutes([
			{ path: '/home', screen: () => null },
			{ path: '/items/:id', screen: () => null },
			{ path: '/checkout', screen: () => null },
		]),
		host: platform.adapter,
	})
	return router
}

const cleanups: (() => void)[] = []
afterEach(() => {
	for (const cleanup of cleanups.splice(0).reverse()) {
		cleanup()
	}
})

const tick = () => new Promise((resolve) => setTimeout(resolve, 250))

it('registers xplat.navigate idempotently and announces its contract', () => {
	const router = fixture()
	const first = registerRouterDevActionsFor(router)
	cleanups.push(() => first.dispose())
	const again = registerRouterDevActionsFor(router)
	expect(again).toBe(first)

	const action = listDevActions().find((entry) => entry.id === 'xplat.navigate')
	expect(action).toBeTruthy()
	expect(action.effects.navigation).toBe(true)
	expect(action.execution.concurrency).toBe('serialized')
	expect(Object.keys(action.input.fields).sort()).toEqual(['replace', 'url'])
	expect(action.availability.ready).toBe(true)

	first.dispose()
	expect(listDevActions().some((entry) => entry.id === 'xplat.navigate')).toBe(false)
	// Disposing restores a clean registration for the next caller.
	const restored = registerRouterDevActionsFor(router)
	cleanups.push(() => restored.dispose())
	expect(restored).not.toBe(first)
	expect(listDevActions().some((entry) => entry.id === 'xplat.navigate')).toBe(true)
})

it('maps a committed navigation to ok with the concrete route', async () => {
	const router = fixture()
	cleanups.push(() => router.dispose())
	const controller = new AbortController()
	const committed = await devNavigate(router, '/items/coat', controller.signal)
	expect(committed).toEqual({ ok: true, route: '/items/coat' })
})

it('maps an unmatched URL to navigation_failed, never navigation_blocked', async () => {
	const router = fixture()
	cleanups.push(() => router.dispose())
	const controller = new AbortController()
	const missing = await devNavigate(router, '/no-such-route', controller.signal)
	expect(missing.ok).toBe(false)
	expect(missing).toMatchObject({ code: 'navigation_failed', status: 'not-found' })
})

it('cancels a blocker-held attempt and reports navigation_blocked', async () => {
	const router = fixture()
	cleanups.push(() => router.dispose())
	const bound = bindRouterFlow(router, 'root')
	const blocker = createNavigationBlocker()
	const unregister = registerNavigationBlocker(bound, {
		blocker,
		shouldBlock: () => true,
	})
	cleanups.push(unregister)

	const controller = new AbortController()
	const result = await devNavigate(router, '/checkout', controller.signal)
	expect(result.ok).toBe(false)
	expect(result).toMatchObject({ code: 'navigation_blocked' })

	// The superseding refresh clears the held confirmation — the blocker state
	// returns to idle instead of waiting forever.
	await tick()
	expect(blocker.getSnapshot().status).toBe('idle')
	// The held navigation never committed.
	expect(router.getSnapshot().route).toBeNull()
})

it('honors the abort signal on a held attempt', async () => {
	const router = fixture()
	cleanups.push(() => router.dispose())
	const bound = bindRouterFlow(router, 'root')
	const blocker = createNavigationBlocker()
	cleanups.push(
		registerNavigationBlocker(bound, {
			blocker,
			shouldBlock: () => true,
		}),
	)

	const controller = new AbortController()
	setTimeout(() => controller.abort(), 10)
	const result = await devNavigate(router, '/checkout', controller.signal)
	expect(result.ok).toBe(false)
	expect(result).toMatchObject({ code: 'navigation_failed', status: 'cancelled' })
	await tick()
	expect(blocker.getSnapshot().status).toBe('idle')
})
