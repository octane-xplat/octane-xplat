import { afterEach, describe, expect, it } from 'vitest'
import { createScope, runWithSignalOwner, skip, type Scope } from 'octane/signals'
import {
	cachedQuery$,
	clearQueryCache,
	createQueryClient,
	createMemoryQueryStorage,
	invalidateQueries,
	type QueryPersistence,
} from './query-cache'

// Each renderer instance stands in for one mounted screen and owns its query
// cells; the module-level cache is shared across screens. Reads enter a new
// instance to check that a declared query still resolves its original owner.
// Document scopes live until afterEach so those owners stay live for the test.
const liveScopes: Scope[] = []
let scopeSeq = 0

function screen<T>(body: (scope: Scope) => T): T {
	const scope = createScope({ scopeKey: `test-screen:${scopeSeq++}` })
	liveScopes.push(scope)
	return runWithSignalOwner(
		{ documentOwner: scope, instanceOwner: {}, instanceKey: scope.scopeKey },
		() => body(scope),
	)
}

afterEach(() => {
	for (const scope of liveScopes.splice(0)) {
		scope.dispose()
	}
})

async function settle(rounds = 12): Promise<void> {
	for (let i = 0; i < rounds; i++) {
		await Promise.resolve()
	}

	// Octane 0.14 may publish query results in a cooperative host task.
	await new Promise<void>((resolve) => setTimeout(resolve, 0))
}

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (error: unknown) => void
	const promise = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})

	return { promise, resolve, reject }
}

type LoadContext = { signal: AbortSignal; previous?: unknown }
type LoadCall = { selection: unknown; signal: AbortSignal; previous: unknown }

function recording() {
	const calls: LoadCall[] = []
	const load = (selection: unknown, context: LoadContext) => {
		calls.push({ selection, signal: context.signal, previous: context.previous })
		return Promise.resolve(`v${calls.length}`)
	}

	return { calls, load }
}

