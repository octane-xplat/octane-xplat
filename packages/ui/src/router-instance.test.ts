// @vitest-environment node
import { sealGeneratedRouteCatalog } from './route-contract-scope'
import { expect, it } from 'vitest'
import { defineRoute } from './define-route'
import { defineRuntimeRoutes, defineRoutes, deriveLazyRouteManifest } from './route-table'
import { createRouter, bindRouterFlow, readRouterMatch } from './router-instance'
import { createSearchUpdater } from './route-search-updater'
import { DestinationRedirect, RouteForbidden } from './routing-core'
import { RouteRegistrationError } from './route-registry'
import type {
	PreparedRouteMatch,
	RouterHost,
	RouterHostCommand,
	RouterHostResult,
	RouteTransitionResult,
} from './props'

function deferred<Value>() {
	let resolve!: (value: Value) => void
	const promise = new Promise<Value>((done) => {
		resolve = done
	})
	return { promise, resolve }
}

// Protocol fixture, not a browser/Frame emulator. It keeps a shell base and
// independently owned histories so the instance contract can be exercised.
function host(history: RouterHost['history'] = 'independent') {
	const flows = new Map<string, (PreparedRouteMatch | null)[]>()
	const listeners = new Set<() => void>()
	let disposed = false
	const entries = (flow: string) => {
		let found = flows.get(flow)
		if (!found) {
			found = [null]
			flows.set(flow, found)
		}
		return found
	}
	const adapter: RouterHost = {
		history,
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
			} else if (command.action === 'dismiss') {
				flows.set(command.flow, [null])
			} else if (command.action === 'reset') {
				flows.set(command.flow, [command.route!])
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
			disposed = true
			listeners.clear()
			flows.clear()
		},
	}
	return {
		adapter,
		flows,
		entries,
		get disposed() {
			return disposed
		},
	}
}

it('prepares retained history before commitment with fresh guards and data', async () => {
	const platform = host()
	let allowed = true
	let account = 'a'
	let loads = 0
	const router = createRouter({
		catalog: defineRoutes([
			defineRoute({
				path: '/private',
				beforeLoad() {
					if (!allowed) {
						throw new RouteForbidden()
					}
				},
				loader: () => ({ account, load: ++loads }),
			}).screen(() => null),
			defineRoute({ path: '/public' }).screen(() => null),
		]),
		host: platform.adapter,
	})
	const commit = platform.adapter.commit
	platform.adapter.commit = async (command) => {
		if (command.action !== 'back') {
			return commit(command)
		}
		const entries = platform.entries(command.flow)
		const target = entries.at(-2)
		if (target) {
			const prepared = await command.prepare!(target.href, command.flow)
			if (prepared.status !== 'ready') {
				return prepared
			}

			if (!command.isCurrent()) {
				return { status: 'cancelled', reason: 'superseded' }
			}

			entries[entries.length - 2] = prepared.route
		}
		return commit(command)
	}
	await router.push({ to: '/private' })
	await router.push({ to: '/public' })
	allowed = false
	expect(await router.back()).toEqual({ status: 'forbidden' })
	expect(router.getSnapshot().route?.to).toBe('/public')
	expect(loads).toBe(1)
	allowed = true
	account = 'b'
	expect((await router.back()).status).toBe('committed')
	expect(router.getSnapshot().route?.data).toEqual({ account: 'b', load: 2 })
	router.dispose()
})

it('shares one context snapshot across sequential host preparations and refuses late preparation', async () => {
	const platform = host()
	platform.entries('root').push(null)
	let account = 'a'
	let reads = 0
	const router = createRouter({
		catalog: defineRoutes([
			defineRoute({
				path: '/items/:id',
				loader: ({ context }) => context.account,
			}).screen(() => null),
		]),
		context: () => ({ account: (reads++, account) }),
		host: platform.adapter,
	})
	platform.adapter.commit = async (command) => {
		const first = await command.prepare!('/items/coat')
		account = 'b'
		const second = await command.prepare!('/items/hat')
		expect(first.status === 'ready' && first.route.data).toBe('a')
		expect(second.status === 'ready' && second.route.data).toBe('a')
		expect(reads).toBe(1)
		expect(command.beginCommit()).toBe(true)
		expect(await command.prepare!('/items/late')).toEqual({
			status: 'unsupported',
			operation: 'prepare-after-commit',
		})
		return { status: 'committed', route: second.status === 'ready' ? second.route : null }
	}
	expect((await router.back()).status).toBe('committed')
	router.dispose()
})

it('cancels a host history preparation before the host can mutate history', async () => {
	const platform = host()
	platform.entries('root').push(null)
	const gate = deferred<void>()
	const entered = deferred<void>()
	let mutations = 0
	const router = createRouter({
		catalog: defineRoutes([
			defineRoute({
				path: '/private',
				async beforeLoad() {
					entered.resolve()
					await gate.promise
				},
			}).screen(() => null),
			defineRoute({ path: '/public' }).screen(() => null),
		]),
		host: platform.adapter,
	})
	const commit = platform.adapter.commit
	platform.adapter.commit = async (command) => {
		if (command.action !== 'back') {
			return commit(command)
		}
		const prepared = await command.prepare!('/private')
		if (prepared.status !== 'ready') {
			return prepared
		}
		if (!command.beginCommit()) {
			return { status: 'cancelled', reason: 'superseded' }
		}
		mutations++
		return { status: 'committed', route: prepared.route }
	}
	const older = router.back()
	await entered.promise
	expect((await router.push({ to: '/public' })).status).toBe('committed')
	expect(await older).toEqual({ status: 'cancelled', reason: 'superseded' })
	gate.resolve()
	await gate.promise
	expect(mutations).toBe(0)
	router.dispose()
})

const catalog = defineRoutes([
	defineRoute({
		path: '/items/:id',
		loader: ({ params }) => ({ title: params.id }),
	}).screen(() => null),
	defineRoute({ path: '/settings' }).screen(() => null),
])

it('replaces a registration by id, ignores obsolete disposers, and restores shadowed definitions', async () => {
	const platform = host()
	const router = createRouter({
		catalog: defineRuntimeRoutes([
			defineRoute({
				path: '/items/:id',
				loader: ({ params }) => ({ title: params.id }),
			}).screen(() => null),
		]),
		host: platform.adapter,
	})
	const override = (title: string) =>
		defineRoutes([
			defineRoute({
				path: '/items/:id',
				loader: () => ({ title }),
			}).screen(() => null),
		])
	expect(() => router.addRoutes(override('bad'), { id: 'plugin' })).toThrow(RouteRegistrationError)
	const original = router.addRoutes(override('first'), {
		id: 'plugin',
		conflict: 'replace',
	})
	const replacement = router.addRoutes(override('second'), {
		id: 'plugin',
		conflict: 'replace',
	})
	original.dispose()
	await router.navigateUrl('/items/coat')
	expect(router.getSnapshot().route?.data).toEqual({ title: 'second' })
	replacement.dispose()
	replacement.dispose()
	// Removing definitions retains already prepared entries and their data.
	expect(router.getSnapshot().route?.data).toEqual({ title: 'second' })
	await router.refresh()
	expect(router.getSnapshot().route?.data).toEqual({ title: 'coat' })
	router.dispose()
	expect(() => router.addRoutes(catalog, { id: 'disposed' })).toThrow('disposed')
})

it('cancels removed-layer work promptly and rebinds already obtained validation methods', async () => {
	const platform = host()
	const router = createRouter({ catalog, host: platform.adapter })
	const data = deferred<{ title: string }>()
	const layer = router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/plugin',
				loader: () => data.promise,
			}).screen(() => null),
		]),
		{ id: 'plugin' },
	)
	const resolve = router.resolveUrl
	expect(resolve('/plugin').status).toBe('matched')
	const attempt = router.navigateUrl('/plugin')
	await Promise.resolve()
	layer.dispose()
	expect(await attempt).toEqual({
		status: 'cancelled',
		reason: 'registry-changed',
	})
	expect(resolve('/plugin').status).toBe('not-found')
	data.resolve({ title: 'late' })
	await Promise.resolve()
	expect(router.getSnapshot().route).toBeNull()
	router.dispose()
})

