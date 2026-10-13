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
				items: [...items].sort((x, y) =>
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