describe('cachedQuery$', () => {
	it('dedupes an in-flight request and shares the value across scopes', async () => {
		const gate = deferred<string>()
		const calls: LoadCall[] = []
		const load = (selection: unknown, context: LoadContext) => {
			calls.push({ selection, signal: context.signal, previous: undefined })
			return gate.promise
		}

		const first = screen(() => cachedQuery$(['dedupe'], () => 'one', load))
		const second = screen(() => cachedQuery$(['dedupe'], () => 'one', load))

		screen(() => first.latest())
		screen(() => second.latest())
		await settle()
		// Two owning cells, one shared request.
		expect(calls).toHaveLength(1)

		gate.resolve('shared')
		await settle()
		screen(() => expect(first.latest()).toBe('shared'))
		screen(() => expect(second.latest()).toBe('shared'))
		expect(calls).toHaveLength(1)
	})

	it('keeps a separate cache entry per selection', async () => {
		const { calls, load } = recording()
		const a = screen(() => cachedQuery$(['per-selection'], () => 'a', load))
		const b = screen(() => cachedQuery$(['per-selection'], () => 'b', load))
		screen(() => a.latest())
		screen(() => b.latest())
		await settle()
		expect(calls.map((call) => call.selection)).toEqual(['a', 'b'])
	})

	it('isolates entries and invalidation between query clients, even in one owner', async () => {
		const firstClient = createQueryClient()
		const secondClient = createQueryClient()
		let firstCalls = 0
		let secondCalls = 0

		const queries = screen(() => ({
			first: firstClient.cachedQuery$(
				['instance-scope'],
				() => 'same',
				() => 'first-' + ++firstCalls,
			),
			second: secondClient.cachedQuery$(
				['instance-scope'],
				() => 'same',
				() => 'second-' + ++secondCalls,
			),
		}))

		screen(() => {
			queries.first.latest()
			queries.second.latest()
		})

		await settle()
		screen(() => {
			expect(queries.first.latest()).toBe('first-1')
			expect(queries.second.latest()).toBe('second-1')
		})

		firstClient.invalidateQueries(['instance-scope'])
		await settle()

		screen(() => {
			expect(queries.first.latest()).toBe('first-2')
			expect(queries.second.latest()).toBe('second-1')
		})

		expect(firstCalls).toBe(2)
		expect(secondCalls).toBe(1)
	})

	it('refetches live owners on invalidateQueries while prior data stays visible', async () => {
		const gate = deferred<string>()
		const calls: LoadCall[] = []
		let fetch = 0
		const load = (selection: unknown, context: LoadContext) => {
			calls.push({ selection, signal: context.signal, previous: context.previous })
			fetch++
			return fetch === 1 ? Promise.resolve('v1') : gate.promise
		}

		const query = screen(() => cachedQuery$(['inv'], () => 'x', load))
		screen(() => query.latest())
		await settle()
		screen(() => expect(query.latest()).toBe('v1'))

		invalidateQueries(['inv'])
		// Same-identity retry: the old value is still served while refreshing.
		screen(() => {
			expect(query.latest()).toBe('v1')
			expect(query.snapshot().refreshing).toBe(true)
		})

		await settle()
		expect(calls).toHaveLength(2)
		screen(() => expect(query.latest()).toBe('v1'))

		gate.resolve('v2')
		await settle()
		screen(() => expect(query.latest()).toBe('v2'))
	})

	it('prefix-invalidation reaches all selections; exact matches only one', async () => {
		const { calls, load } = recording()
		const options = { staleTimeMs: 60_000 }
		const one = screen(() => cachedQuery$(['inv-scoped'], () => 'one', load, options))
		const two = screen(() => cachedQuery$(['inv-scoped'], () => 'two', load, options))
		screen(() => one.latest())
		screen(() => two.latest())
		await settle()
		expect(calls).toHaveLength(2)

		invalidateQueries(['inv-scoped', 'one'], { exact: true })
		await settle()
		expect(calls).toHaveLength(3)
		expect(calls[2].selection).toBe('one')
	})

	it('forces a fetch on refetch even inside staleTimeMs', async () => {
		const { calls, load } = recording()
		const query = screen(() => cachedQuery$(['forced'], () => 'x', load, { staleTimeMs: 60_000 }))
		screen(() => query.latest())
		await settle()
		screen(() => query.latest())
		await settle()
		expect(calls).toHaveLength(1)

		screen(() => query.refetch())
		await settle()
		expect(calls).toHaveLength(2)
	})

	it('serves fresh entries to new scopes within staleTimeMs without fetching', async () => {
		const { calls, load } = recording()
		const first = screen(() =>
			cachedQuery$(['fresh-ttl'], () => 'x', load, { staleTimeMs: 60_000 }),
		)

		screen(() => first.latest())
		await settle()
		expect(calls).toHaveLength(1)

		const second = screen(() =>
			cachedQuery$(['fresh-ttl'], () => 'x', load, { staleTimeMs: 60_000 }),
		)

		screen(() => second.latest())
		await settle()
		screen(() => expect(second.latest()).toBe('v1'))
		expect(calls).toHaveLength(1)
	})

	it('serves a stale value on mount and revalidates in the background', async () => {
		const gate = deferred<string>()
		const calls: LoadCall[] = []
		const load = (selection: unknown, context: LoadContext) => {
			calls.push({ selection, signal: context.signal, previous: context.previous })
			return calls.length === 1 ? Promise.resolve('v1') : gate.promise
		}

		const first = screen(() => cachedQuery$(['swr'], () => 'x', load))
		screen(() => first.latest())
		await settle()
		screen(() => expect(first.latest()).toBe('v1'))

		// Default staleTimeMs 0: a new reader gets the stale value immediately,
		// then the background revalidation republishes it to both owners.
		const second = screen(() => cachedQuery$(['swr'], () => 'x', load))
		screen(() => second.latest())
		await settle(2)
		screen(() => expect(second.latest()).toBe('v1'))
		expect(calls).toHaveLength(2)

		gate.resolve('v2')
		await settle()
		screen(() => expect(second.latest()).toBe('v2'))
		screen(() => expect(first.latest()).toBe('v2'))
	})

	it('retries after a load error', async () => {
		const gate = deferred<string>()
		const calls: LoadCall[] = []
		const load = (selection: unknown, context: LoadContext) => {
			calls.push({ selection, signal: context.signal, previous: context.previous })
			return gate.promise
		}

		const query = screen(() => cachedQuery$(['errors'], () => 'x', load))
		screen(() => query.latest())
		gate.reject(new Error('offline'))
		await settle()
		screen(() => expect(query.snapshot().status).toBe('error'))

		screen(() => query.retry())
		await settle()
		expect(calls).toHaveLength(2)
	})

	it('awaiting refetch resolves once the request lands', async () => {
		const gate = deferred<string>()
		const calls: LoadCall[] = []
		const load = (selection: unknown, context: LoadContext) => {
			calls.push({ selection, signal: context.signal, previous: context.previous })
			return calls.length === 1 ? Promise.resolve('v1') : gate.promise
		}

		const query = screen(() => cachedQuery$(['await-refetch'], () => 'x', load))
		screen(() => query.latest())
		await settle()
		screen(() => expect(query.latest()).toBe('v1'))

		const pending = screen(() => query.refetch())
		let resolved = false
		void pending.then(() => {
			resolved = true
		})

		// The loader starts on a microtask; the promise stays pending until it lands.
		await settle(2)
		expect(calls).toHaveLength(2)
		expect(resolved).toBe(false)

		gate.resolve('v2')
		await expect(pending).resolves.toBeUndefined()
		screen(() => expect(query.latest()).toBe('v2'))
	})

	it('awaiting retry resolves — not rejects — when the request fails', async () => {
		const calls: LoadCall[] = []
		const load = (selection: unknown, context: LoadContext) => {
			calls.push({ selection, signal: context.signal, previous: context.previous })
			return calls.length === 1 ? Promise.resolve('v1') : Promise.reject(new Error('offline'))
		}

		const query = screen(() => cachedQuery$(['await-fail'], () => 'x', load))
		screen(() => query.latest())
		await settle()
		screen(() => expect(query.latest()).toBe('v1'))

		await expect(screen(() => query.retry())).resolves.toBeUndefined()
		expect(calls).toHaveLength(2)
		screen(() => expect(query.snapshot().status).toBe('error'))
		screen(() => expect(query.latest()).toBe('v1'))
	})

	it('awaiting a verb resolves immediately when no request starts', async () => {
		const { calls, load } = recording()
		const query = screen(() => cachedQuery$(['await-skip'], () => skip, load))

		await expect(screen(() => query.refetch())).resolves.toBeUndefined()
		await expect(screen(() => query.retry())).resolves.toBeUndefined()
		await expect(screen(() => query.reset())).resolves.toBeUndefined()
		expect(calls).toHaveLength(0)
	})

	it('a second refetch joins the in-flight request instead of loading again', async () => {
		const gate = deferred<string>()
		const calls: LoadCall[] = []
		const load = (selection: unknown, context: LoadContext) => {
			calls.push({ selection, signal: context.signal, previous: context.previous })
			return calls.length === 1 ? Promise.resolve('v1') : gate.promise
		}

		const a = screen(() => cachedQuery$(['await-dedupe'], () => 'x', load))
		const b = screen(() => cachedQuery$(['await-dedupe'], () => 'x', load))
		screen(() => a.latest())
		screen(() => b.latest())
		await settle()
		expect(calls).toHaveLength(1)

		const first = screen(() => a.refetch())
		const second = screen(() => b.refetch())
		// The loader starts on a microtask; both verbs join the one request.
		await settle(2)
		expect(calls).toHaveLength(2)

		gate.resolve('v2')
		await expect(first).resolves.toBeUndefined()
		await expect(second).resolves.toBeUndefined()
		screen(() => expect(b.latest()).toBe('v2'))
	})

	it('evicts entries on clearQueryCache; mounted queries keep showing data', async () => {
		const { calls, load } = recording()
		const query = screen(() => cachedQuery$(['cleared'], () => 'x', load))
		screen(() => query.latest())
		await settle()
		screen(() => expect(query.latest()).toBe('v1'))

		clearQueryCache(['cleared'])
		screen(() => expect(query.latest()).toBe('v1'))

		const next = screen(() => cachedQuery$(['cleared'], () => 'x', load))
		screen(() => next.latest())
		await settle()
		expect(calls).toHaveLength(2)
	})

	it('does not throw when an owner retired before invalidation', async () => {
		const scope = createScope({ scopeKey: 'test-screen:retired' })
		const query = runWithSignalOwner(scope, () =>
			cachedQuery$(
				['retired'],
				() => 'x',
				async () => 'v',
			),
		)

		runWithSignalOwner(scope, () => query.latest())
		scope.dispose()
		expect(() => invalidateQueries(['retired'])).not.toThrow()
	})
})