it('keeps registration failures atomic and registration snapshots isolated', async () => {
	const platform = host()
	const router = createRouter({ catalog, host: platform.adapter })
	const extra = defineRoutes([defineRoute({ path: '/extra' }).screen(() => null)])
	const old = router.addRoutes(extra, { id: 'plugin' })
	expect(() => {
		extra.routes[0].segments[0] = 'mutated'
	}).toThrow(TypeError)
	expect(() => router.addRoutes(catalog, { id: 'plugin' })).toThrow(RouteRegistrationError)
	expect(router.resolveUrl('/extra').status).toBe('matched')
	expect(router.resolveUrl('/mutated').status).toBe('not-found')
	old.dispose()
	expect(router.resolveUrl('/extra').status).toBe('not-found')
	router.dispose()
})

it('refuses navigation started reentrantly by a removed loader abort callback', async () => {
	const platform = host()
	const data = deferred<void>()
	const started = deferred<void>()
	const router = createRouter({
		catalog,
		host: platform.adapter,
		createCancellationController: () => new AbortController(),
	})
	let reentrant: ReturnType<typeof router.push> | undefined
	const layer = router.addRoutes(
		defineRoutes([
			defineRoute({
				path: '/aborted',
				loader: ({ signal }) => {
					signal!.addEventListener('abort', () => {
						reentrant = router.push({ to: '/settings' })
					})
					started.resolve()
					return data.promise
				},
			}).screen(() => null),
		]),
		{ id: 'plugin' },
	)
	const attempt = router.navigateUrl('/aborted')
	await started.promise
	layer.dispose()
	expect(await attempt).toEqual({
		status: 'cancelled',
		reason: 'registry-changed',
	})
	expect(await reentrant).toEqual({
		status: 'cancelled',
		reason: 'registry-changed',
	})
	expect(router.getSnapshot().route).toBeNull()
	data.resolve()
	router.dispose()
})

it('pushes, replaces, resets, and falls back without confusing history actions', async () => {
	const platform = host()
	const router = createRouter({ catalog, host: platform.adapter })
	expect(router.getSnapshot()).toBe(router.getSnapshot())
	await router.push({ to: '/items/:id', params: { id: 'a' } })
	await router.push({ to: '/items/:id', params: { id: 'b' } })
	await router.replace({ to: '/settings' })
	expect(platform.entries('root').map((entry) => entry?.to)).toEqual([
		undefined,
		'/items/:id',
		'/settings',
	])
	await router.back()
	expect(router.getSnapshot().route?.data).toEqual({ title: 'a' })
	await router.reset({ to: '/settings' })
	expect(router.getSnapshot().canGoBack).toBe(false)
	expect(await router.back()).toEqual({ status: 'at-base' })
	await router.back({ fallback: { to: '/items/:id', params: { id: 'fallback' } } })
	expect(platform.entries('root')).toHaveLength(1)
	expect(router.getSnapshot().route?.data).toEqual({ title: 'fallback' })
})

it('retains current content during loading and settles superseded work promptly', async () => {
	const waiting = deferred<string>()
	const routes = defineRoutes([
		defineRoute({
			path: '/items/:id',
			loader: ({ params }) => (params.id === 'slow' ? waiting.promise : params.id),
		}).screen(() => null),
	])
	const platform = host()
	const router = createRouter({ catalog: routes, host: platform.adapter })
	await router.push({ to: '/items/:id', params: { id: 'visible' } })
	const slow = router.push({ to: '/items/:id', params: { id: 'slow' } })
	expect(router.getSnapshot()).toMatchObject({
		route: { data: 'visible' },
		navigation: { status: 'pending', destination: { params: { id: 'slow' } } },
	})
	await router.push({ to: '/items/:id', params: { id: 'latest' } })
	expect(await slow).toEqual({ status: 'cancelled', reason: 'superseded' })
	waiting.resolve('late')
	await waiting.promise
	expect(router.getSnapshot()).toMatchObject({
		route: { data: 'latest' },
		navigation: { status: 'idle' },
	})
})

it('checks deferred host commits and keeps animation settlement separate', async () => {
	const platform = host()
	const prepared = deferred<RouterHostCommand>()
	const release = deferred<void>()
	const animation = deferred<RouteTransitionResult>()
	const commit = platform.adapter.commit
	platform.adapter.commit = async (command) => {
		if (command.route?.params.id === 'slow') {
			prepared.resolve(command)
			await release.promise
		}
		const result = await commit(command)
		return result.status === 'committed' ? { ...result, finished: animation.promise } : result
	}
	const router = createRouter({ catalog, host: platform.adapter })
	const slow = router.push({ to: '/items/:id', params: { id: 'slow' } })
	await prepared.promise
	const result = await router.push({ to: '/settings' })
	expect(result.status).toBe('committed')
	expect(await slow).toEqual({ status: 'cancelled', reason: 'superseded' })
	release.resolve()
	await release.promise
	if (result.status === 'committed') {
		animation.resolve({ status: 'skipped', reason: 'interrupted' })
		expect(await result.finished).toEqual({ status: 'skipped', reason: 'interrupted' })
	}
	expect(platform.entries('root').map((entry) => entry?.to)).toEqual([undefined, '/settings'])
})

it('does not report an accepted host navigation as cancelled when its subscribers navigate again', async () => {
	const platform = host()
	const router = createRouter({ catalog, host: platform.adapter })
	let started = false
	let followup: ReturnType<typeof router.push> | undefined
	router.subscribe(() => {
		if (!started && router.getSnapshot().route?.to === '/items/:id') {
			started = true
			followup = router.push({ to: '/settings' })
		}
	})
	const first = await router.push({ to: '/items/:id', params: { id: 'accepted' } })
	expect(first.status).toBe('committed')
	expect(await followup).toMatchObject({ status: 'committed', route: { to: '/settings' } })
	expect(platform.entries('root').map((entry) => entry?.to)).toEqual([
		undefined,
		'/items/:id',
		'/settings',
	])
})

it('Back aborts pending work even at a direct-entry base', async () => {
	const waiting = deferred<void>()
	const routes = defineRoutes([
		defineRoute({ path: '/slow', loader: () => waiting.promise }).screen(() => null),
	])
	const router = createRouter({ catalog: routes, host: host().adapter })
	const pending = router.push({ to: '/slow' })
	expect(await router.back()).toEqual({ status: 'at-base' })
	expect(await pending).toEqual({ status: 'cancelled', reason: 'aborted' })
})

it('binds named and modal flows without guessing an active stack', async () => {
	const platform = host()
	const router = createRouter({ catalog, host: platform.adapter, stacks: ['catalog'] })
	const named = bindRouterFlow(router, 'catalog')
	expect(named.href({ to: '/items/:id', params: { id: 'named' } })).toBe('/@catalog/items/named')
	expect(await named.validateDestination({ to: '/settings' })).toMatchObject({
		status: 'valid',
		href: '/@catalog/settings',
	})
	await named.push({ to: '/items/:id', params: { id: 'named' } })
	expect(named.getSnapshot().route?.href).toBe('/@catalog/items/named')
	expect(router.getSnapshot().route).toBeNull()
	platform.flows.set('modal:1', [{ ...platform.entries('catalog').at(-1)!, presentation: 'modal' }])
	const modal = bindRouterFlow(router, 'modal:1')
	expect(modal.href({ to: '/settings' })).toBe('/@catalog/settings')
	await modal.push({ to: '/settings' })
	expect(modal.getSnapshot().route?.stack).toBe('catalog')
	await modal.back()
	expect(modal.getSnapshot().route?.data).toEqual({ title: 'named' })
	await modal.dismiss()
	expect(named.getSnapshot().route?.data).toEqual({ title: 'named' })
})

