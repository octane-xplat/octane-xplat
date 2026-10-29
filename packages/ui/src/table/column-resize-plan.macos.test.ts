import { describe, expect, it, vi } from 'vitest'
import { createAppKitColumnResizePlugin } from './column-resize-plan.macos'
import { planTableRender } from './pipeline'
import { pixel, proportional } from './column-utils'
import { resolveStickySide } from './sticky-column-offsets'
import type { TableColumn } from '../props'
import type { TablePlugin } from './types'
import type { UseTableColumnResizeConfig } from './use-table-column-resize.tsrx'
type Person = { name: string; team: string; status: string }
const data: Person[] = [{ name: 'Ada', team: 'Platform', status: 'Active' }]
const source = (): TableColumn<Person>[] => [
	{ key: 'name', width: pixel(180), resizable: false },
	{ key: 'team', width: proportional(2, { minWidth: 240 }) },
	{ key: 'status', width: pixel(140) },
]
const plan = (columns: TableColumn<Person>[], plugins: TablePlugin<Person>[]) => planTableRender({ data, columns, plugins, textOverflow: 'wrap' })
describe('AppKit controlled table width plan', () => {
	it('header, body and scroll minimum share the same overridden columns', () => {
		const resize = createAppKitColumnResizePlugin<Person>(() => ({ columnWidths: { name: 300, team: 420 } }))
		const result = plan(source(), [resize])
		expect(result.tableMinWidth).toBe(860)
		expect(result.headerCells[0]!.widthStyle).toEqual({ width: '300px', minWidth: '300px' })
		for (let i = 0; i < result.columns.length; i++) {
			expect(result.headerCells[i]!.column).toBe(result.columns[i])
			expect(result.rows[0]!.cells[i]!.column).toBe(result.columns[i])
		}
		expect(result.columns[0]!.resizable).toBe(false) // Locking gestures does not block controlled values.
	})
	it('reads current config, supports zero/removal and does not mutate frozen caller columns or echo callbacks', () => {
		let calls = 0, config: UseTableColumnResizeConfig = { columnWidths: { name: 0 }, onColumnResizeEnd: () => calls++ }
		const columns = source(), resize = createAppKitColumnResizePlugin<Person>(() => config)
		for (const column of columns) Object.freeze(column)
		Object.freeze(columns)
		expect(plan(columns, [resize]).columns[0]!.width).toEqual(pixel(0))
		config = { ...config, columnWidths: { name: 500 } }
		expect(plan(columns, [resize]).tableMinWidth).toBe(880)
		config = { ...config, columnWidths: {} }
		expect(plan(columns, [resize]).columns).toBe(columns)
		expect(columns[0]!.width).toEqual(pixel(180))
		expect(calls).toBe(0)
	})
	it('composes after reordered/synthetic columns and supplies current widths to offset resolution', () => {
		const reorder: TablePlugin<Person> = { transformColumns: (columns) => [{ key: 'gutter', width: pixel(40) }, ...columns.slice().reverse()] }
		const resize = createAppKitColumnResizePlugin<Person>(() => ({ columnWidths: { name: 320, gutter: 60 } }))
		const result = plan(source(), [reorder, resize])
		expect(result.columns.map((column) => column.key)).toEqual(['gutter', 'status', 'team', 'name'])
		expect(result.tableMinWidth).toBe(760)
		expect(resolveStickySide(result.columns, 'team', ['team'], [])).toEqual({ edge: 'start', offset: 200 })
	})
	it('ignores inherited dictionary values and widths for currently absent columns', () => {
		const columns: TableColumn<Person>[] = [{ key: 'toString', width: pixel(100) }]
		const inherited = Object.create({ toString: 400 }) as Record<string, number>
		inherited.absent = Number.NaN
		const resize = createAppKitColumnResizePlugin<Person>(() => ({ columnWidths: inherited }))
		expect(plan(columns, [resize]).columns).toBe(columns)
	})
	it('rejects invalid visible widths and lets the pipeline isolate the failed transform without partial mutation', () => {
		const columns = source(), errors = vi.spyOn(console, 'error').mockImplementation(() => {})
		try {
			for (const value of [-1, Infinity, Number.NaN]) {
				const resize = createAppKitColumnResizePlugin<Person>(() => ({ columnWidths: { name: 500, team: value } }))
				expect(() => resize.transformColumns!(columns)).toThrow(/finite nonnegative/)
				const result = plan(columns, [resize])
				expect(result.columns).toBe(columns)
				expect(result.tableMinWidth).toBe(560)
			}
			expect(errors).toHaveBeenCalledTimes(3)
		} finally { errors.mockRestore() }
	})
})
