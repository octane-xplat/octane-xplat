import { describe, expect, it } from 'vitest'
import { VirtualListCellPool } from './virtual-list-cell-pool'
import { createVirtualListEntries } from './virtual-list-layout'

const item = (id: string, type = 'row') => ({ id, type })
const entriesFor = (items: ReturnType<typeof item>[]) => createVirtualListEntries(items, (row) => row.id, (row) => row.type)

describe('VirtualList physical cell ownership', () => {
	it('retains keyed hosts across prepend and recycles only compatible free hosts', () => {
		const items = [item('a'), item('b'), item('c', 'other')]
		const pool = new VirtualListCellPool<ReturnType<typeof item>>()
		const initial = pool.update(entriesFor(items))
		const a = initial.find((cell) => cell.entry?.key === 'a')!
		const b = initial.find((cell) => cell.entry?.key === 'b')!
		const c = initial.find((cell) => cell.entry?.key === 'c')!
		const next = pool.update(entriesFor([item('new'), items[1], items[2]]))
		expect(next.find((cell) => cell.entry?.key === 'new')!.id).toBe(a.id)
		expect(next.find((cell) => cell.entry?.key === 'b')!.id).toBe(b.id)
		expect(next.find((cell) => cell.entry?.key === 'c')!.id).toBe(c.id)
		expect(pool.isCurrent(a.id, a.entry!.rowKey, a.generation)).toBe(false)
		const prepended = pool.update(entriesFor([item('first'), item('new'), items[1], items[2]]))
		expect(prepended.find((cell) => cell.entry?.key === 'b')!.id).toBe(b.id)
	})

	it('does not recycle a host across types and bounds free hosts after repeated changes', () => {
		const pool = new VirtualListCellPool<ReturnType<typeof item>>()
		const original = pool.update(entriesFor([item('first', 'type0')]))[0]
		const different = pool.update(entriesFor([item('next', 'type1')])).find((cell) => cell.entry)!
		expect(different.id).not.toBe(original.id)
		for (let index = 2; index < 1000; index++) {
			const cells = pool.update(entriesFor([item(String(index), 'type' + index)]))
			expect(cells.length).toBeLessThanOrEqual(9)
		}
	})

	it('invalidates work on item replacement, emptying, restoration and disposal', () => {
		const pool = new VirtualListCellPool<ReturnType<typeof item>>()
		const first = pool.update(entriesFor([item('same')]))[0]
		const replacement = pool.update(entriesFor([item('same')]))[0]
		expect(replacement.id).toBe(first.id)
		expect(pool.isCurrent(first.id, first.entry!.rowKey, first.generation)).toBe(false)
		expect(pool.update([])).toEqual([])
		const restored = pool.update(entriesFor([item('same')]))[0]
		expect(restored.id).not.toBe(first.id)
		pool.clear()
		expect(pool.isCurrent(restored.id, restored.entry!.rowKey, restored.generation)).toBe(false)
	})
})