it.each(['root', 'catalog'] as const)(
	'keeps URL navigation inside a modal declared from %s',
	async (stack) => {
		const platform = host()
		const router = createRouter({ catalog, host: platform.adapter, stacks: ['catalog'] })
		await router.forStack(stack).push({ to: '/items/:id', params: { id: 'presenter' } })
		platform.flows.set('modal:owned', [
			{ ...platform.entries(stack).at(-1)!, presentation: 'modal' },
		])
		const modal = bindRouterFlow(router, 'modal:owned')
		const url = router.forStack(stack).href({ to: '/items/:id', params: { id: 'next' } })
		expect((await modal.navigateUrl(url)).status).toBe('committed')
		expect(platform.entries('modal:owned').at(-1)?.params.id).toBe('next')
		expect(router.forStack(stack).getSnapshot().route?.params.id).toBe('presenter')
		router.dispose()
	},
)

it('commits only the redirected loader destination as one history entry', async () => {
	const routes = defineRoutes([
		defineRoute({
			path: '/old',
			loader: () => {
				throw new DestinationRedirect({ to: '/items/:id', params: { id: 'new' } })
			},
		}).screen(() => null),
		defineRoute({
			path: '/items/:id',
			loader: ({ params }) => ({ title: params.id }),
		}).screen(() => null),
	])
	const platform = host()
	const router = createRouter({ catalog: routes, host: platform.adapter })
	expect(await router.push({ to: '/old' })).toMatchObject({
		status: 'committed',
		redirected: true,
		route: { to: '/items/:id', data: { title: 'new' } },
	})
	expect(platform.entries('root').map((entry) => entry?.to ?? null)).toEqual([null, '/items/:id'])
	expect((await router.back()).status).toBe('committed')
	expect(router.getSnapshot().route).toBeNull()
	router.dispose()
})

it.each(['beforeLoad', 'loader'] as const)(
	'does not let an older cross-flow redirect supersede newer target work (%s)',
	async (phase) => {
		const source = deferred<void>()
		const target = deferred<string>()
		const routes = defineRoutes([
			defineRoute({
				path: '/redirect',
				[phase]: async () => {
					await source.promise
					throw new DestinationRedirect({
						to: '/items/:id',
						params: { id: 'redirect' },
						stack: 'root',
					})
				},
			}).screen(() => null),
			defineRoute({
				path: '/items/:id',
				loader: ({ params }) => (params.id === 'latest' ? target.promise : params.id),
			}).screen(() => null),
		])
		const platform = host()
		const router = createRouter({ catalog: routes, host: platform.adapter, stacks: ['catalog'] })
		const old = bindRouterFlow(router, 'catalog').push({ to: '/redirect' })
		const latest = router.push({ to: '/items/:id', params: { id: 'latest' } })
		source.resolve()
		expect(await old).toEqual({ status: 'cancelled', reason: 'superseded' })
		target.resolve('latest')
		expect(await latest).toMatchObject({ status: 'committed', route: { data: 'latest' } })
	},
)

it.each(['beforeLoad', 'loader'] as const)(
	'keeps target attempt order after a newer navigation has already committed (%s)',
	async (phase) => {
		const source = deferred<void>()
		const routes = defineRoutes([
			defineRoute({
				path: '/redirect',
				[phase]: async () => {
					await source.promise
					throw new DestinationRedirect({ to: '/settings', stack: 'root' })
				},
			}).screen(() => null),
			defineRoute({ path: '/settings' }).screen(() => null),
			defineRoute({ path: '/current' }).screen(() => null),
		])
		const platform = host()
		const router = createRouter({ catalog: routes, host: platform.adapter, stacks: ['catalog'] })
		const old = bindRouterFlow(router, 'catalog').push({ to: '/redirect' })
		await router.push({ to: '/current' })
		source.resolve()
		expect(await old).toEqual({ status: 'cancelled', reason: 'superseded' })
		expect(router.getSnapshot().route?.to).toBe('/current')
	},
)

it('external host traversal invalidates a pending load without loading the retained entry again', async () => {
	const pending = deferred<string>()
	const routes = defineRoutes([
		defineRoute({ path: '/item', loader: () => pending.promise }).screen(() => null),
	])
	const platform = host()
	let external!: Parameters<RouterHost['subscribe']>[0]
	platform.adapter.subscribe = (listener) => {
		external = listener
		return () => {}
	}
	const router = createRouter({ catalog: routes, host: platform.adapter })
	const loading = router.push({ to: '/item' })
	external({ external: true, flow: 'root' })
	expect(await loading).toEqual({ status: 'cancelled', reason: 'aborted' })
	pending.resolve('late')
	await pending.promise
	expect(router.getSnapshot().route).toBeNull()
})

it('retries failed preparation, refreshes current data without pushing, and diagnoses reset subsets', async () => {
	let fail = true
	let loads = 0
	const routes = defineRoutes([
		defineRoute({
			path: '/item',
			loader: () => {
				loads++
				if (fail) {
					throw new Error('Unavailable')
				}
				return loads
			},
		}).screen(() => null),
	])
	const platform = host()
	const router = createRouter({ catalog: routes, host: platform.adapter })
	expect(await router.push({ to: '/item' })).toMatchObject({ status: 'failed', phase: 'loader' })
	fail = false
	expect(await router.retry()).toMatchObject({ status: 'committed', route: { data: 2 } })
	expect(await router.refresh()).toMatchObject({ status: 'committed', route: { data: 3 } })
	expect(platform.entries('root')).toHaveLength(2)
	const limited = createRouter({ catalog: routes, host: { ...host().adapter, canReset: false } })
	expect(await limited.reset({ to: '/item' })).toEqual({
		status: 'unsupported',
		operation: 'reset',
	})
	expect(loads).toBe(3)
})

it('disposes once, settles uncooperative work and removes owned subscriptions', async () => {
	const waiting = deferred<RouterHostResult>()
	const platform = host()
	platform.adapter.commit = () => waiting.promise
	const router = createRouter({ catalog, host: platform.adapter })
	const pending = router.push({ to: '/settings' })
	router.dispose()
	router.dispose()
	expect(await pending).toEqual({ status: 'cancelled', reason: 'disposed' })
	expect(platform.disposed).toBe(true)
	expect(await router.refresh()).toEqual({ status: 'cancelled', reason: 'disposed' })
	expect(await router.dismiss()).toEqual({ status: 'cancelled', reason: 'disposed' })
	expect(router.getSnapshot()).toBe(router.getSnapshot())
	expect(router.getSnapshot().route).toBeNull()
})

it('disposes accepted requests that a newer request has replaced in the pending slot', async () => {
	const platform = host()
	const firstAccepted = deferred<void>()
	const secondAccepted = deferred<void>()
	let accepted = 0
	platform.adapter.commit = (command) => {
		if (!command.beginCommit()) {
			return { status: 'cancelled', reason: 'superseded' }
		}
		if (++accepted === 1) {
			firstAccepted.resolve()
		} else {
			secondAccepted.resolve()
		}
		return new Promise<RouterHostResult>(() => {})
	}
	const router = createRouter({ catalog, host: platform.adapter })
	const first = router.push({ to: '/settings' })
	await firstAccepted.promise
	const second = router.push({ to: '/items/:id', params: { id: 'newer' } })
	await secondAccepted.promise
	router.dispose()
	expect(await first).toEqual({ status: 'cancelled', reason: 'disposed' })
	expect(await second).toEqual({ status: 'cancelled', reason: 'disposed' })
})

it('an older accepted completion cannot erase a newer retry target', async () => {
	const accepted = deferred<void>()
	const release = deferred<void>()
	let failures = 0
	const routes = defineRoutes([
		defineRoute({ path: '/accepted' }).screen(() => null),
		defineRoute({
			path: '/broken',
			loader: () => {
				failures++
				throw new Error('Expected failure')
			},
		}).screen(() => null),
	])
	const platform = host()
	const commit = platform.adapter.commit
	platform.adapter.commit = async (command) => {
		const result = await commit(command)
		accepted.resolve()
		await release.promise
		return result
	}
	const router = createRouter({ catalog: routes, host: platform.adapter })
	const earlier = router.push({ to: '/accepted' })
	await accepted.promise
	expect(await router.push({ to: '/broken' })).toMatchObject({ status: 'failed', phase: 'loader' })
	release.resolve()
	expect(await earlier).toMatchObject({ status: 'committed' })
	expect(await router.retry()).toMatchObject({ status: 'failed', phase: 'loader' })
	expect(failures).toBe(2)
})

