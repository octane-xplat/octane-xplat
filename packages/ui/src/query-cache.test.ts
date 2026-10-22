import { defineCursorQuery } from './cursor-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
	createQueryClient,
	createMemoryQueryStorage,
	defineQuery,
	type QueryClient,
	type QueryEnvironment,
	type QueryEnvironmentSnapshot,
	type QueryStorageAdapter,
} from './query-cache'

const clients: QueryClient[] = []
function client(namespace?: string, environment?: QueryEnvironment) {
	const value = createQueryClient({ namespace, environment })
	clients.push(value)
	return value
}

afterEach(async () => {
	await Promise.all(clients.splice(0).map((value) => value.dispose()))
	vi.useRealTimers()
})

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (error: unknown) => void
	const promise = new Promise<T>((yes, no) => {
		resolve = yes
		reject = no
	})
	return { promise, resolve, reject }
}

async function settle() {
	for (let i = 0; i < 20; i++) {
		await Promise.resolve()
	}
	await new Promise<void>((resolve) => setTimeout(resolve, 0))
}

describe('query definition and client lifetimes', () => {
	it('deduplicates readers without conflating their selections', async () => {
		const calls: string[] = []
		const gate = deferred<string>()
		const users = defineQuery(['users'], (id: string) => {
			calls.push(id)
			return id === 'a' ? gate.promise : 'B'
		})
		const queries = client()
		const a = queries.observe$(users, 'a')
		const again = queries.observe$(users, 'a')
		const b = queries.observe$(users, 'b')
		await settle()
		expect(calls).toEqual(['a', 'b'])
		gate.resolve('A')
		await settle()
		expect([a.data$.get(), again.data$.get(), b.data$.get()]).toEqual(['A', 'A', 'B'])
	})
	it('isolates equal keys between clients', async () => {
		let count = 0
		const users = defineQuery(['users'], (_id: string) => ++count, { staleTimeMs: Infinity })
		const a = client().observe$(users, 'a')
		const b = client().observe$(users, 'a')
		await settle()
		expect([a.data$.get(), b.data$.get()]).toEqual([1, 2])
	})
	it('canonicalizes selections and rejects incompatible family definitions', async () => {
		let count = 0
		const users = defineQuery(['users'], (_selection: { a: number; b: number }) => ++count)
		const queries = client()
		const a = queries.observe$(users, { a: 1, b: 2 })
		const b = queries.observe$(users, { b: 2, a: 1 })
		await settle()
		expect([a.data$.get(), b.data$.get()]).toEqual([1, 1])
		expect(() =>
			queries.observe$(
				defineQuery(['users'], (_id: string) => 2),
				'a',
			),
		).toThrow('different query definition')
		expect(() => queries.observe$(users, { a: NaN, b: 2 })).toThrow('JSON')
	})
	it('copies and freezes key and policy inputs', () => {
		const key = ['users']
		const policy = { staleTimeMs: 100 }
		const users = defineQuery(key, (_id: string) => 'data', policy)
		key[0] = 'changed'
		policy.staleTimeMs = 0
		expect(users.key).toEqual(['users'])
		expect(users.options.staleTimeMs).toBe(100)
		expect(Object.isFrozen(users.key)).toBe(true)
	})
	it('retains usable data during refresh and exposes refresh failure', async () => {
		let count = 0
		const gate = deferred<string>()
		const users = defineQuery(
			['users'],
			(_id: string) => (++count === 1 ? 'first' : gate.promise),
			{ retryCount: 0 },
		)
		const reader = client().observe$(users, 'a')
		await settle()
		const refresh = reader.refetch()
		await settle()
		expect(reader.data$.get()).toBe('first')
		expect(reader.state$.get().fetchStatus).toBe('fetching')
		gate.reject(new Error('offline'))
		await expect(refresh).rejects.toThrow('offline')
		await settle()
		expect(reader.data$.get()).toBe('first')
		expect(reader.state$.get()).toMatchObject({
			status: 'error',
			fetchStatus: 'idle',
			hasData: true,
		})
	})
	it('coalesces refresh and satisfies invalidation after an older request', async () => {
		const calls: Array<ReturnType<typeof deferred<string>>> = []
		const users = defineQuery(['users'], (_id: string) => {
			const gate = deferred<string>()
			calls.push(gate)
			return gate.promise
		})
		const queries = client()
		const reader = queries.observe$(users, 'a')
		await settle()
		const a = reader.refetch()
		const b = reader.refetch()
		expect(a).toBe(b)
		queries.invalidateQueries({ key: ['users', 'a'], exact: true })
		calls[0]!.resolve('old')
		await settle()
		expect(calls).toHaveLength(2)
		calls[1]!.resolve('new')
		await expect(a).resolves.toBe('new')
		await settle()
		expect(reader.data$.get()).toBe('new')
	})
	it('disposal rejects work even when transport ignores abort and retires old reads', async () => {
		const gate = deferred<string>()
		let signal!: AbortSignal
		const users = defineQuery(['users'], (_id: string, context) => {
			signal = context.signal
			return gate.promise
		})
		const queries = client()
		const reader = queries.observe$(users, 'a')
		const request = reader.refetch()
		await settle()
		await queries.dispose()
		expect(signal.aborted).toBe(true)
		await expect(request).rejects.toMatchObject({ name: 'AbortError' })
		gate.resolve('old account')
		await settle()
		expect(() => reader.data$.get()).toThrow()
		expect(() => queries.observe$(users, 'a')).toThrow('disposed')
	})
	it('evicts only the matched entry and retires its readers', async () => {
		const users = defineQuery(['users'], (id: string) => id)
		const queries = client()
		const a = queries.observe$(users, 'a')
		const b = queries.observe$(users, 'b')
		await settle()
		await queries.evictQueries({ key: ['users', 'a'], exact: true })
		expect(() => a.data$.get()).toThrow()
		expect(b.data$.get()).toBe('b')
	})
})

