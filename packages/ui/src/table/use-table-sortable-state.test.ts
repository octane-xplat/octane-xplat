import { describe, expect, it, vi } from 'vitest'

describe('use-table-sortable-state', () => {
	it('imports and sorts without Intl (NativeScript JS engines lack it)', async () => {
		const saved = (globalThis as any).Intl
		vi.stubGlobal('Intl', undefined)
		vi.resetModules()
		try {
			const mod = await import('./use-table-sortable-state')
			const sorted = mod.sortTableData(
				[{ name: 'row10' }, { name: 'row2' }, { name: 'row1' }],
				[{ sortKey: 'name' as never, direction: 'ascending' as const }],
				undefined,
			)
			expect(sorted.map((r) => r.name)).toEqual(['row1', 'row2', 'row10'])
		} finally {
			vi.stubGlobal('Intl', saved)
			vi.resetModules()
		}
	})

	it('still uses the Intl collator when Intl exists', async () => {
		const { sortTableData } = await import('./use-table-sortable-state')
		const sorted = sortTableData(
			[{ name: 'row10' }, { name: 'row2' }, { name: 'row1' }],
			[{ sortKey: 'name' as never, direction: 'ascending' as const }],
			undefined,
		)
		expect(sorted.map((r) => r.name)).toEqual(['row1', 'row2', 'row10'])
	})
})