it('snapshots definitions for scopes created after a catalog is changed', async () => {
	const routes = defineRoutes([
		defineRoute({ path: '/item', loader: () => 'original' }).screen(() => null),
	])
	const platform = host()
	const router = createRouter({ catalog: routes, host: platform.adapter, stacks: ['catalog'] })
	expect(() => {
		routes.routes[0].preparation!.loader = () => 'mutated'
	}).toThrow(TypeError)
	const scoped = bindRouterFlow(router, 'catalog')
	expect(await scoped.push({ to: '/item' })).toMatchObject({
		status: 'committed',
		route: { data: 'original' },
	})
})

it('reports observer errors without undoing commitment and cleans up after host disposal errors', async () => {
	const platform = host()
	const observerErrors: unknown[] = []
	const router = createRouter({
		catalog,
		host: platform.adapter,
		onSubscriberError: (error) => {
			observerErrors.push(error)
		},
	})
	router.subscribe(() => {
		throw new Error('Observer failed')
	})
	expect(await router.push({ to: '/settings' })).toMatchObject({ status: 'committed' })
	expect(observerErrors.length).toBeGreaterThan(0)
	const dispose = platform.adapter.dispose!
	platform.adapter.dispose = () => {
		dispose()
		throw new Error('Host disposal failed')
	}
	expect(() => router.dispose()).toThrow('Host disposal failed')
	expect(router.getSnapshot().route).toBeNull()
	expect(await router.back()).toEqual({ status: 'cancelled', reason: 'disposed' })
	expect(platform.disposed).toBe(true)
})

it('refreshes data without erasing the retained presentation and Back transition', async () => {
	const platform = host()
	const router = createRouter({ catalog, host: platform.adapter })
	await router.push({
		to: '/items/:id',
		params: { id: 'coat' },
		presentation: 'modal',
		transition: 'fade',
	})
	await router.refresh()
	expect(router.getSnapshot().route).toMatchObject({ presentation: 'modal', transition: 'fade' })
	router.dispose()
})

it('ends a disposed flow before loaders or explicit root escapes can run', async () => {
	const platform = host()
	let ended = false
	let loads = 0
	let changed!: Parameters<RouterHost['subscribe']>[0]
	const originalSnapshot = platform.adapter.getSnapshot
	const originalSubscribe = platform.adapter.subscribe
	platform.adapter.getSnapshot = (flow) =>
		flow === 'modal:owned' && ended
			? { route: null, canGoBack: false, modal: false, disposed: true }
			: originalSnapshot(flow)
	platform.adapter.subscribe = (listener) => {
		changed = listener
		return originalSubscribe(listener)
	}
	const router = createRouter({
		catalog: defineRoutes([
			defineRoute({ path: '/items/:id', loader: () => ++loads }).screen(() => null),
		]),
		host: platform.adapter,
	})
	const modal = bindRouterFlow(router, 'modal:owned')
	await modal.push({ to: '/items/:id', params: { id: 'coat' } })
	ended = true
	changed({ flowDisposed: true, flow: 'modal:owned' })
	for (const result of await Promise.all([
		modal.push({ to: '/items/:id', params: { id: 'hat' } }),
		modal.push({ to: '/items/:id', params: { id: 'hat' }, stack: 'root' }),
		modal.navigateUrl('/items/hat'),
		modal.back({ fallback: { to: '/items/:id', params: { id: 'hat' }, stack: 'root' } }),
		modal.dismiss(),
		modal.refresh(),
		modal.retry(),
		bindRouterFlow(router, 'modal:owned').push({ to: '/items/:id', params: { id: 'hat' } }),
	])) {
		expect(result).toEqual({ status: 'cancelled', reason: 'disposed' })
	}
	expect(loads).toBe(1)
	expect(modal.getSnapshot()).toEqual({
		route: null,
		navigation: { status: 'idle' },
		canGoBack: false,
		modal: false,
	})
	expect(platform.entries('root')).toEqual([null])
	router.dispose()
})

it('keeps an accepted dismissal committed when that operation ends its own flow', async () => {
	const platform = host()
	let changed!: Parameters<RouterHost['subscribe']>[0]
	const originalSubscribe = platform.adapter.subscribe
	platform.adapter.subscribe = (listener) => {
		changed = listener
		return originalSubscribe(listener)
	}
	const originalCommit = platform.adapter.commit
	platform.adapter.commit = (command) => {
		if (command.action !== 'dismiss') {
			return originalCommit(command)
		}
		if (!command.beginCommit()) {
			return { status: 'cancelled', reason: 'superseded' }
		}
		changed({ flowDisposed: true, flow: command.flow })
		return { status: 'committed', route: null }
	}
	const router = createRouter({ catalog, host: platform.adapter })
	const modal = bindRouterFlow(router, 'modal:owned')
	await modal.push({ to: '/settings' })
	expect(await modal.dismiss()).toMatchObject({ status: 'committed', route: null })
	expect(await modal.push({ to: '/settings', stack: 'root' })).toEqual({
		status: 'cancelled',
		reason: 'disposed',
	})
	router.dispose()
})

it('reports runtime matches without pretending they have the compiled route DTO', async () => {
	const platform = host()
	const navigation = createRouter({ catalog, host: platform.adapter })
	const plugin = navigation.addRoutes(
		defineRoutes([defineRoute({ path: '/plugin', loader: () => 17 }).screen(() => null)]),
		{ id: 'plugin' },
	)
	const runtime = await navigation.navigateUrl('/plugin')
	expect(runtime).toMatchObject({
		status: 'committed',
		route: { contract: 'runtime', to: '/plugin', data: 17 },
	})
	expect(navigation.getSnapshot().route?.contract).toBe('runtime')
	plugin.dispose()
	// A retained runtime entry cannot acquire a compiled contract on removal.
	expect(navigation.getSnapshot().route?.contract).toBe('runtime')
	const declared = await navigation.push({ to: '/items/:id', params: { id: 'coat' } })
	expect(declared).toMatchObject({
		status: 'committed',
		route: { contract: 'declared', data: { title: 'coat' } },
	})
	expect(navigation.getSnapshot()).toBe(navigation.getSnapshot())
	navigation.dispose()
})

it('rejects every runtime replacement of a compiled contract before changing the catalog', async () => {
	const platform = host()
	const navigation = createRouter({ catalog, host: platform.adapter })
	const mismatch = defineRoutes([
		defineRoute({ path: '/items/:id', loader: () => 23 }).screen(() => null),
	])
	expect(() => navigation.addRoutes(mismatch, { id: 'mismatch', conflict: 'replace' })).toThrow(
		'declared:/items/:id',
	)
	const dynamic = defineRuntimeRoutes([
		defineRoute({ path: '/items/:id', loader: () => 31 }).screen(() => null),
	])
	expect(() => navigation.addRoutes(dynamic, { id: 'computed', conflict: 'replace' })).toThrow(
		RouteRegistrationError,
	)
	expect(await navigation.push({ to: '/items/:id', params: { id: 'coat' } })).toMatchObject({
		status: 'committed',
		route: { data: { title: 'coat' } },
	})
	navigation.dispose()
})

it('does not let client behavior overrides silently change a declared loader contract', () => {
	const platform = host()
	expect(() =>
		createRouter({
			catalog,
			host: platform.adapter,
			behaviors: { '/items/:id': { loader: () => 41 } },
		}),
	).toThrow('Client behavior belongs in route definitions')
})

it('rejects copied catalogs whose phantom types no longer prove executable contracts', () => {
	const platform = host()
	const replacement = defineRuntimeRoutes([
		defineRoute({ path: '/items/:id', loader: () => 99 }).screen(() => null),
	])
	const copied = { ...catalog, routes: replacement.routes }
	expect(() => createRouter({ catalog: copied, host: platform.adapter })).toThrow(
		'original catalog',
	)
	const navigation = createRouter({ catalog, host: platform.adapter })
	expect(() => navigation.addRoutes(copied, { id: 'copied' })).toThrow('original route catalogs')
	navigation.dispose()
})