describe('immutable persistence boundaries', () => {
	it('requires a client namespace and restores compatible confirmed data', async () => {
		const storage = createMemoryQueryStorage()
		let loads = 0
		const users = defineQuery(['users'], (_id: string) => ++loads, {
			staleTimeMs: Infinity,
			persist: { storage, version: 1 },
		})
		expect(() => client().observe$(users, 'a')).toThrow('namespace')
		const first = client('one')
		const reader = first.observe$(users, 'a')
		await settle()
		expect(reader.data$.get()).toBe(1)
		await first.dispose()
		const restored = client('one').observe$(users, 'a')
		const isolated = client('two').observe$(users, 'a')
		await settle()
		expect(restored.data$.get()).toBe(1)
		expect(isolated.data$.get()).toBe(2)
		expect(loads).toBe(2)
	})
	it('ignores expired, malformed, and incompatible durable records', async () => {
		for (const record of [
			'not-json',
			JSON.stringify({ v: 2, t: Date.now(), d: 'wrong version' }),
			JSON.stringify({ v: 1, t: Date.now() - 10000, d: 'expired' }),
		]) {
			const storage = createMemoryQueryStorage()
			let storageKey = ''
			const adapter: QueryStorageAdapter = {
				get(key) {
					storageKey = key
					return record
				},
				set: (key, value) => storage.set(key, value),
				remove: (key) => storage.remove(key),
			}

			const users = defineQuery(['users'], (_id: string) => 'network', {
				persist: { storage: adapter, version: 1, maxAgeMs: 1000 },
			})

			const reader = client('account').observe$(users, 'a')
			await settle()
			expect(reader.data$.get()).toBe('network')
			expect(storageKey).toContain('xplat:query:')
		}
	})
	it('keeps memory usable when storage fails and reports a failed explicit purge', async () => {
		const storage: QueryStorageAdapter = {
			get() {
				throw new Error('storage read')
			},
			set() {
				throw new Error('storage write')
			},
			remove() {
				throw new Error('storage purge')
			},
		}
		const users = defineQuery(['users'], (_id: string) => 'network', {
			persist: { storage, version: 1 },
		})
		const queries = client('account')
		const reader = queries.observe$(users, 'a')
		await settle()
		expect(reader.data$.get()).toBe('network')
		await expect(queries.dispose({ purgePersisted: true })).rejects.toThrow('storage')
		expect(() => reader.data$.get()).toThrow()
	})
	it('does not restore an old account after disposal', async () => {
		const gate = deferred<string | null>()
		const storage: QueryStorageAdapter = { get: () => gate.promise, set() {}, remove() {} }
		const users = defineQuery(['users'], (_id: string) => 'network', {
			persist: { storage, version: 1 },
		})
		const queries = client('old')
		const reader = queries.observe$(users, 'a')
		await settle()
		await queries.dispose()
		gate.resolve(JSON.stringify({ v: 1, t: Date.now(), d: 'private' }))
		await settle()
		expect(() => reader.data$.get()).toThrow()
	})
	it('awaits pending saves before durable sign-out purge', async () => {
		const saved = deferred<void>()
		const records = new Map<string, string>()
		const operations: string[] = []
		const storage: QueryStorageAdapter = {
			get: (key) => records.get(key),
			async set(key, value) {
				if (!key.startsWith('xplat:query:index:')) {
					operations.push('set')
					await saved.promise
				}
				records.set(key, value)
			},
			remove(key) {
				operations.push('remove')
				records.delete(key)
			},
		}
		const users = defineQuery(['users'], (_id: string) => 'private', {
			persist: { storage, version: 1 },
		})
		const queries = client('old')
		queries.observe$(users, 'a')
		await settle()
		const purged = queries.dispose({ purgePersisted: true })
		expect(operations).toEqual(['set'])
		saved.resolve()
		await purged
		expect(operations).toEqual(['set', 'remove', 'remove'])
		expect(records.size).toBe(0)
	})
})

