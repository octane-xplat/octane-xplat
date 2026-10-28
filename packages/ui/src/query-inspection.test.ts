import { afterEach, describe, expect, it, vi } from 'vitest'
import { listDevActions } from '@octane-xplat/platform/dev-actions'
import {
	createQueryClient,
	defineQuery,
	createMemoryQueryStorage,
	type QueryClient,
	type QueryEnvironmentSnapshot,
} from './query-cache'

import { inspectQueryClient, registerQueryInspection, type QueryInspector } from './data/dev'

const clients: QueryClient[] = []
const inspectors: QueryInspector[] = []
function setup(eventLimit = 100) {
	const client = createQueryClient({ namespace: 'SECRET-ACCOUNT' })
	clients.push(client)
	const definition = defineQuery(
		['SECRET-FAMILY'],
		(selection: string) => ({ privateValue: selection }),
		{ staleTimeMs: 100 },
	)
	const inspector = inspectQueryClient(client, {
		eventLimit,
		labels: [{ definition, label: 'users.detail' }],
	})
	inspectors.push(inspector)
	return { client, definition, inspector }
}

afterEach(async () => {
	for (const inspector of inspectors.splice(0)) {
		inspector.dispose()
	}
	await Promise.all(clients.splice(0).map((client) => client.dispose()))
	vi.useRealTimers()
})

async function settle() {
	for (let i = 0; i < 30; i++) {
		await Promise.resolve()
	}
}

