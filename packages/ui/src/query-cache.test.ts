import { afterEach, describe, expect, it } from 'vitest'
import {
	createQueryClient,
	createMemoryQueryStorage,
	defineQuery,
	type QueryClient,
	type QueryStorageAdapter,
} from './query-cache'

const clients: QueryClient[] = []
function client(namespace?: string) {
	const value = createQueryClient({ namespace })
	clients.push(value)
	return value
}

afterEach(async () => {
	await Promise.all(clients.splice(0).map((value) => value.dispose()))
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
		const users = defineQuery(['users'], (_id: string) => (++count === 1 ? 'first' : gate.promise))
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
		await expect(queries.dispose({ purgePersisted: true })).rejects.toThrow('storage purge')
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
		let record: string | null = null
		const operations: string[] = []
		const storage: QueryStorageAdapter = {
			get: () => record,
			async set(_key, value) {
				operations.push('set')
				await saved.promise
				record = value
			},
			remove() {
				operations.push('remove')
				record = null
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
		expect(operations).toEqual(['set', 'remove'])
		expect(record).toBeNull()
	})
})