describe('inactive query collection', () => {
	it('collects a thousand inactive entries while keeping observed data', async () => {
		vi.useFakeTimers()
		let loads = 0
		const users = defineQuery(
			['users'],
			(id: number) => {
				loads++
				return id
			},
			{ gcTimeMs: 100, staleTimeMs: Infinity },
		)
		const queries = client()
		const readers = Array.from({ length: 1000 }, (_, id) => queries.observe$(users, id))
		const live = queries.observe$(users, 1001)
		await vi.advanceTimersByTimeAsync(0)
		for (const reader of readers) {
			reader.dispose()
		}
		await vi.advanceTimersByTimeAsync(100)
		for (const reader of readers) {
			expect(() => reader.data$.get()).toThrow()
		}
		expect(live.data$.get()).toBe(1001)
		const remounted = queries.observe$(users, 0)
		await vi.advanceTimersByTimeAsync(0)
		expect(remounted.data$.get()).toBe(0)
		expect(loads).toBe(1002)
	})
	it('reuses data before expiry and restarts retention after the last lease', async () => {
		vi.useFakeTimers()
		let loads = 0
		const users = defineQuery(['users'], (_id: string) => ++loads, {
			gcTimeMs: 100,
			staleTimeMs: Infinity,
		})
		const queries = client()
		const first = queries.observe$(users, 'a')
		await vi.advanceTimersByTimeAsync(0)
		first.dispose()
		await vi.advanceTimersByTimeAsync(90)
		const again = queries.observe$(users, 'a')
		await vi.advanceTimersByTimeAsync(20)
		expect(again.data$.get()).toBe(1)
		expect(loads).toBe(1)
		again.dispose()
		await vi.advanceTimersByTimeAsync(99)
		expect(first.data$.get()).toBe(1)
		await vi.advanceTimersByTimeAsync(1)
		expect(() => first.data$.get()).toThrow()
	})
	it('cancels only after the final reader and fences a transport ignoring abort', async () => {
		const calls: Array<{ signal: AbortSignal; gate: ReturnType<typeof deferred<string>> }> = []
		const users = defineQuery(['users'], (_id: string, { signal }) => {
			const gate = deferred<string>()
			calls.push({ signal, gate })
			return gate.promise
		})
		const queries = client()
		const first = queries.observe$(users, 'a')
		const other = queries.observe$(users, 'a')
		const pending = first.refetch()
		await settle()
		first.dispose()
		expect(calls[0]!.signal.aborted).toBe(false)
		other.dispose()
		expect(calls[0]!.signal.aborted).toBe(true)
		await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
		const next = queries.observe$(users, 'a')
		await settle()
		calls[0]!.gate.resolve('obsolete')
		calls[1]!.gate.resolve('current')
		await settle()
		expect(next.data$.get()).toBe('current')
	})
	it('refuses to purge a foreign namespace listed in a corrupted index', async () => {
		const removed: string[] = []
		const storage: QueryStorageAdapter = {
			get: (key) =>
				key.startsWith('xplat:query:index:')
					? JSON.stringify(['xplat:query:["other-account",[]]'])
					: null,
			set() {},
			remove(key) {
				removed.push(key)
			},
		}
		const users = defineQuery(['users'], (_id: string) => 'data', {
			persist: { storage, version: 1 },
		})
		const queries = client('account')
		queries.observe$(users, 'a')
		await settle()
		await expect(queries.dispose({ purgePersisted: true })).rejects.toThrow(
			'Invalid query persistence index',
		)
		expect(removed).toEqual([])
	})
	it('restores after collection and purges records from earlier client lifetimes', async () => {
		vi.useFakeTimers()
		const records = new Map<string, string>()
		const storage: QueryStorageAdapter = {
			get: (key) => records.get(key),
			set: (key, value) => {
				records.set(key, value)
			},
			remove: (key) => {
				records.delete(key)
			},
		}
		let loads = 0
		const users = defineQuery(
			['users'],
			(id: string) => {
				loads++
				return id
			},
			{ staleTimeMs: Infinity, gcTimeMs: 10, persist: { storage, version: 1 } },
		)
		const old = client('account')
		const a = old.observe$(users, 'a')
		const b = old.observe$(users, 'b')
		await vi.advanceTimersByTimeAsync(0)
		a.dispose()
		b.dispose()
		await vi.advanceTimersByTimeAsync(10)
		expect(records.size).toBe(3)
		await old.dispose()
		const current = client('account')
		const restored = current.observe$(users, 'a')
		await vi.advanceTimersByTimeAsync(0)
		expect(restored.data$.get()).toBe('a')
		expect(loads).toBe(2)
		await current.dispose({ purgePersisted: true })
		expect(records.size).toBe(0)
	})
})