it('checks unknown destinations without navigation and keeps an immutable input snapshot', async () => {
	const platform = host()
	const events: string[] = []
	const routes = defineRoutes([
		defineRoute
			.withContext<{ account: string }>()({
				path: '/checked/:id',
				validateSearch: async (raw: { page?: unknown; tag?: unknown }) => {
					events.push('search')
					const page = Number(raw.page ?? 1)
					if (!Number.isSafeInteger(page) || page < 1) {
						throw new Error('Invalid page')
					}
					return { page, tag: Array.isArray(raw.tag) ? raw.tag.map(String) : [] }
				},
				beforeLoad: () => {
					events.push('guard')
					return { checked: true }
				},
				loader: ({ params, search, context }) => {
					events.push('load')
					return {
						id: params.id,
						page: search.page,
						tag: search.tag,
						account: context.account,
						checked: context.checked,
					}
				},
			})
			.screen(() => null),
	])
	const navigation = createRouter({
		catalog: routes,
		host: platform.adapter,
		context: () => {
			events.push('context')
			return { account: 'a' }
		},
	})
	const input = {
		to: '/checked/:id',
		params: { id: 'coat' },
		search: { page: 2, tag: ['one', 'two'] },
	}
	const before = navigation.getSnapshot()
	const checked = await navigation.validateDestination(input)
	expect(checked).toMatchObject({ status: 'valid', href: '/checked/coat?page=2&tag=one&tag=two' })
	expect(events).toEqual(['search'])
	expect(navigation.getSnapshot()).toBe(before)
	expect(before.navigation).toEqual({ status: 'idle' })
	if (checked.status !== 'valid') {
		throw new Error('Expected checked destination')
	}
	input.params.id = 'changed'
	input.search.tag.push('changed')
	expect(Object.isFrozen(checked.destination)).toBe(true)
	expect(navigation.href(checked.destination)).toBe(checked.href)
	expect(await navigation.push(checked.destination)).toMatchObject({
		status: 'committed',
		route: {
			contract: 'declared',
			data: { id: 'coat', page: 2, tag: ['one', 'two'], account: 'a', checked: true },
		},
	})
	expect(events).toEqual(['search', 'context', 'search', 'guard', 'load'])
	navigation.dispose()
})

it('keeps checked values bound to their instance and rejects copied or serialized proofs', async () => {
	const a = createRouter({ catalog, host: host().adapter })
	const bPlatform = host()
	const b = createRouter({ catalog, host: bPlatform.adapter })
	const checked = await a.validateDestination({ to: '/items/:id', params: { id: 'coat' } })
	if (checked.status !== 'valid') {
		throw new Error('Expected checked destination')
	}
	expect(await b.push(checked.destination)).toMatchObject({
		status: 'invalid-input',
		path: 'destination',
	})
	expect(await b.validateDestination(checked.destination)).toMatchObject({
		status: 'invalid-input',
	})
	expect(() => b.href(checked.destination)).toThrow('different router instance')
	expect(b.getSnapshot()).toMatchObject({
		route: null,
		navigation: { status: 'failed', result: { status: 'invalid-input', path: 'destination' } },
		canGoBack: false,
	})
	expect(await a.push({ ...checked.destination })).toMatchObject({ status: 'invalid-input' })
	expect(
		await a.validateDestination(JSON.parse(JSON.stringify(checked.destination))),
	).toMatchObject({ status: 'invalid-input' })
	a.dispose()
	expect(await a.push(checked.destination)).toEqual({ status: 'cancelled', reason: 'disposed' })
	b.dispose()
})

it('revalidates checked runtime values after schema replacement and route removal', async () => {
	const navigation = createRouter({ catalog, host: host().adapter })
	let loads = 0
	const runtime = (allowed: string) =>
		defineRuntimeRoutes([
			defineRoute({
				path: '/runtime/:id',
				validateSearch: (raw: { tab?: unknown }) => {
					if (raw.tab !== allowed) {
						throw new Error('Invalid tab')
					}
					return { tab: allowed }
				},
				loader: () => ++loads,
			}).screen(() => null),
		])
	const old = navigation.addRoutes(runtime('details'), { id: 'runtime' })
	const checked = await navigation.validateDestination({
		to: '/runtime/:id',
		params: { id: 'coat' },
		search: { tab: 'details' },
	})
	if (checked.status !== 'valid') {
		throw new Error('Expected checked destination')
	}
	expect(await navigation.push(checked.destination)).toMatchObject({
		status: 'committed',
		route: { contract: 'runtime', data: 1 },
	})
	const replacement = navigation.addRoutes(runtime('activity'), {
		id: 'runtime',
		conflict: 'replace',
	})
	old.dispose()
	expect(await navigation.push(checked.destination)).toMatchObject({
		status: 'invalid-input',
		path: 'search',
	})
	expect(loads).toBe(1)
	replacement.dispose()
	expect(navigation.href(checked.destination)).toBe('/runtime/coat?tab=details')
	expect(await navigation.push(checked.destination)).toEqual({
		status: 'not-found',
		reason: 'pattern',
	})
	expect(loads).toBe(1)
	navigation.dispose()
})

it('cancels stale validation on registry changes and ignores late schema completion', async () => {
	const navigation = createRouter({ catalog, host: host().adapter })
	const schema = deferred<Record<string, unknown>>()
	navigation.addRoutes(
		defineRuntimeRoutes([
			defineRoute({ path: '/slow', validateSearch: () => schema.promise }).screen(() => null),
		]),
		{ id: 'slow' },
	)
	const checked = navigation.validateDestination({ to: '/slow' })
	navigation.addRoutes(defineRoutes([defineRoute({ path: '/extra' }).screen(() => null)]), {
		id: 'extra',
	})
	expect(await checked).toEqual({ status: 'cancelled', reason: 'registry-changed' })
	schema.resolve({ accepted: true })
	expect(navigation.getSnapshot().route).toBeNull()
	navigation.dispose()
})

it('keeps omitted stacks relative to the consuming named or modal navigator', async () => {
	const platform = host()
	const navigation = createRouter({ catalog, host: platform.adapter, stacks: ['library'] })
	const named = navigation.forStack('library')
	const checked = await named.validateDestination({ to: '/items/:id', params: { id: 'coat' } })
	if (checked.status !== 'valid') {
		throw new Error('Expected checked destination')
	}
	expect(checked.href).toBe('/@library/items/coat')
	expect(await named.push(checked.destination)).toMatchObject({
		status: 'committed',
		route: { stack: 'library' },
	})
	platform.flows.set('modal:checked', [
		{ ...platform.entries('library').at(-1)!, presentation: 'modal' },
	])
	const modal = bindRouterFlow(navigation, 'modal:checked')
	const inside = await modal.validateDestination({ to: '/items/:id', params: { id: 'hat' } })
	if (inside.status !== 'valid') {
		throw new Error('Expected checked destination')
	}
	expect(modal.href(inside.destination)).toBe('/@library/items/hat')
	expect(await modal.push(inside.destination)).toMatchObject({ status: 'committed' })
	expect(platform.entries('modal:checked').at(-1)?.params.id).toBe('hat')
	expect(named.getSnapshot().route?.params.id).toBe('coat')
	expect(navigation.href(inside.destination)).toBe('/items/hat')
	navigation.dispose()
})

it('validates options and hostile object access without running guards or loading', async () => {
	let loads = 0
	const navigation = createRouter({
		catalog: defineRoutes([
			defineRoute({ path: '/item', loader: () => ++loads }).screen(() => null),
		]),
		host: host().adapter,
	})
	for (const value of [
		{ to: '/item', transition: 'invented' },
		{ to: '/item', stack: 'invented' },
		{
			get to(): string {
				throw new Error('Hostile getter')
			},
		},
	]) {
		expect(await navigation.validateDestination(value)).toMatchObject({ status: 'invalid-input' })
	}
	const controller = new AbortController()
	controller.abort()
	expect(
		await navigation.validateDestination({ to: '/item' }, { signal: controller.signal }),
	).toEqual({ status: 'cancelled', reason: 'aborted' })
	expect(loads).toBe(0)
	navigation.dispose()
})

