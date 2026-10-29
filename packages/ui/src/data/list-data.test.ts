import { describe, expect, it } from 'vitest'

import { createListData, type ListData } from './list-data'

const data = (
	initialItems: { name: string }[] = [],
	options: Parameters<typeof createListData<{ name: string }>>[0] = {},
): ListData<{ name: string }> =>
	createListData({
		initialItems,
		getKey: (item) => item.name,
		...options,
	})

const names = (list: ListData<{ name: string }>) => list.items.map((item) => item.name)

describe('createListData', () => {
	it('inserts at an index, before, and after a key', () => {
		const list = data([{ name: 'a' }, { name: 'c' }])
		list.insert(1, { name: 'b' })
		expect(names(list)).toEqual(['a', 'b', 'c'])
		list.insertBefore('a', { name: 'z' })
		expect(names(list)).toEqual(['z', 'a', 'b', 'c'])
		list.insertAfter('c', { name: 'd' })
		expect(names(list)).toEqual(['z', 'a', 'b', 'c', 'd'])
	})

	it('appends and prepends multiple values', () => {
		const list = data([{ name: 'b' }])
		list.append({ name: 'c' }, { name: 'd' })
		list.prepend({ name: 'a' })
		expect(names(list)).toEqual(['a', 'b', 'c', 'd'])
	})

	it('removes items and prunes them from selection', () => {
		const list = data([{ name: 'a' }, { name: 'b' }, { name: 'c' }], {
			initialSelectedKeys: ['a', 'b'],
		})

		list.remove('a')
		expect(names(list)).toEqual(['b', 'c'])
		expect([...(list.selectedKeys as Set<string>)]).toEqual(['b'])
	})

	it('removeSelectedItems clears selection or empties the list for all', () => {
		const list = data([{ name: 'a' }, { name: 'b' }, { name: 'c' }], {
			initialSelectedKeys: ['a', 'c'],
		})

		list.removeSelectedItems()
		expect(names(list)).toEqual(['b'])

		const all = data([{ name: 'a' }], { initialSelectedKeys: 'all' })
		all.removeSelectedItems()
		expect(names(all)).toEqual([])
	})

	it('moves items by index and relative to keys', () => {
		const list = data([{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }])
		list.move('d', 0)
		expect(names(list)).toEqual(['d', 'a', 'b', 'c'])
		list.moveBefore('c', ['a', 'b'])
		expect(names(list)).toEqual(['d', 'a', 'b', 'c'])
		list.moveAfter('a', ['c'])
		expect(names(list)).toEqual(['d', 'a', 'c', 'b'])
	})

	it('updates by key and looks items up with getItem', () => {
		const list = data([{ name: 'a' }])
		list.update('a', { name: 'b' })
		expect(names(list)).toEqual(['b'])
		expect(list.getItem('b')).toEqual({ name: 'b' })
		expect(list.getItem('a')).toBeUndefined()
	})

	it('applies filter against filterText over the visible items view', () => {
		const list = data([{ name: 'apple' }, { name: 'banana' }, { name: 'avocado' }], {
			filter: (item, text) => item.name.startsWith(text),
		})

		list.setFilterText('a')
		expect(names(list)).toEqual(['apple', 'avocado'])
		expect(list.getItem('banana')).toEqual({ name: 'banana' })
	})

	it('supports selection=all and notifies subscribers on commit', () => {
		const list = data([{ name: 'a' }], { initialSelectedKeys: 'all' })
		expect(list.selectedKeys).toBe('all')

		let calls = 0
		const unsub = list.subscribe(() => calls++)
		list.append({ name: 'b' })
		expect(calls).toBe(1)
		unsub()
		list.append({ name: 'c' })
		expect(calls).toBe(1)
	})
})