function environment(initial: QueryEnvironmentSnapshot) {
	let snapshot = initial
	const listeners = new Set<(state: QueryEnvironmentSnapshot) => void>()
	return {
		getSnapshot: () => snapshot,
		subscribe(listener: (state: QueryEnvironmentSnapshot) => void) {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
		set(next: QueryEnvironmentSnapshot) {
			snapshot = next
			for (const listener of [...listeners]) {
				listener(next)
			}
		},
		listeners,
	}
}

describe('shared request scheduler', () => {
	it('shares a bounded exponential retry sequence', async () => {
		vi.useFakeTimers()
		let calls = 0
		const users = defineQuery(['users'], (_id: string) => {
			calls++
			throw new Error('unavailable')
		})
		const queries = client()
		const reader = queries.observe$(users, 'a')
		queries.observe$(users, 'a')
		const failed = reader.refetch().catch((error) => error)
		await vi.advanceTimersByTimeAsync(0)
		expect(calls).toBe(1)
		expect(reader.state$.get().failureCount).toBe(1)
		await vi.advanceTimersByTimeAsync(999)
		expect(calls).toBe(1)
		await vi.advanceTimersByTimeAsync(1)
		expect(calls).toBe(2)
		await vi.advanceTimersByTimeAsync(2000)
		expect(calls).toBe(3)
		expect(await failed).toMatchObject({ message: 'unavailable' })
		expect(reader.state$.get()).toMatchObject({
			status: 'error',
			fetchStatus: 'idle',
			failureCount: 3,
		})
	})
	it('does not retry abort errors or errors rejected by application policy', async () => {
		for (const abort of [true, false]) {
			let calls = 0
			const users = defineQuery(
				['users'],
				(_id: string) => {
					calls++
					throw Object.assign(new Error('stop'), {
						name: abort ? 'AbortError' : 'ApplicationError',
					})
				},
				{ shouldRetry: () => false },
			)

			const reader = client().observe$(users, 'a')
			await expect(reader.refetch()).rejects.toThrow('stop')
			expect(calls).toBe(1)
		}
	})
	it('pauses one shared request offline and resumes it once connectivity returns', async () => {
		const host = environment({ online: false })
		let calls = 0
		const users = defineQuery(['users'], (_id: string) => ++calls)
		const queries = client(undefined, host)
		const a = queries.observe$(users, 'a')
		const b = queries.observe$(users, 'a')
		await settle()
		expect(calls).toBe(0)
		expect(a.state$.get()).toMatchObject({ fetchStatus: 'paused', hasData: false })
		host.set({ online: true })
		await settle()
		expect(calls).toBe(1)
		expect([a.data$.get(), b.data$.get()]).toEqual([1, 1])
		await queries.dispose()
		expect(host.listeners.size).toBe(0)
	})
	it('runs local loaders offline and remote loaders when connectivity is unknown', async () => {
		for (const networkMode of ['always', 'online'] as const) {
			const host = environment(networkMode === 'always' ? { online: false } : {})
			const users = defineQuery(['users'], (_id: string) => 'ready', { networkMode })
			const reader = client(undefined, host).observe$(users, 'a')
			await expect(reader.refetch()).resolves.toBe('ready')
		}
	})
	it('invalidation interrupts backoff without leaving a duplicate attempt', async () => {
		vi.useFakeTimers()
		let calls = 0
		const users = defineQuery(['users'], (_id: string) => {
			if (++calls === 1) {
				throw new Error('temporary')
			}
			return calls
		})
		const queries = client()
		const reader = queries.observe$(users, 'a')
		const result = reader.refetch()
		await vi.advanceTimersByTimeAsync(0)
		queries.invalidateQueries({ key: ['users'] })
		await vi.advanceTimersByTimeAsync(0)
		await expect(result).resolves.toBe(2)
		await vi.advanceTimersByTimeAsync(30000)
		expect(calls).toBe(2)
	})
	it('host events do not shorten the configured retry delay', async () => {
		vi.useFakeTimers()
		const host = environment({ online: true, active: true })
		let calls = 0
		const users = defineQuery(['users'], (_id: string) => {
			if (++calls === 1) {
				throw new Error('temporary')
			}
			return calls
		})
		const reader = client(undefined, host).observe$(users, 'a')
		await vi.advanceTimersByTimeAsync(500)
		host.set({ online: true, active: false })
		await vi.advanceTimersByTimeAsync(499)
		expect(calls).toBe(1)
		await vi.advanceTimersByTimeAsync(1)
		expect(calls).toBe(2)
		expect(reader.data$.get()).toBe(2)
	})
	it('retires account signals even if environment teardown throws', async () => {
		const queries = createQueryClient({
			environment: {
				getSnapshot: () => ({}),
				subscribe: () => () => {
					throw new Error('host cleanup')
				},
			},
		})
		const users = defineQuery(['users'], (_id: string) => 'private')
		const reader = queries.observe$(users, 'a')
		await expect(reader.refetch()).resolves.toBe('private')
		await expect(queries.dispose()).rejects.toThrow('host cleanup')
		expect(() => reader.data$.get()).toThrow()
	})
	it('disposal cancels retry delay and paused work', async () => {
		vi.useFakeTimers()
		for (const offline of [true, false]) {
			let calls = 0
			const host = environment({ online: !offline })
			const users = defineQuery(['users'], (_id: string) => {
				calls++
				throw new Error('temporary')
			})

			const queries = client(undefined, host)
			const reader = queries.observe$(users, 'a')
			const result = reader.refetch().catch((error) => error)
			await vi.advanceTimersByTimeAsync(0)
			await queries.dispose()
			expect(await result).toMatchObject({ name: 'AbortError' })
			host.set({ online: true })
			await vi.advanceTimersByTimeAsync(30000)
			expect(calls).toBe(offline ? 0 : 1)
		}
	})
})

describe('lifecycle refresh and polling', () => {
	it('coalesces resume and reconnect for stale observed entries', async () => {
		const host = environment({ online: true, active: true })
		let calls = 0
		const users = defineQuery(['users'], (_id: string) => ++calls)
		const queries = client(undefined, host)
		const reader = queries.observe$(users, 'a')
		queries.observe$(users, 'a')
		await settle()
		host.set({ online: false, active: false })
		host.set({ online: false, active: true })
		host.set({ online: true, active: true })
		await settle()
		expect(calls).toBe(2)
		expect(reader.data$.get()).toBe(2)
	})
	it('does not refresh fresh entries or entries whose policy disables lifecycle refresh', async () => {
		for (const fresh of [true, false]) {
			const host = environment({ online: true, active: true })
			let calls = 0
			const users = defineQuery(
				['users'],
				(_id: string) => ++calls,
				fresh ? { staleTimeMs: Infinity } : { refetchOnResume: false, refetchOnReconnect: false },
			)

			const reader = client(undefined, host).observe$(users, 'a')
			await settle()
			host.set({ online: false, active: false })
			host.set({ online: true, active: true })
			await settle()
			expect(calls).toBe(1)
			expect(reader.data$.get()).toBe(1)
		}
	})
	it('polls without background/offline catch-up bursts and stops after the final lease', async () => {
		vi.useFakeTimers()
		const host = environment({ online: true, active: true })
		let calls = 0
		const users = defineQuery(['users'], (_id: string) => ++calls, { refetchIntervalMs: 100 })
		const reader = client(undefined, host).observe$(users, 'a')
		await vi.advanceTimersByTimeAsync(0)
		await vi.advanceTimersByTimeAsync(100)
		expect(calls).toBe(2)
		host.set({ online: true, active: false })
		await vi.advanceTimersByTimeAsync(1000)
		expect(calls).toBe(2)
		host.set({ online: true, active: true })
		await vi.advanceTimersByTimeAsync(0)
		expect(calls).toBe(3)
		await vi.advanceTimersByTimeAsync(100)
		expect(calls).toBe(4)
		host.set({ online: false, active: true })
		await vi.advanceTimersByTimeAsync(1000)
		expect(calls).toBe(4)
		host.set({ online: true, active: true })
		await vi.advanceTimersByTimeAsync(0)
		expect(calls).toBe(5)
		reader.dispose()
		expect(host.listeners.size).toBe(0)
		await vi.advanceTimersByTimeAsync(1000)
		expect(calls).toBe(5)
	})
	it('shares a lazy subscription and reattaches after becoming idle', async () => {
		const host = environment({ online: true })
		const queries = client(undefined, host)
		const users = defineQuery(['users'], (_id: string) => 'value')
		expect(host.listeners.size).toBe(0)
		const first = queries.observe$(users, 'a')
		const second = queries.observe$(users, 'b')
		await settle()
		expect(host.listeners.size).toBe(1)
		first.dispose()
		expect(host.listeners.size).toBe(1)
		second.dispose()
		expect(host.listeners.size).toBe(0)
		queries.observe$(users, 'a')
		await settle()
		expect(host.listeners.size).toBe(1)
	})
})

describe('typed confirmed cache updates', () => {
	it('publishes one write to all readers and uses the configured freshness window', async () => {
		let calls = 0
		const users = defineQuery(['users'], (_id: string) => ({ name: `server-${++calls}` }), {
			staleTimeMs: Infinity,
		})
		const queries = client()
		const a = queries.observe$(users, 'a')
		const b = queries.observe$(users, 'a')
		await settle()
		queries.setQueryData(users, 'a', (previous) => ({ ...previous!, name: 'saved' }))
		expect(a.data$.get()).toEqual({ name: 'saved' })
		expect(b.data$.get()).toEqual({ name: 'saved' })
		queries.observe$(users, 'a')
		await settle()
		expect(calls).toBe(1)
		expect(queries.getQueryData(users, 'a')).toEqual({ name: 'saved' })
	})
	it('fences older fetches and allows an explicitly newer refetch', async () => {
		const gate = deferred<string>()
		let calls = 0
		const users = defineQuery(['users'], (_id: string) =>
			++calls === 1 ? gate.promise : 'reconciled',
		)
		const queries = client()
		const reader = queries.observe$(users, 'a')
		const old = reader.refetch().catch((error) => error)
		await settle()
		queries.setQueryData(users, 'a', 'saved')
		expect(await old).toMatchObject({ name: 'AbortError' })
		gate.resolve('obsolete')
		await settle()
		expect(reader.data$.get()).toBe('saved')
		await reader.refetch()
		expect(reader.data$.get()).toBe('reconciled')
	})
	it('fences an older restore and saves the confirmed replacement', async () => {
		const gate = deferred<string | null>()
		const records = new Map<string, string>()
		let first = true
		const storage: QueryStorageAdapter = {
			get(key) {
				if (first && !key.startsWith('xplat:query:index:')) {
					first = false
					return gate.promise
				}
				return records.get(key)
			},
			set: (key, value) => {
				records.set(key, value)
			},
			remove: (key) => {
				records.delete(key)
			},
		}
		const users = defineQuery(['users'], (_id: string) => 'network', {
			staleTimeMs: Infinity,
			persist: { storage, version: 1 },
		})
		const queries = client('account')
		const reader = queries.observe$(users, 'a')
		await settle()
		queries.setQueryData(users, 'a', 'saved')
		gate.resolve(JSON.stringify({ v: 1, t: Date.now(), d: 'obsolete' }))
		await settle()
		expect(reader.data$.get()).toBe('saved')
		await queries.dispose()
		const restored = client('account').observe$(users, 'a')
		await settle()
		expect(restored.data$.get()).toBe('saved')
	})
	it('updates only matching existing selections and does not create entries during reads', async () => {
		const users = defineQuery(['users'], (id: string) => ({ id, name: 'before' }), {
			staleTimeMs: Infinity,
		})
		const queries = client()
		expect(queries.getQueryData(users, 'missing')).toBeUndefined()
		expect(queries.setQueriesData(users, (value) => value)).toBe(0)
		queries.setQueryData(users, 'a', { id: 'a', name: 'first' })
		queries.setQueryData(users, 'b', { id: 'b', name: 'second' })
		expect(
			queries.setQueriesData(users, (value, selection) => ({ ...value, name: selection }), {
				key: ['users', 'a'],
				exact: true,
			}),
		).toBe(1)
		expect(queries.getQueryData(users, 'a')?.name).toBe('a')
		expect(queries.getQueryData(users, 'b')?.name).toBe('second')
	})
	it('rejects writes after disposal and leaves data intact if an updater throws', async () => {
		const users = defineQuery(['users'], (_id: string) => 'server')
		const queries = client()
		queries.setQueryData(users, 'a', 'saved')
		expect(() =>
			queries.setQueryData(users, 'a', () => {
				throw new Error('update failed')
			}),
		).toThrow('update failed')
		expect(queries.getQueryData(users, 'a')).toBe('saved')
		await queries.dispose()
		expect(() => queries.setQueryData(users, 'a', 'private')).toThrow('disposed')
	})
})

describe('operations outside component lifetimes', () => {
	it('prefetch and a mounted reader share one pending request', async () => {
		const gate = deferred<string>()
		let calls = 0
		const users = defineQuery(
			['users'],
			(_id: string) => {
				calls++
				return gate.promise
			},
			{ staleTimeMs: 10000 },
		)
		const queries = client()
		const prefetched = queries.prefetch(users, 'a')
		const reader = queries.observe$(users, 'a')
		await settle()
		expect(calls).toBe(1)
		gate.resolve('ready')
		await expect(prefetched).resolves.toEqual({ status: 'success' })
		await settle()
		expect(reader.data$.get()).toBe('ready')
		await expect(queries.ensureData(users, 'a')).resolves.toBe('ready')
		expect(calls).toBe(1)
	})
	it('reports prefetch failure and can recover through ensureData', async () => {
		let calls = 0
		const users = defineQuery(
			['users'],
			(_id: string) => {
				if (++calls === 1) {
					throw new Error('temporary')
				}
				return 'recovered'
			},
			{ retryCount: 0 },
		)
		const queries = client()
		expect(await queries.prefetch(users, 'a')).toMatchObject({
			status: 'error',
			error: { message: 'temporary' },
		})
		await expect(queries.ensureData(users, 'a')).resolves.toBe('recovered')
	})
	it('cancels one operation without aborting another reader', async () => {
		const gate = deferred<string>()
		let sharedSignal!: AbortSignal
		const users = defineQuery(['users'], (_id: string, { signal }) => {
			sharedSignal = signal
			return gate.promise
		})
		const queries = client()
		const controller = new AbortController()
		const operation = queries
			.ensureData(users, 'a', { signal: controller.signal })
			.catch((error) => error)
		const reader = queries.observe$(users, 'a')
		await settle()
		controller.abort()
		expect(await operation).toMatchObject({ name: 'AbortError' })
		expect(sharedSignal.aborted).toBe(false)
		gate.resolve('still needed')
		await settle()
		expect(reader.data$.get()).toBe('still needed')
	})
	it('aborts the transport after its final operation and ignores its late result', async () => {
		const gate = deferred<string>()
		let sharedSignal!: AbortSignal
		const users = defineQuery(['users'], (_id: string, { signal }) => {
			sharedSignal = signal
			return gate.promise
		})
		const queries = client()
		const controller = new AbortController()
		const operation = queries.prefetch(users, 'a', { signal: controller.signal })
		await settle()
		controller.abort()
		await expect(operation).resolves.toEqual({ status: 'cancelled' })
		expect(sharedSignal.aborted).toBe(true)
		gate.resolve('obsolete')
		await settle()
		expect(queries.getQueryData(users, 'a')).toBeUndefined()
	})
	it('releases successful operations into normal collection', async () => {
		vi.useFakeTimers()
		const users = defineQuery(['users'], (id: string) => id, {
			gcTimeMs: 100,
			staleTimeMs: Infinity,
		})
		const queries = client()
		await expect(queries.ensureData(users, 'a')).resolves.toBe('a')
		await vi.advanceTimersByTimeAsync(100)
		expect(queries.getQueryData(users, 'a')).toBeUndefined()
	})
})

describe('shared native optimistic actions', () => {
	it('shows tentative data in all readers but persists only confirmed authority', async () => {
		const storage = createMemoryQueryStorage()
		const users = defineQuery(['users'], (_id: string) => ({ name: 'before', revision: 1 }), {
			staleTimeMs: Infinity,
			persist: { storage, version: 1 },
		})
		const queries = client('account')
		const a = queries.observe$(users, 'a')
		const b = queries.observe$(users, 'a')
		await settle()
		const gate = deferred<{ name: string; revision: number }>()
		const saved = queries.runOptimistic(users, 'a', async (operation, view$) => {
			operation.set(view$, { name: 'tentative', revision: 2 })
			const receipt = await gate.promise
			operation.adopt(receipt)
		})
		await settle()
		expect([a.data$.get().name, b.data$.get().name]).toEqual(['tentative', 'tentative'])
		expect(queries.getQueryData(users, 'a')?.name).toBe('before')
		const other = client('account').observe$(users, 'a')
		await settle()
		expect(other.data$.get().name).toBe('before')
		gate.resolve({ name: 'confirmed', revision: 2 })
		await saved
		await settle()
		expect([a.data$.get().name, b.data$.get().name]).toEqual(['confirmed', 'confirmed'])
		expect(queries.getQueryData(users, 'a')?.name).toBe('confirmed')
		const restored = client('account').observe$(users, 'a')
		await settle()
		expect(restored.data$.get().name).toBe('confirmed')
	})
	it('keeps newer authority when overlapping saves settle out of order', async () => {
		const users = defineQuery(['users'], (_id: string) => ({ revision: 1 }), {
			compareAuthority: (incoming, current) => incoming.revision - current.revision,
		})
		const queries = client()
		await queries.ensureData(users, 'a')
		const a = deferred<{ revision: number }>()
		const b = deferred<{ revision: number }>()
		const first = queries.runOptimistic(users, 'a', async (op, view$) => {
			op.set(view$, { revision: 2 })
			op.adopt(await a.promise)
		})
		const second = queries.runOptimistic(users, 'a', async (op, view$) => {
			op.set(view$, { revision: 3 })
			op.adopt(await b.promise)
		})
		b.resolve({ revision: 3 })
		await second
		expect(queries.getQueryData(users, 'a')?.revision).toBe(3)
		a.resolve({ revision: 2 })
		await first
		expect(queries.getQueryData(users, 'a')?.revision).toBe(3)
	})
	it('rolls back only the failed operation and retains another operation', async () => {
		const users = defineQuery(['users'], (_id: string) => 'before')
		const queries = client()
		const reader = queries.observe$(users, 'a')
		await settle()
		const firstGate = deferred<string>()
		const secondGate = deferred<string>()
		const first = queries
			.runOptimistic(users, 'a', async (op, view$) => {
				op.set(view$, 'first')
				op.adopt(await firstGate.promise)
			})
			.catch((error) => error)
		const second = queries.runOptimistic(users, 'a', async (op, view$) => {
			op.set(view$, 'second')
			op.adopt(await secondGate.promise)
		})
		firstGate.reject(new Error('rejected'))
		expect(await first).toMatchObject({ message: 'rejected' })
		expect(reader.data$.get()).toBe('second')
		secondGate.resolve('confirmed')
		await second
		expect(reader.data$.get()).toBe('confirmed')
	})
	it('publishes adoption to confirmed reads inside the same native action', async () => {
		const users = defineQuery(['users'], (_id: string) => ({ revision: 1 }))
		const queries = client()
		await queries.ensureData(users, 'a')
		await queries.runOptimistic(users, 'a', (op, view$) => {
			op.set(view$, { revision: 2 })
			op.adopt({ revision: 2 })
			expect(queries.getQueryData(users, 'a')?.revision).toBe(2)
		})
	})
	it('keeps uncertain outcomes explicit without confirming or retrying a write', async () => {
		const users = defineQuery(['users'], (_id: string) => 'confirmed')
		const queries = client()
		const reader = queries.observe$(users, 'a')
		await settle()
		let calls = 0
		await expect(
			queries.runOptimistic(users, 'a', (op, view$) => {
				calls++
				op.set(view$, 'tentative')
				throw Object.assign(new Error('outcome unknown'), { code: 'OCTANE_RPC_UNCERTAIN' })
			}),
		).rejects.toMatchObject({ code: 'OCTANE_ACTION_UNCERTAIN' })
		expect(calls).toBe(1)
		expect(queries.getQueryData(users, 'a')).toBe('confirmed')
		expect(reader.data$.get()).toBe('tentative')
	})
	it('rejects older refetch data and does not resurrect an overlay after failure', async () => {
		const users = defineQuery(['users'], (_id: string) => ({ revision: 1 }), {
			compareAuthority: (incoming, current) => incoming.revision - current.revision,
		})
		const queries = client()
		const reader = queries.observe$(users, 'a')
		await settle()
		queries.setQueryData(users, 'a', { revision: 3 })
		await reader.refetch()
		expect(queries.getQueryData(users, 'a')?.revision).toBe(3)
		await expect(
			queries.runOptimistic(users, 'a', (op, view$) => {
				op.set(view$, { revision: 4 })
				throw new Error('rejected')
			}),
		).rejects.toThrow('rejected')
		await reader.refetch()
		expect(reader.data$.get().revision).toBe(3)
	})
	it('holds an operation lease after the last screen leaves', async () => {
		vi.useFakeTimers()
		const users = defineQuery(['users'], (_id: string) => 'before', { gcTimeMs: 10 })
		const queries = client()
		const reader = queries.observe$(users, 'a')
		await vi.advanceTimersByTimeAsync(0)
		const gate = deferred<string>()
		const saved = queries.runOptimistic(users, 'a', async (op, view$) => {
			op.set(view$, 'tentative')
			op.adopt(await gate.promise)
		})
		reader.dispose()
		await vi.advanceTimersByTimeAsync(100)
		expect(queries.getQueryData(users, 'a')).toBe('before')
		gate.resolve('confirmed')
		await saved
		await vi.advanceTimersByTimeAsync(10)
		expect(queries.getQueryData(users, 'a')).toBeUndefined()
	})
	it('cancels disposed actions and fences a late server receipt', async () => {
		const users = defineQuery(['users'], (_id: string) => 'before')
		const queries = client()
		await queries.ensureData(users, 'a')
		const gate = deferred<string>()
		let signal!: AbortSignal
		const saved = queries
			.runOptimistic(users, 'a', async (op, view$, context) => {
				signal = context.signal
				op.set(view$, 'tentative')
				op.adopt(await gate.promise)
			})
			.catch((error) => error)
		await queries.dispose()
		expect(signal.aborted).toBe(true)
		expect(await saved).toMatchObject({ name: 'AbortError' })
		gate.resolve('old account')
		await settle()
		expect(() => queries.getQueryData(users, 'a')).toThrow('disposed')
	})
})

describe('cached cursor pagination', () => {
	it('shares pages and one next-page request between readers', async () => {
		const gate = deferred<{ items: number[]; nextCursor?: number }>()
		const calls: number[] = []
		const feed = defineCursorQuery(
			['feed'],
			(_filter: string, { cursor }: { cursor: number }) => {
				calls.push(cursor)
				return cursor === 0 ? { items: [0], nextCursor: 1 } : gate.promise
			},
			{ initialCursor: 0, staleTimeMs: Infinity },
		)
		const queries = client()
		const a = queries.observe$(feed, 'all')
		const b = queries.observe$(feed, 'all')
		await settle()
		const first = queries.fetchNextPage(feed, 'all')
		const second = queries.fetchNextPage(feed, 'all')
		await settle()
		expect(calls).toEqual([0, 1])
		expect(a.state$.get().fetchDirection).toBe('next')
		gate.resolve({ items: [1] })
		await Promise.all([first, second])
		await settle()
		expect(a.data$.get().pages.flatMap((page) => page.items)).toEqual([0, 1])
		expect(b.data$.get().pageParams).toEqual([0, 1])
		await queries.fetchNextPage(feed, 'all')
		expect(calls).toEqual([0, 1])
	})
	it('keeps earlier rows on failure and retries the same cursor', async () => {
		const calls: number[] = []
		let fail = true
		const feed = defineCursorQuery(
			['feed'],
			(_filter: string, { cursor }: { cursor: number }) => {
				calls.push(cursor)
				if (cursor === 1 && fail) {
					throw new Error('page failed')
				}
				return { items: [cursor], nextCursor: cursor + 1 }
			},
			{ initialCursor: 0, retryCount: 0 },
		)
		const queries = client()
		const reader = queries.observe$(feed, 'all')
		await settle()
		await expect(queries.fetchNextPage(feed, 'all')).rejects.toThrow('page failed')
		expect(reader.data$.get().pages.flatMap((page) => page.items)).toEqual([0])
		expect(reader.state$.get()).toMatchObject({ status: 'error', hasData: true })
		fail = false
		await queries.fetchNextPage(feed, 'all')
		expect(calls).toEqual([0, 1, 1])
		expect(reader.data$.get().pageParams).toEqual([0, 1])
	})
	it('serializes full refresh after load-more and refreshes sequentially', async () => {
		const gate = deferred<{ items: number[]; nextCursor: number }>()
		const calls: number[] = []
		let pending = true
		const feed = defineCursorQuery(
			['feed'],
			(_filter: string, { cursor }: { cursor: number }) => {
				calls.push(cursor)
				if (cursor === 1 && pending) {
					return gate.promise
				}
				return { items: [cursor], nextCursor: cursor + 1 }
			},
			{ initialCursor: 0, staleTimeMs: Infinity },
		)
		const queries = client()
		const reader = queries.observe$(feed, 'all')
		await settle()
		const more = queries.fetchNextPage(feed, 'all')
		await settle()
		const refreshed = reader.refetch()
		pending = false
		gate.resolve({ items: [1], nextCursor: 2 })
		await Promise.all([more, refreshed])
		expect(calls).toEqual([0, 1, 0, 1])
		expect(reader.data$.get().pageParams).toEqual([0, 1])
	})
	it('waits for refresh before choosing a new next cursor', async () => {
		const gate = deferred<{ items: number[]; nextCursor: number }>()
		const calls: number[] = []
		let refresh = false
		const feed = defineCursorQuery(
			['feed'],
			(_filter: string, { cursor }: { cursor: number }) => {
				calls.push(cursor)
				if (cursor === 0 && refresh) {
					return gate.promise
				}
				return { items: [cursor], nextCursor: 1 }
			},
			{ initialCursor: 0 },
		)
		const queries = client()
		const reader = queries.observe$(feed, 'all')
		await settle()
		refresh = true
		const refreshed = reader.refetch()
		await settle()
		const more = queries.fetchNextPage(feed, 'all')
		gate.resolve({ items: [0], nextCursor: 10 })
		await Promise.all([refreshed, more])
		expect(calls).toEqual([0, 0, 10])
		expect(reader.data$.get().pageParams).toEqual([0, 10])
	})
	it('invalidation during a page load queues one full refresh', async () => {
		const gate = deferred<{ items: number[]; nextCursor: number }>()
		const calls: number[] = []
		let pending = true
		const feed = defineCursorQuery(
			['feed'],
			(_filter: string, { cursor }: { cursor: number }) => {
				calls.push(cursor)
				return cursor === 1 && pending ? gate.promise : { items: [cursor], nextCursor: cursor + 1 }
			},
			{ initialCursor: 0 },
		)
		const queries = client()
		const reader = queries.observe$(feed, 'all')
		await settle()
		const more = queries.fetchNextPage(feed, 'all')
		await settle()
		queries.invalidateQueries({ key: ['feed'] })
		pending = false
		gate.resolve({ items: [1], nextCursor: 2 })
		await more
		await settle()
		expect(calls).toEqual([0, 1, 0, 1])
		expect(reader.data$.get().pageParams).toEqual([0, 1])
	})
	it('refreshes a bounded window from its first retained cursor using fresh successors', async () => {
		const calls: number[] = []
		let changed = false
		const feed = defineCursorQuery(
			['feed'],
			(_filter: string, { cursor }: { cursor: number }) => {
				calls.push(cursor)
				return { items: [cursor], nextCursor: changed && cursor === 1 ? 10 : cursor + 1 }
			},
			{ initialCursor: 0, maxPages: 2, staleTimeMs: Infinity },
		)
		const queries = client()
		const reader = queries.observe$(feed, 'all')
		await settle()
		await queries.fetchNextPage(feed, 'all')
		await queries.fetchNextPage(feed, 'all')
		changed = true
		await reader.refetch()
		expect(calls).toEqual([0, 1, 2, 1, 10])
		expect(reader.data$.get().pageParams).toEqual([1, 10])
	})
	it('bounds pages and supports loading backwards from the retained window', async () => {
		const feed = defineCursorQuery(
			['feed'],
			(_filter: string, { cursor }: { cursor: number }) => ({
				items: [cursor],
				nextCursor: cursor + 1,
				previousCursor: cursor > 0 ? cursor - 1 : undefined,
			}),
			{ initialCursor: 0, maxPages: 2 },
		)
		const queries = client()
		await queries.ensureData(feed, 'all')
		await queries.fetchNextPage(feed, 'all')
		await queries.fetchNextPage(feed, 'all')
		expect(queries.getQueryData(feed, 'all')?.pageParams).toEqual([1, 2])
		await queries.fetchPreviousPage(feed, 'all')
		expect(queries.getQueryData(feed, 'all')?.pageParams).toEqual([0, 1])
	})
	it('preserves null as a valid cursor when refreshing a retained window', async () => {
		const calls: Array<string | null> = []
		const feed = defineCursorQuery(
			['feed'],
			(_filter: string, { cursor }: { cursor: string | null }) => {
				calls.push(cursor)
				return { items: [String(cursor)], nextCursor: cursor === 'start' ? null : undefined }
			},
			{ initialCursor: 'start', maxPages: 1 },
		)
		const queries = client()
		const reader = queries.observe$(feed, 'all')
		await settle()
		await queries.fetchNextPage(feed, 'all')
		expect(reader.data$.get().pageParams).toEqual([null])
		await reader.refetch()
		expect(calls).toEqual(['start', null, null])
	})
	it('keeps page parameters coherent through persistence', async () => {
		const storage = createMemoryQueryStorage()
		let calls = 0
		const feed = defineCursorQuery(
			['feed'],
			(_filter: string, { cursor }: { cursor: number }) => {
				calls++
				return { items: [cursor], nextCursor: cursor + 1 }
			},
			{ initialCursor: 0, staleTimeMs: Infinity, persist: { storage, version: 1 } },
		)
		const queries = client('feed-account')
		await queries.ensureData(feed, 'all')
		await queries.fetchNextPage(feed, 'all')
		await settle()
		await queries.dispose()
		const restored = client('feed-account')
		const data = await restored.ensureData(feed, 'all')
		expect(data.pageParams).toEqual([0, 1])
		expect(data.pages.flatMap((page) => page.items)).toEqual([0, 1])
		expect(calls).toBe(2)
	})
	it('isolates filters and fences an obsolete page after a confirmed write', async () => {
		const gate = deferred<{ items: number[]; nextCursor: number }>()
		const feed = defineCursorQuery(
			['feed'],
			(filter: string, { cursor }: { cursor: number }) =>
				cursor === 1 ? gate.promise : { items: [filter === 'a' ? 0 : 10], nextCursor: 1 },
			{ initialCursor: 0 },
		)
		const queries = client()
		await queries.ensureData(feed, 'a')
		await queries.ensureData(feed, 'b')
		const more = queries.fetchNextPage(feed, 'a').catch((error) => error)
		await settle()
		const replacement = queries.getQueryData(feed, 'b')!
		queries.setQueryData(feed, 'a', replacement)
		expect(await more).toMatchObject({ name: 'AbortError' })
		gate.resolve({ items: [1], nextCursor: 2 })
		await settle()
		expect(queries.getQueryData(feed, 'a')?.pages[0]?.items).toEqual([10])
	})
})