it('checks guards at activation time and never treats validation as authorization', async () => {
	let allowed = true
	let guards = 0
	let loads = 0
	const navigation = createRouter({
		catalog: defineRoutes([
			defineRoute({
				path: '/private',
				beforeLoad: () => {
					guards++
					if (!allowed) {
						throw new RouteForbidden()
					}
				},
				loader: () => ++loads,
			}).screen(() => null),
		]),
		host: host().adapter,
	})
	const checked = await navigation.validateDestination({ to: '/private' })
	if (checked.status !== 'valid') {
		throw new Error('Expected valid destination')
	}
	expect(guards).toBe(0)
	allowed = false
	expect(await navigation.push(checked.destination)).toEqual({ status: 'forbidden' })
	expect(guards).toBe(1)
	expect(loads).toBe(0)
	expect(navigation.getSnapshot().route).toBeNull()
	navigation.dispose()
})

it('uses checked redirect destinations without escaping a named flow or borrowing another instance', async () => {
	let target: import('./props').ValidatedDestination | undefined
	const routes = defineRoutes([
		defineRoute({
			path: '/source',
			beforeLoad: () => {
				if (target) {
					throw new DestinationRedirect(target)
				}
			},
		}).screen(() => null),
		defineRoute({ path: '/target', loader: () => 'ready' }).screen(() => null),
	])
	const navigation = createRouter({ catalog: routes, host: host().adapter, stacks: ['library'] })
	const checked = await navigation.validateDestination({ to: '/target' })
	if (checked.status !== 'valid') {
		throw new Error('Expected valid destination')
	}
	target = checked.destination
	expect(await navigation.forStack('library').push({ to: '/source' })).toMatchObject({
		status: 'committed',
		redirected: true,
		route: { to: '/target', stack: 'library', href: '/@library/target', data: 'ready' },
	})
	expect(navigation.getSnapshot().route).toBeNull()
	const foreign = createRouter({ catalog: routes, host: host().adapter })
	expect(await foreign.push({ to: '/source' })).toMatchObject({
		status: 'invalid-input',
		path: 'destination',
	})
	expect(foreign.getSnapshot().route).toBeNull()
	foreign.dispose()
	navigation.dispose()
})

function searchFixture() {
	let loads = 0
	let allow = true
	const adapter = host()
	const router = createRouter({
		host: adapter.adapter,
		stacks: ['library'],
		catalog: defineRoutes([
			defineRoute({
				path: '/filters/:id',
				validateSearch(raw) {
					const page = Number(raw.page ?? 1)
					if (!Number.isInteger(page) || page < 1) {
						throw new Error('Invalid page')
					}
					return {
						page,
						query: String(raw.query ?? ''),
						tags: Array.isArray(raw.tags)
							? raw.tags
							: typeof raw.tags === 'string'
								? [raw.tags]
								: [],
					}
				},
				beforeLoad() {
					if (!allow) {
						throw new RouteForbidden()
					}
				},
				loader: ({ search }) => {
					loads++
					return search.page
				},
			}).screen(() => null),
		]),
	})
	return {
		router,
		adapter,
		get loads() {
			return loads
		},
		deny() {
			allow = false
		},
		updater(navigator = router.forStack('root')) {
			const entry = navigator.getSnapshot().route!
			expect(readRouterMatch(router, entry)).toBe(entry)
			return createSearchUpdater(router, navigator, entry)
		},
	}
}

it('replaces search input explicitly, reruns preparation and supports opt-in history push', async () => {
	const f = searchFixture()
	await f.router.push({
		to: '/filters/:id',
		params: { id: 'coat' },
		search: { page: 2, query: 'winter', tags: ['warm', 'dry'] },
		hash: 'results',
	})
	const length = f.adapter.entries('root').length
	let previous: any
	expect(
		(
			await f.updater()((value: any) => {
				previous = value
				return { page: value.page + 1 }
			})
		).status,
	).toBe('committed')
	expect(previous).toEqual({ page: 2, query: 'winter', tags: ['warm', 'dry'] })
	expect(f.router.getSnapshot().route).toMatchObject({
		params: { id: 'coat' },
		search: { page: 3, query: '', tags: [] },
		hash: 'results',
		data: 3,
	})
	expect(f.router.getSnapshot().route?.href).toBe('/filters/coat?page=3#results')
	expect(f.adapter.entries('root')).toHaveLength(length)
	expect(f.loads).toBe(2)
	await f.updater()({ query: 'summer' }, { replace: false })
	expect(f.adapter.entries('root')).toHaveLength(length + 1)
	await f.router.back()
	expect(f.router.getSnapshot().route?.search.page).toBe(3)
	f.router.dispose()
})

it('refuses stale search callbacks after another record or route takes ownership', async () => {
	const f = searchFixture()
	await f.router.push({ to: '/filters/:id', params: { id: 'coat' } })
	const oldUpdate = f.updater()
	await f.router.push({ to: '/filters/:id', params: { id: 'hat' } })
	const before = f.router.getSnapshot()
	let called = false
	expect(
		await oldUpdate(() => {
			called = true
			return { page: 9 }
		}),
	).toEqual({ status: 'cancelled', reason: 'superseded' })
	expect(called).toBe(false)
	expect(f.router.getSnapshot()).toBe(before)
	await f.router.back()
	expect((await oldUpdate({ page: 2 })).status).toBe('committed')
	f.router.dispose()
})

it('keeps invalid or denied search edits on the current entry and cancels disposed callbacks', async () => {
	const f = searchFixture()
	await f.router.push({ to: '/filters/:id', params: { id: 'coat' } })
	const update = f.updater()
	const original = f.router.getSnapshot().route
	expect((await update({ page: -1 })).status).toBe('invalid-input')
	expect(
		(
			await update(() => {
				throw new Error('Bad edit')
			})
		).status,
	).toBe('invalid-input')
	expect((await update(async () => ({ page: 2 }))).status).toBe('invalid-input')
	expect(f.router.getSnapshot().route).toBe(original)
	f.deny()
	expect(await update({ page: 2 })).toEqual({ status: 'forbidden' })
	expect(f.loads).toBe(1)
	f.router.dispose()
	expect(await update({ page: 2 })).toEqual({ status: 'cancelled', reason: 'superseded' })
})

it('does not let callback mutation or reentrant navigation edit a stale search read', async () => {
	const f = searchFixture()
	await f.router.push({ to: '/filters/:id', params: { id: 'coat' }, search: { tags: ['warm'] } })
	const original = f.router.getSnapshot().route!
	let other!: ReturnType<typeof f.router.push>
	const result = await f.updater()((previous: any) => {
		previous.page = 8
		previous.tags.push('changed')
		other = f.router.push({ to: '/filters/:id', params: { id: 'hat' } })
		return previous
	})
	expect(result).toEqual({ status: 'cancelled', reason: 'superseded' })
	expect(original.search).toEqual({ page: 1, query: '', tags: ['warm'] })
	await other
	expect(f.router.getSnapshot().route?.params.id).toBe('hat')
	f.router.dispose()
})

it('keeps search editing in its named and modal flows without reopening a modal', async () => {
	const f = searchFixture()
	const library = f.router.forStack('library')
	await library.push({ to: '/filters/:id', params: { id: 'coat' }, presentation: 'modal' })
	const original = f.adapter.entries('library').at(-1)!
	f.adapter.entries('modal:filters').push(original)
	const modal = bindRouterFlow(f.router, 'modal:filters')
	expect((await f.updater(modal)({ page: 2 })).status).toBe('committed')
	expect(modal.getSnapshot().route).toMatchObject({
		stack: 'library',
		presentation: 'push',
		search: { page: 2 },
	})
	expect(library.getSnapshot().route?.search.page).toBe(1)
	expect(f.router.getSnapshot().route).toBeNull()
	f.router.dispose()
})