describe('opt-in query inspection', () => {
	it('reports live metadata without keys, account scopes, selections, data or error messages', async () => {
		const { client, definition, inspector } = setup()
		const first = client.observe$(definition, 'SECRET-SELECTION')
		const second = client.observe$(definition, 'SECRET-SELECTION')
		await first.refetch()
		const snapshot = inspector.snapshot()
		expect(snapshot.queries).toHaveLength(1)
		expect(snapshot.queries[0]).toMatchObject({
			label: 'users.detail',
			status: 'ready',
			fetchStatus: 'idle',
			observers: 2,
			leases: 2,
			stale: false,
			failureCount: 0,
		})
		expect(JSON.stringify(snapshot)).not.toContain('SECRET')
		expect(JSON.stringify(snapshot)).not.toContain('privateValue')
		expect(snapshot.events.map((event) => event.type)).toEqual(['load', 'success'])
		second.dispose()
		expect(inspector.snapshot().queries[0]?.observers).toBe(1)
		first.dispose()
		expect(inspector.snapshot().queries[0]?.leases).toBe(0)
	})

	it('snapshots are observational and do not change freshness, leases or acquire subscriptions', async () => {
		vi.useFakeTimers()
		const load = vi.fn(() => 1)
		const subscribe = vi.fn(() => () => {})
		const client = createQueryClient({ environment: { getSnapshot: () => ({}), subscribe } })
		clients.push(client)
		const definition = defineQuery(['observational'], load, { staleTimeMs: 10, gcTimeMs: 20 })
		await client.ensureData(definition, null)
		const inspector = inspectQueryClient(client)
		inspectors.push(inspector)
		expect(inspector.snapshot().events).toEqual([])
		expect(inspector.snapshot().queries[0]).toMatchObject({ stale: false, observers: 0, leases: 0 })
		await vi.advanceTimersByTimeAsync(11)
		expect(inspector.snapshot().queries[0]?.stale).toBe(true)
		await vi.advanceTimersByTimeAsync(10)
		expect(inspector.snapshot().queries).toEqual([])
		expect(inspector.snapshot().events.map((event) => event.type)).toEqual(['evict'])
		expect(load).toHaveBeenCalledTimes(1)
		expect(subscribe).toHaveBeenCalledTimes(1)
	})

	it('bounds event history and releases collection without disposing the client', async () => {
		const { client, definition, inspector } = setup(3)
		await client.ensureData(definition, 'a')
		for (let i = 0; i < 20; i++) {
			client.setQueryData(definition, 'a', { privateValue: String(i) })
		}
		const before = inspector.snapshot()
		expect(before.events).toHaveLength(3)
		expect(before.events.every((event) => event.type === 'write')).toBe(true)
		inspector.dispose()
		expect(() => inspector.snapshot()).toThrow('disposed')
		client.setQueryData(definition, 'a', { privateValue: 'still live' })
		expect(client.getQueryData(definition, 'a')).toEqual({ privateValue: 'still live' })
		expect(before.events).toHaveLength(3)
	})

	it('records pause, reconnect, retries and errors without exposing thrown data', async () => {
		let update!: (state: QueryEnvironmentSnapshot) => void
		const client = createQueryClient({
			environment: {
				getSnapshot: () => ({ online: false }),
				subscribe: (listener) => {
					update = listener
					return () => {}
				},
			},
		})
		clients.push(client)
		let attempts = 0
		const definition = defineQuery(
			['SECRET'],
			() => {
				attempts++
				throw new Error('SECRET-ERROR')
			},
			{ retryCount: 1, retryDelayMs: 0 },
		)
		const inspector = inspectQueryClient(client)
		inspectors.push(inspector)
		const reader = client.observe$(definition, null)
		await settle()
		expect(inspector.snapshot().queries[0]?.fetchStatus).toBe('paused')
		update({ online: true })
		await expect(reader.refetch()).rejects.toThrow('SECRET-ERROR')
		expect(attempts).toBe(2)
		expect(inspector.snapshot().events.map((event) => event.type)).toEqual([
			'load',
			'pause',
			'retry',
			'error',
		])
		expect(inspector.snapshot().queries[0]).toMatchObject({
			status: 'error',
			failureCount: 2,
			lastTrigger: 'observe',
		})
		expect(JSON.stringify(inspector.snapshot())).not.toContain('SECRET')
	})

	it('records invalidation, restored confirmed data and final disposal', async () => {
		const storage = createMemoryQueryStorage()
		const definition = defineQuery(['persisted'], () => 1, {
			staleTimeMs: Infinity,
			persist: { storage, version: 1 },
		})
		const first = createQueryClient({
			namespace: 'private',
			environment: { getSnapshot: () => ({}), subscribe: () => () => {} },
		})
		clients.push(first)
		await first.ensureData(definition, null)
		await first.dispose()
		const next = createQueryClient({ namespace: 'private' })
		clients.push(next)
		const inspector = inspectQueryClient(next)
		inspectors.push(inspector)
		await next.ensureData(definition, null)
		next.invalidateQueries()
		expect(inspector.snapshot().queries[0]).toMatchObject({
			stale: true,
			lastTrigger: 'invalidate',
		})
		await next.dispose()
		expect(inspector.snapshot()).toMatchObject({ status: 'disposed', queries: [] })
		expect(inspector.snapshot().events.map((event) => event.type)).toEqual([
			'load',
			'restore',
			'success',
			'invalidate',
			'evict',
			'dispose',
		])
	})

	it('allows only explicitly supplied static labels and validates buffer bounds', async () => {
		const { client, definition } = setup()
		expect(() => inspectQueryClient(client, { eventLimit: 1001 })).toThrow('eventLimit')
		expect(() =>
			inspectQueryClient(client, { labels: [{ definition, label: 'user/private@example.com' }] }),
		).toThrow('static names')
		const inspector = inspectQueryClient(client, { eventLimit: 0 })
		inspectors.push(inspector)
		await client.ensureData(definition, 'private')
		expect(inspector.snapshot().queries[0]).not.toHaveProperty('label')
		expect(inspector.snapshot().events).toEqual([])
	})

	it('registers one read-only CLI action per explicit client and removes it on teardown', () => {
		const { inspector } = setup()
		const registration = registerQueryInspection(inspector)
		try {
			const action = listDevActions().find((entry) => entry.id === registration.actionId)
			expect(action).toMatchObject({
				input: {},
				effects: { summary: 'Reads query metadata; does not change application state' },
				execution: { concurrency: 'overlap', retryable: true },
			})
		} finally {
			registration.dispose()
		}
		expect(listDevActions().some((entry) => entry.id === registration.actionId)).toBe(false)
	})
})