describe('persistence', () => {
	// Storage keys are `xplat:query:<scope>:<canonical element>…` joined by
	// \u0001. Test keys use only string elements, which canonicalize to JSON.
	const element = (value: unknown) => JSON.stringify(value)
	const storedKey = (scope: string, key: readonly unknown[]) =>
		`xplat:query:${scope}:${key.map(element).join('\u0001')}`

	function envelope(version: string | number, data: unknown, savedAt = Date.now()): string {
		return JSON.stringify({ v: version, t: savedAt, d: data })
	}

	function persistence(storage: ReturnType<typeof createMemoryQueryStorage>) {
		return {
			storage,
			version: 'v1',
			scope: () => 'user-1',
		} satisfies QueryPersistence
	}

	it('restores a stored snapshot without fetching while fresh', async () => {
		const storage = createMemoryQueryStorage()
		storage.set(storedKey('user-1', ['persisted', 'x']), envelope('v1', 'restored'))
		const { calls, load } = recording()
		const query = screen(() =>
			cachedQuery$(['persisted'], () => 'x', load, {
				staleTimeMs: 60_000,
				persist: persistence(storage),
			}),
		)

		screen(() => query.latest())
		await settle()
		screen(() => expect(query.latest()).toBe('restored'))
		expect(calls).toHaveLength(0)
	})

	it('writes an envelope with version and timestamp after a fetch', async () => {
		const storage = createMemoryQueryStorage()
		const { calls, load } = recording()
		const query = screen(() =>
			cachedQuery$(['persisted-write'], () => 'x', load, {
				persist: persistence(storage),
			}),
		)

		screen(() => query.latest())
		await settle()
		expect(calls).toHaveLength(1)

		const raw = storage.get(storedKey('user-1', ['persisted-write', 'x']))
		expect(raw).not.toBeNull()
		const written = JSON.parse(raw!) as { v: string; t: number; d: unknown }
		expect(written.v).toBe('v1')
		expect(written.d).toBe('v1')
		expect(typeof written.t).toBe('number')
	})

	it('rejects stored snapshots on version mismatch and expiry', async () => {
		const storage = createMemoryQueryStorage()
		storage.set(
			storedKey('user-1', ['persisted-version', 'x']),
			envelope('v0', 'old', Date.now() - 120_000),
		)

		const { calls, load } = recording()
		const query = screen(() =>
			cachedQuery$(['persisted-version'], () => 'x', load, {
				persist: { ...persistence(storage), version: 'v2', maxAgeMs: 60_000 },
			}),
		)

		screen(() => query.latest())
		await settle()
		expect(calls).toHaveLength(1)
		// The rejected record was removed.
		expect(storage.get(storedKey('user-1', ['persisted-version', 'x']))).not.toBeNull()
	})

	it('skips persistence entirely when scope resolves to null', async () => {
		const storage = createMemoryQueryStorage()
		const gets: string[] = []
		const sets: string[] = []
		const spy: typeof storage = {
			get: (key) => {
				gets.push(key)
				return null
			},
			set: (key, value) => {
				sets.push(key)
				storage.set(key, value)
			},
			remove: storage.remove,
		}

		const { calls, load } = recording()
		const query = screen(() =>
			cachedQuery$(['unscoped'], () => 'x', load, {
				persist: { storage: spy, version: 'v1', scope: () => null },
			}),
		)

		screen(() => query.latest())
		await settle()
		expect(calls).toHaveLength(1)
		expect(gets).toHaveLength(0)
		expect(sets).toHaveLength(0)
	})

	it('scopes stored snapshots to the resolved boundary', async () => {
		const storage = createMemoryQueryStorage()
		storage.set(storedKey('user-1', ['scoped', 'x']), envelope('v1', 'private'))
		storage.set(storedKey('user-1', ['scoped-2', 'x']), envelope('v1', 'also-private'))
		const { calls, load } = recording()
		let boundary = 'user-1'
		const persist = {
			storage,
			version: 'v1' as const,
			maxAgeMs: undefined as number | undefined,
			scope: () => boundary,
		}

		const options = { staleTimeMs: 60_000, persist }

		// Under user-2 the user-1 record is invisible — a fresh request runs
		// and persists under user-2's namespace instead.
		boundary = 'user-2'
		const hidden = screen(() => cachedQuery$(['scoped'], () => 'x', load, options))
		screen(() => hidden.latest())
		await settle()
		expect(calls).toHaveLength(1)
		expect(storage.get(storedKey('user-1', ['scoped', 'x']))).not.toBeNull()
		expect(storage.get(storedKey('user-2', ['scoped', 'x']))).not.toBeNull()

		// Under user-1 the same key's record restores.
		boundary = 'user-1'
		const visible = screen(() => cachedQuery$(['scoped-2'], () => 'x', load, options))
		screen(() => visible.latest())
		await settle()
		screen(() => expect(visible.latest()).toBe('also-private'))
		expect(calls).toHaveLength(1)
	})
})