it('accepts an ordinary search field named then without mistaking it for an async updater', async () => {
	const adapter = host()
	const router = createRouter({
		host: adapter.adapter,
		catalog: defineRoutes([
			defineRoute({
				path: '/timing',
				// oxlint-disable-next-line unicorn/no-thenable -- a URL field, never a callable then
				validateSearch: (raw: { then?: unknown }) => ({ then: String(raw.then ?? 'now') }),
			}).screen(() => null),
		]),
	})
	await router.push({ to: '/timing' })
	const update = createSearchUpdater(router, router, router.getSnapshot().route!)
	// oxlint-disable-next-line unicorn/no-thenable -- ordinary query input
	expect((await update({ then: 'later' })).status).toBe('committed')
	expect(router.getSnapshot().route?.href).toBe('/timing?then=later')
	router.dispose()
})

it('publishes isolated pending and failure state, then retries the captured destination', async () => {
	const ready = deferred<void>()
	let fail = true
	let loads = 0
	const error = new Error('Unavailable')
	const routes = defineRoutes([
		defineRoute({ path: '/base' }).screen(() => null),
		defineRoute({
			path: '/slow/:id',
			validateSearch: (raw: { tag?: unknown }) => {
				const tag = raw.tag === undefined ? [] : Array.isArray(raw.tag) ? raw.tag : [raw.tag]
				if (!tag.every((value) => typeof value === 'string')) {
					throw new Error('Invalid tag')
				}
				return { tag }
			},
			loader: async ({ params, search }) => {
				loads++
				await ready.promise
				if (fail) {
					throw error
				}
				return { id: params.id, tags: search.tag }
			},
		}).screen(() => null),
	])
	const router = createRouter({
		catalog: routes,
		host: host().adapter,
		stacks: ['library', 'other'],
	})
	await router.push({ to: '/base' })
	const original = router.getSnapshot().route
	const library = router.forStack('library')
	const request = library.push({
		to: '/slow/:id',
		params: { id: 'coat' },
		search: { tag: ['one', 'two'] },
	})
	const pending = library.getSnapshot().navigation
	expect(pending).toMatchObject({
		status: 'pending',
		action: 'push',
		destination: { to: '/slow/:id', params: { id: 'coat' }, search: { tag: ['one', 'two'] } },
	})
	expect(router.getSnapshot()).toMatchObject({ route: original, navigation: { status: 'idle' } })
	if (pending.status !== 'pending') {
		throw new Error('Expected pending state')
	}
	expect(Reflect.set(pending.destination!.params!, 'id', 'other')).toBe(false)
	expect(Object.isFrozen(pending.destination!.search!.tag)).toBe(true)
	await router.forStack('other').push({ to: '/base' })
	expect(library.getSnapshot().navigation).toBe(pending)
	ready.resolve()
	expect(await request).toMatchObject({ status: 'failed', phase: 'loader', error })
	const failed = library.getSnapshot()
	expect(library.getSnapshot()).toBe(failed)
	expect(failed.navigation).toMatchObject({
		status: 'failed',
		action: 'push',
		destination: { params: { id: 'coat' } },
		result: { status: 'failed', phase: 'loader', error },
	})
	expect(router.getSnapshot().route).toBe(original)
	fail = false
	expect(await library.retry()).toMatchObject({
		status: 'committed',
		route: { data: { id: 'coat', tags: ['one', 'two'] } },
	})
	expect(library.getSnapshot().navigation).toEqual({ status: 'idle' })
	expect(loads).toBe(2)
	router.dispose()
})

it('reports expected refusals and clears only the owning failure and retry target', async () => {
	let allowed = false
	const routes = defineRoutes([
		defineRoute({
			path: '/private',
			beforeLoad: () => {
				if (!allowed) {
					throw new RouteForbidden()
				}
			},
		}).screen(() => null),
	])
	const router = createRouter({ catalog: routes, host: host().adapter, stacks: ['library'] })
	const library = router.forStack('library')
	expect(await library.push({ to: '/private' })).toEqual({ status: 'forbidden' })
	expect(library.getSnapshot().navigation).toMatchObject({
		status: 'failed',
		result: { status: 'forbidden' },
	})
	expect(await router.navigateUrl('/missing')).toEqual({ status: 'not-found', reason: 'pattern' })
	expect(router.getSnapshot().navigation).toMatchObject({
		status: 'failed',
		destination: null,
		result: { status: 'not-found', reason: 'pattern' },
	})
	router.clearFailure()
	expect(router.getSnapshot().navigation).toEqual({ status: 'idle' })
	expect(await router.retry()).toEqual({ status: 'unmatched' })
	expect(library.getSnapshot().navigation.status).toBe('failed')
	allowed = true
	expect((await library.retry()).status).toBe('committed')
	expect(library.getSnapshot().navigation).toEqual({ status: 'idle' })
	const before = library.getSnapshot()
	library.clearFailure()
	expect(library.getSnapshot()).toBe(before)
	router.dispose()
})

it('keeps an accepted older completion from erasing a newer preflight refusal', async () => {
	const platform = host()
	const accepted = deferred<void>()
	const released = deferred<void>()
	const commit = platform.adapter.commit
	platform.adapter.commit = async (command) => {
		const result = await commit(command)
		accepted.resolve()
		await released.promise
		return result
	}
	platform.adapter.canReset = false
	const router = createRouter({ catalog, host: platform.adapter })
	const earlier = router.push({ to: '/settings' })
	await accepted.promise
	expect(await router.reset({ to: '/settings' })).toEqual({
		status: 'unsupported',
		operation: 'reset',
	})
	expect(router.getSnapshot().navigation).toMatchObject({
		status: 'failed',
		action: 'reset',
		result: { status: 'unsupported', operation: 'reset' },
	})
	released.resolve()
	expect((await earlier).status).toBe('committed')
	expect(router.getSnapshot().navigation).toMatchObject({
		status: 'failed',
		result: { status: 'unsupported' },
	})
	router.clearFailure()
	expect(router.getSnapshot().navigation).toEqual({ status: 'idle' })
	router.dispose()
})

it('clears prior failure feedback without cancelling a new attempt', async () => {
	const gate = deferred<string>()
	const routes = defineRoutes([
		defineRoute({ path: '/slow', loader: () => gate.promise }).screen(() => null),
	])
	const router = createRouter({ catalog: routes, host: host().adapter })
	await router.navigateUrl('/missing')
	expect(router.getSnapshot().navigation.status).toBe('failed')
	const request = router.push({ to: '/slow' })
	const pending = router.getSnapshot().navigation
	router.clearFailure()
	expect(router.getSnapshot().navigation).toBe(pending)
	expect(pending.status).toBe('pending')
	expect(await router.back()).toEqual({ status: 'at-base' })
	expect(await request).toEqual({ status: 'cancelled', reason: 'aborted' })
	expect(router.getSnapshot().navigation).toEqual({ status: 'idle' })
	gate.resolve('late')
	router.dispose()
})

it('returns from login through URL validation and fresh guards without adding login history', async () => {
	let account: { id: string } | null = null
	let loads = 0
	const platform = host()
	const route = defineRoute.withContext<{ account: { id: string } | null }>()
	const navigation = createRouter({
		catalog: defineRoutes([
			route({ path: '/' }).screen(() => null),
			route({
				path: '/login',
				validateSearch(raw: { returnTo?: unknown }) {
					if (typeof raw.returnTo !== 'string') {
						throw new TypeError('Expected return URL')
					}
					return { returnTo: raw.returnTo }
				},
			}).screen(() => null),
			route({
				path: '/private/:id',
				beforeLoad({ params, context }) {
					if (!context.account) {
						throw new DestinationRedirect({
							to: '/login',
							search: { returnTo: '/private/' + encodeURIComponent(params.id) },
						})
					}
					return { account: context.account }
				},
				loader({ params, context }) {
					loads++
					return { id: params.id, account: context.account.id }
				},
			}).screen(() => null),
		]),
		context: () => ({ account }),
		host: platform.adapter,
	})
	try {
		expect(await navigation.navigateUrl('/private/coat', { replace: true })).toMatchObject({
			status: 'committed',
			redirected: true,
		})

		expect(loads).toBe(0)
		const login = navigation.getSnapshot().route
		if (login?.contract !== 'declared' || login.to !== '/login') {
			throw new Error('Expected login')
		}

		account = { id: 'account-a' }
		expect(await navigation.navigateUrl(login.search.returnTo, { replace: true })).toMatchObject({
			status: 'committed',
			route: { to: '/private/:id', data: { id: 'coat', account: 'account-a' } },
		})

		expect(loads).toBe(1)
		expect(platform.entries('root')).toHaveLength(1)
		const committed = navigation.getSnapshot().route
		for (const untrusted of [
			'https://other.test/private/coat',
			'//other.test/private/coat',
			'javascript:alert(1)',
			'/private/%ZZ',
		]) {
			expect((await navigation.navigateUrl(untrusted, { replace: true })).status).toBe(
				'invalid-input',
			)

			expect(navigation.getSnapshot().route).toBe(committed)
		}

		expect(loads).toBe(1)
		account = null
		expect(await navigation.navigateUrl('/private/hat', { replace: true })).toMatchObject({
			status: 'committed',
			redirected: true,
			route: { to: '/login' },
		})

		expect(loads).toBe(1)
	} finally {
		navigation.dispose()
	}
})

