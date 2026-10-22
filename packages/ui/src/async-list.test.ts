import { describe, expect, it, vi } from 'vitest'

import { createAsyncListData } from './async-list'

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

const names = <T extends { name: string }>(items: T[]) => items.map((item) => item.name)

describe('createAsyncListData', () => {
	it('loads items and lands on idle', async () => {
		const list = createAsyncListData({
			load: async () => ({ items: [{ name: 'a' }, { name: 'b' }] }),
			getKey: (item: { name: string }) => item.name,
		})

		list.reload()
		expect(list.loadingState).toBe('loading')
		expect(list.isLoading).toBe(true)
		await tick()
		expect(list.loadingState).toBe('idle')
		expect(names(list.items)).toEqual(['a', 'b'])
	})

	it('paginates via cursor on loadMore', async () => {
		const seen: (string | undefined)[] = []
		const list = createAsyncListData<{ name: string }, string>({
			load: async ({ cursor }) => {
				seen.push(cursor)
				return cursor === undefined
					? { items: [{ name: 'a' }], cursor: 'p2' }
					: { items: [{ name: 'b' }], cursor: undefined }
			},
			getKey: (item) => item.name,
		})

		list.reload()
		await tick()
		list.loadMore()
		expect(list.loadingState).toBe('loadingMore')
		await tick()
		expect(seen).toEqual([undefined, 'p2'])
		expect(names(list.items)).toEqual(['a', 'b'])
		// No cursor left — loadMore is a no-op.
		list.loadMore()
		expect(seen).toHaveLength(2)
	})

	it('reloads through load when filterText changes', async () => {
		const seen: string[] = []
		const list = createAsyncListData<{ name: string }>({
			load: async ({ filterText }) => {
				seen.push(filterText)
				return { items: [{ name: filterText || 'all' }] }
			},
			getKey: (item) => item.name,
		})

		list.reload()
		await tick()
		list.setFilterText('abc')
		expect(list.loadingState).toBe('filtering')
		await tick()
		expect(seen).toEqual(['', 'abc'])
	})

	it('sorts client-side through options.sort', async () => {
		const list = createAsyncListData<{ name: string }>({
			load: async () => ({ items: [{ name: 'b' }, { name: 'a' }] }),
			sort: ({ items, sortDescriptor }) => ({
				items: [...items].sort(
					(x, y) =>
						(sortDescriptor.direction === 'ascending' ? 1 : -1) * x.name.localeCompare(y.name),
				),
			}),
			getKey: (item) => item.name,
		})

		list.reload()
		await tick()
		list.sort({ column: 'name', direction: 'ascending' })
		await tick()
		expect(names(list.items)).toEqual(['a', 'b'])
		expect(list.sortDescriptor).toEqual({ column: 'name', direction: 'ascending' })
	})

	it('re-sorts through load when no client sort is given', async () => {
		const load = vi.fn(async ({ sortDescriptor }: { sortDescriptor?: { column: string } }) => ({
			items: [{ name: String(sortDescriptor?.column ?? 'none') }],
		}))

		const list = createAsyncListData<{ name: string }>({ load, getKey: (item) => item.name })
		list.reload()
		await tick()
		list.sort({ column: 'name', direction: 'descending' })
		await tick()
		expect(load).toHaveBeenCalledTimes(2)
		expect(load.mock.calls[1][0].sortDescriptor).toEqual({
			column: 'name',
			direction: 'descending',
		})
	})

	it('records the error state on failure', async () => {
		const list = createAsyncListData({
			load: async () => {
				throw new Error('nope')
			},
		})

		list.reload()
		await tick()
		expect(list.loadingState).toBe('error')
		expect(list.error?.message).toBe('nope')
		expect(list.isLoading).toBe(false)
	})

	it('resolves operation promises on settle and supersede — never rejects', async () => {
		const gate: { resolve?: () => void } = {}
		let calls = 0
		const list = createAsyncListData<{ name: string }>({
			load: async () => {
				calls++
				if (calls === 1) {
					await new Promise<void>((resolve) => {
						gate.resolve = resolve
					})
				}

				return { items: [{ name: `v${calls}` }] }
			},
			getKey: (item) => item.name,
		})

		// Failure settles the promise without rejecting.
		const failing = createAsyncListData({
			load: async () => {
				throw new Error('nope')
			},
		})

		await expect(failing.reload()).resolves.toBeUndefined()
		expect(failing.loadingState).toBe('error')

		const first = list.reload()
		const second = list.reload()
		// The superseded reload resolves too — its caller must not hang.
		await expect(first).resolves.toBeUndefined()
		gate.resolve!()
		await expect(second).resolves.toBeUndefined()
		expect(names(list.items)).toEqual(['v2'])
	})

	it('reports pagination readiness through hasMore', async () => {
		const list = createAsyncListData<{ name: string }, string>({
			load: async ({ cursor }) =>
				cursor === undefined
					? { items: [{ name: 'a' }], cursor: 'p2' }
					: { items: [{ name: 'b' }] },
			getKey: (item) => item.name,
		})

		expect(list.hasMore).toBe(false)
		await list.reload()
		expect(list.hasMore).toBe(true)
		expect(list.getSnapshot().hasMore).toBe(true)
		await list.loadMore()
		expect(list.hasMore).toBe(false)
		expect(list.getSnapshot().hasMore).toBe(false)
		// A no-op loadMore still resolves.
		await expect(list.loadMore()).resolves.toBeUndefined()
	})

	it('aborts the in-flight load and returns to idle', async () => {
		const signals: AbortSignal[] = []
		const list = createAsyncListData<{ name: string }>({
			load: async ({ signal }) => {
				signals.push(signal)
				await new Promise((resolve) => setTimeout(resolve, 5))
				return { items: [{ name: 'late' }] }
			},
			getKey: (item) => item.name,
		})

		const pending = list.reload()
		expect(list.isLoading).toBe(true)
		list.abort()
		expect(signals[0].aborted).toBe(true)
		expect(list.loadingState).toBe('idle')
		await expect(pending).resolves.toBeUndefined()
		// The cancelled load's late result never publishes.
		await new Promise((resolve) => setTimeout(resolve, 10))
		expect(list.items).toHaveLength(0)
		// abort() with nothing pending is a no-op.
		list.abort()
		expect(list.loadingState).toBe('idle')
	})

	it('drops a client sort superseded by a newer load', async () => {
		let releaseSort!: () => void
		const sortGate = new Promise<void>((resolve) => {
			releaseSort = resolve
		})

		const list = createAsyncListData<{ name: string }>({
			load: async () => ({ items: [{ name: 'a' }, { name: 'b' }] }),
			sort: async ({ items }) => {
				await sortGate
				return { items: [...items].reverse() }
			},
			getKey: (item) => item.name,
		})

		await list.reload()
		const sorted = list.sort({ column: 'name', direction: 'descending' })
		const reloaded = list.reload()
		releaseSort()
		await expect(sorted).resolves.toBeUndefined()
		await expect(reloaded).resolves.toBeUndefined()
		// The stale sort result must not overwrite the reloaded items.
		expect(names(list.items)).toEqual(['a', 'b'])
		expect(list.loadingState).toBe('idle')
	})

	it('lands on error when a client sort throws synchronously', async () => {
		const list = createAsyncListData<{ name: string }>({
			load: async () => ({ items: [{ name: 'a' }] }),
			sort: () => {
				throw new Error('sort boom')
			},
			getKey: (item) => item.name,
		})

		await list.reload()
		await expect(list.sort({ column: 'name', direction: 'ascending' })).resolves.toBeUndefined()
		expect(list.loadingState).toBe('error')
		expect(list.error?.message).toBe('sort boom')
	})

	it('aborts a superseded load', async () => {
		const signals: AbortSignal[] = []
		const list = createAsyncListData<{ name: string }>({
			load: async ({ signal }) => {
				signals.push(signal)
				await new Promise((resolve) => setTimeout(resolve, 5))
				return { items: [{ name: 'late' }] }
			},
			getKey: (item) => item.name,
		})

		list.reload()
		list.reload()
		expect(signals[0].aborted).toBe(true)
		await new Promise((resolve) => setTimeout(resolve, 10))
		expect(names(list.items)).toEqual(['late'])
	})

	it('exposes the useListData mutation surface', async () => {
		const list = createAsyncListData<{ name: string }>({
			load: async () => ({ items: [{ name: 'a' }] }),
			getKey: (item) => item.name,
		})

		list.reload()
		await tick()
		list.append({ name: 'b' })
		list.update('a', { name: 'z' })
		expect(names(list.items)).toEqual(['z', 'b'])
	})
})

