import { describe, expect, it } from 'vitest'
import {
	createVirtualListEntries,
	estimateVirtualListSizes,
	virtualListRange,
	virtualListMeasurementKey,
	virtualListRowKey,
	VIRTUAL_LIST_ESTIMATED_ROW_SIZE,
	VirtualListSizeIndex,
} from './virtual-list-layout'

describe('VirtualList size index', () => {
	it('updates variable row heights and locates exact boundaries', () => {
		const sizes = new VirtualListSizeIndex()
		sizes.reset([36, 48, 60, 72])

		expect(sizes.prefix(3)).toBe(144)
		expect(sizes.indexAt(0)).toBe(0)
		expect(sizes.indexAt(36)).toBe(1)
		expect(sizes.indexAt(144)).toBe(3)
		expect(sizes.set(1, 80)).toBe(32)
		expect(sizes.total).toBe(248)
		expect(sizes.indexAt(100)).toBe(1)
	})

	it('keeps the mounted range bounded at both ends of a long list', () => {
		const sizes = new VirtualListSizeIndex()
		sizes.reset(Array.from({ length: 500 }, (_, index) => 36 + (index % 4) * 12))

		const top = virtualListRange(sizes, 0, 240)
		const middle = virtualListRange(sizes, sizes.prefix(200), 240)
		const bottom = virtualListRange(sizes, sizes.total, 240)

		expect(top.start).toBe(0)
		expect(top.end).toBeLessThan(20)
		expect(middle.start).toBeGreaterThan(190)
		expect(middle.start).toBeLessThan(200)
		expect(middle.end).toBeLessThan(220)
		expect(bottom.end).toBe(500)
		expect(bottom.start).toBeGreaterThan(480)
		expect(top.top).toBe(0)
		expect(bottom.bottom).toBe(0)
	})

	it('distinguishes key and item-type identities', () => {
		expect(virtualListRowKey('1', 'card')).not.toBe(virtualListRowKey(1, 'card'))
		expect(virtualListRowKey('1', 'card')).not.toBe(virtualListRowKey('1', 'ad'))
	})

	it('rejects duplicate item keys', () => {
		expect(() => createVirtualListEntries(
			[{ id: 'same' }, { id: 'same' }],
			(item) => item.id,
		)).toThrow('duplicate key')
	})

	it('uses a type estimate only after four rows are measured', () => {
		const entries = createVirtualListEntries(
			Array.from({ length: 5 }, (_, index) => ({ id: 'r' + index })),
			(item) => item.id,
			() => 'row',
		)

		const measurements = new Map(entries.slice(0, 3).map((entry, index) => [
			virtualListMeasurementKey(entry.rowKey, false),
			{ width: 100, height: 36 + index * 12 },
		]))

		expect(estimateVirtualListSizes(entries, false, 100, measurements)[3]).toBe(
			VIRTUAL_LIST_ESTIMATED_ROW_SIZE,
		)

		const fourth = entries[3]
		measurements.set(virtualListMeasurementKey(fourth.rowKey, false), {
			width: 100,
			height: 72,
		})

		expect(estimateVirtualListSizes(entries, false, 100, measurements)[4]).toBe(54)
	})
})