it('does not cancel another independent flow for an unsupported history redirect', async () => {
	const platform = host()
	let redirect = false
	const gate = deferred<void>()
	const entered = deferred<void>()
	const router = createRouter({
		catalog: defineRoutes([
			defineRoute({
				path: '/private',
				beforeLoad() {
					if (redirect) {
						throw new DestinationRedirect({ to: '/other-target', stack: 'other' })
					}
				},
			}).screen(() => null),
			defineRoute({ path: '/public' }).screen(() => null),
			defineRoute({ path: '/other-target' }).screen(() => null),
			defineRoute({
				path: '/slow',
				async loader() {
					entered.resolve()
					await gate.promise
				},
			}).screen(() => null),
		]),
		host: platform.adapter,
		stacks: ['other'],
	})
	const commit = platform.adapter.commit
	platform.adapter.commit = async (command) => {
		if (command.action !== 'back') {
			return commit(command)
		}
		const prepared = await command.prepare!('/private')
		return prepared.status === 'ready'
			? { status: 'unsupported', operation: 'history-redirect-stack' }
			: prepared
	}
	try {
		await router.push({ to: '/private' })
		await router.push({ to: '/public' })
		const other = router.forStack('other').push({ to: '/slow' })
		let settled = false
		void other.then(() => {
			settled = true
		})

		await entered.promise
		redirect = true
		expect(await router.back()).toEqual({
			status: 'unsupported',
			operation: 'history-redirect-stack',
		})

		expect(settled).toBe(false)
		gate.resolve()
		expect((await other).status).toBe('committed')
	} finally {
		gate.resolve()
		router.dispose()
	}
})

it('hands a prepared history redirect to another stack without loading it twice', async () => {
	const platform = host()
	let redirect = false
	let loads = 0
	let reads = 0
	const router = createRouter({
		catalog: defineRoutes([
			defineRoute({
				path: '/private',
				beforeLoad() {
					if (redirect) {
						throw new DestinationRedirect({ to: '/login', stack: 'other' })
					}
				},
			}).screen(() => null),
			defineRoute({ path: '/public' }).screen(() => null),
			defineRoute({ path: '/login', loader: () => ({ load: ++loads }) }).screen(() => null),
		]),
		context: () => ({ read: ++reads }),
		host: platform.adapter,
		stacks: ['other'],
	})
	const commit = platform.adapter.commit
	platform.adapter.commit = async (command) => {
		if (command.action !== 'back') {
			return commit(command)
		}
		const prepared = await command.prepare!('/private')
		return prepared.status === 'ready'
			? { status: 'handoff', prepared, action: 'replace' }
			: prepared
	}
	try {
		await router.push({ to: '/private' })
		await router.push({ to: '/public' })
		const sourceLength = platform.entries('root').length
		const beforeReads = reads
		redirect = true
		const result = await router.back()
		expect(result.status === 'committed' && result.redirected).toBe(true)
		expect(router.getSnapshot().route?.to).toBe('/public')
		expect(platform.entries('root')).toHaveLength(sourceLength)
		expect(router.forStack('other').getSnapshot().route).toMatchObject({
			to: '/login',
			data: { load: 1 },
		})

		expect(router.forStack('other').getSnapshot().canGoBack).toBe(false)
		expect(loads).toBe(1)
		expect(reads).toBe(beforeReads + 1)
	} finally {
		router.dispose()
	}
})

it('distinguishes an explicit root redirect from an inherited root-owned modal scope', async () => {
	for (const explicit of [false, true]) {
		const platform = host()
		const router = createRouter({
			catalog: defineRoutes([
				defineRoute({
					path: '/private',
					beforeLoad() {
						throw new DestinationRedirect({ to: '/public', ...(explicit ? { stack: 'root' } : {}) })
					},
				}).screen(() => null),
				defineRoute({ path: '/public' }).screen(() => null),
			]),
			host: platform.adapter,
		})

		try {
			const modal = bindRouterFlow(router, 'modal:test')
			expect((await modal.push({ to: '/private' })).status).toBe('committed')
			expect(router.getSnapshot().route?.to ?? null).toBe(explicit ? '/public' : null)
			expect(modal.getSnapshot().route?.to ?? null).toBe(explicit ? null : '/public')
		} finally {
			router.dispose()
		}
	}
})

it('refuses a handoff value prepared by an earlier attempt', async () => {
	const platform = host()
	platform.entries('root').push(null)
	const router = createRouter({ catalog, host: platform.adapter })
	let saved: import('./props').RouterHostPreparation | undefined
	platform.adapter.commit = async (command) => {
		if (!saved) {
			saved = await command.prepare!('/settings')
			return { status: 'blocked' }
		}
		return saved.status === 'ready'
			? { status: 'handoff', prepared: saved, action: 'replace' }
			: saved
	}
	try {
		expect(await router.back()).toEqual({ status: 'blocked' })
		expect(await router.back()).toEqual({
			status: 'unsupported',
			operation: 'invalid-host-handoff',
		})

		expect(router.getSnapshot().route).toBeNull()
	} finally {
		router.dispose()
	}
})

it('bounds a cycling host handoff and retains the original context snapshot', async () => {
	const platform = host()
	let calls = 0
	let reads = 0
	const router = createRouter({
		catalog,
		host: platform.adapter,
		context: () => ({ read: ++reads }),
	})
	platform.adapter.commit = async (command) => {
		calls++
		const prepared = await command.prepare!('/settings')
		return prepared.status === 'ready'
			? { status: 'handoff', prepared, action: 'replace' }
			: prepared
	}
	try {
		expect(await router.push({ to: '/settings' })).toMatchObject({
			status: 'failed',
			phase: 'commit',
			error: { message: 'Host handoff limit exceeded' },
		})

		expect(calls).toBeGreaterThan(1)
		expect(calls).toBeLessThan(20)
		expect(reads).toBe(1)
		expect(router.getSnapshot().route).toBeNull()
	} finally {
		router.dispose()
	}
})

it('preloads in the selected stack without changing host state, and cancels on registry replacement', async () => {
	const code = deferred<unknown>()
	const routes = sealGeneratedRouteCatalog<{ '/slow': { params: {}; searchInput: {} } }>(
		deriveLazyRouteManifest({ './app/slow.tsx': () => code.promise }, ['web']),
	)
	const platform = host()
	const navigation = createRouter({ catalog: routes, host: platform.adapter, stacks: ['library'] })
	const named = navigation.forStack('library')
	const before = navigation.getSnapshot()
	const waiting = named.preload({ to: '/slow' })
	expect(navigation.getSnapshot()).toBe(before)
	navigation.addRoutes(defineRoutes([defineRoute({ path: '/extra' }).screen(() => null)]), {
		id: 'extra',
	})
	expect(await waiting).toEqual({ status: 'cancelled', reason: 'registry-changed' })
	code.resolve({ default: () => null })
	expect(await named.preload({ to: '/slow' })).toEqual({
		status: 'preloaded',
		href: '/@library/slow',
	})
	expect(navigation.getSnapshot().route).toBeNull()
	navigation.dispose()
	expect(await named.preload({ to: '/slow' })).toEqual({ status: 'cancelled', reason: 'disposed' })
})