describe('atomic async collection updates', () => {
	it('preserves surviving selection through sort, pagination and reload', async () => {
		let initial = [{ id: 'a' }, { id: 'b' }]
		const list = createAsyncListData({
			load: async ({ cursor }) => cursor === undefined
				? { items: initial, cursor: 'next' }
				: { items: [{ id: 'c' }] },
			sort: ({ items }) => ({ items: [...items].reverse() }),
		})
		await list.reload()
		list.setSelectedKeys(['a', 'b'])
		const seen: string[][] = []
		list.subscribe(() => seen.push(list.items.map((item) => item.id)))
		await list.sort({ column: 'id', direction: 'descending' })
		expect([...list.selectedKeys]).toEqual(['a', 'b'])
		await list.loadMore()
		expect([...list.selectedKeys]).toEqual(['a', 'b'])
		expect(list.items.map((item) => item.id)).toEqual(['b', 'a', 'c'])
		initial = [{ id: 'b' }, { id: 'd' }]
		await list.reload()
		expect([...list.selectedKeys]).toEqual(['b'])
		expect(seen.every((items) => items.length > 0)).toBe(true)
	})

	it('publishes loader selection, cursor and idle state with the final items', async () => {
		const list = createAsyncListData({ load: async () => ({ items: [{ id: 1 }], selectedKeys: [1], cursor: 'next' }) })
		const seen: ReturnType<typeof list.getSnapshot>[] = []
		list.subscribe(() => seen.push(list.getSnapshot()))
		await list.reload()
		expect(seen).toHaveLength(2)
		expect(seen[0].loadingState).toBe('loading')
		expect(seen[1].loadingState).toBe('idle')
		expect(seen[1].hasMore).toBe(true)
		expect([...seen[1].selectedKeys]).toEqual([1])
		expect(seen[1].items).toEqual([{ id: 1 }])
	})

	it('retries a failed page with its retained cursor and keeps earlier pages', async () => {
		const seen: (string | undefined)[] = []
		const list = createAsyncListData({ load: async ({ cursor }) => {
			seen.push(cursor)
			if (seen.length === 2) {throw new Error('temporary page failure')}
			return cursor === undefined ? { items: [{ id: 1 }], cursor: 'page-2' } : { items: [{ id: 2 }] }
		} })
		await list.reload()
		list.setSelectedKeys([1])
		await expect(list.loadMore()).resolves.toBeUndefined()
		expect(list.loadingState).toBe('error')
		expect(list.error?.message).toBe('temporary page failure')
		expect(list.hasMore).toBe(true)
		expect(list.items).toEqual([{ id: 1 }])
		await expect(list.loadMore()).resolves.toBeUndefined()
		expect(seen).toEqual([undefined, 'page-2', 'page-2'])
		expect(list.items).toEqual([{ id: 1 }, { id: 2 }])
		expect([...list.selectedKeys]).toEqual([1])
		expect(list.loadingState).toBe('idle')
		expect(list.error).toBeUndefined()
	})

	it('preserves all selection through complete replacement', async () => {
		const list = createAsyncListData({ initialSelectedKeys: 'all', load: async () => ({ items: [{ id: 1 }] }) })
		await list.reload()
		await list.reload()
		expect(list.selectedKeys).toBe('all')
	})
})
