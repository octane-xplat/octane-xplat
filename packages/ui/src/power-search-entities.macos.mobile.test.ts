import { expect, it, vi } from 'vitest'
import type { EntityListOperatorValue, SearchableItem } from './props'
import { entitySelection, entityValue, resolveEntityEntries, splitEntityEntries } from './power-search-entities.macos'

const config = (search: (query: string, request?: { signal: AbortSignal }) => SearchableItem[] | Promise<SearchableItem[]>, extra: Partial<EntityListOperatorValue> = {}): EntityListOperatorValue => ({
	type: 'entity_list', searchSource: { search, bootstrap: () => [] }, tokenization: {}, ...extra,
})
const signal = () => new AbortController().signal
it('deduplicates stable identities while keeping custom row data and storing only public entity fields', () => {
	const row = { id: '1', label: 'A', photo: 'file:///avatar.png', auxiliaryData: { private: true }, element: 'custom row' }
	expect(entitySelection([row, { id: '1', label: 'Other' }, { id: '2', label: 'A' }])[0]).toBe(row)
	const invalidPhoto = { id: '2', label: 'A', photo: 42 }
	expect(entityValue([row, row, invalidPhoto])).toEqual([{ id: '1', label: 'A', photo: 'file:///avatar.png' }, { id: '2', label: 'A' }])
})
it('splits literal separators without capturing-group tokens, empty entries or infinite zero-width loops', () => {
	expect(splitEntityEntries(' B, A\nB\r\n ')).toEqual(['B', 'A'])
	expect(splitEntityEntries(' B; A; B ', '(;)', true)).toEqual(['A', 'B'])
	expect(splitEntityEntries('AB', '')).toEqual(['AB'])
	expect(() => splitEntityEntries('A', '[')).toThrow()
})
it('prefers exact ID then a unique exact case-sensitive label, retaining selection order', async () => {
	const search = vi.fn((q: string) => q === '2' ? [{ id: 'other', label: '2' }, { id: '2', label: 'Second' }] : [{ id: '3', label: 'Third' }])
	const selected = Object.freeze([{ id: '1', label: 'First' }])
	expect((await resolveEntityEntries('First, 2, Third, 2', config(search), selected, signal())).items).toEqual([...selected, { id: '2', label: 'Second' }, { id: '3', label: 'Third' }])
	expect(search.mock.calls.map(([query]) => query)).toEqual(['First', '2', 'Third'])
	expect(selected).toHaveLength(1)
})
it('never selects fuzzy matches or ambiguous labels, even when arbitrary strings are allowed', async () => {
	expect((await resolveEntityEntries('A', config(() => [{ id: '1', label: 'AA' }]), [], signal())).error).toBeTruthy()
	expect((await resolveEntityEntries('A', config(() => [{ id: '1', label: 'A' }, { id: '2', label: 'A' }], { isArbitraryStringAllowed: true }), [], signal())).error).toBeTruthy()
	expect((await resolveEntityEntries('a', config(() => [{ id: '1', label: 'A' }], { isArbitraryStringAllowed: true }), [], signal())).items).toEqual([{ id: 'a', label: 'a' }])
})
it('supports source-free arbitrary entries, token sorting and empty/error batches without partial drafts', async () => {
	expect((await resolveEntityEntries('B,A', { type: 'entity_list', isArbitraryStringAllowed: true, tokenization: { sort: true } }, [], signal())).items).toEqual([{ id: 'A', label: 'A' }, { id: 'B', label: 'B' }])
	const selected = [{ id: 'kept', label: 'Kept' }]
	expect((await resolveEntityEntries('A,Missing', config((q) => q === 'A' ? [{ id: 'a', label: 'A' }] : []), selected, signal())).items).toBeUndefined()
	expect(selected).toEqual([{ id: 'kept', label: 'Kept' }])
	expect((await resolveEntityEntries('', config(() => []), [], signal())).error).toBeTruthy()
})
it('validates separators before source calls and hides source exception text', async () => {
	const search = vi.fn(() => { throw Error('private server details') })
	expect((await resolveEntityEntries('A', config(search, { tokenization: { regex: '[' } }), [], signal())).error).toBeTruthy()
	expect(search).not.toHaveBeenCalled()
	const result = await resolveEntityEntries('A', config(search, { isArbitraryStringAllowed: true }), [], signal())
	expect(result.error).toBeTruthy(); expect(JSON.stringify(result)).not.toContain('private')
	expect(result.items).toBeUndefined()
})
it('uses fresh per-request signals and resolves serially, cancelling a source that ignores abort', async () => {
	let finish!: (items: SearchableItem[]) => void
	const requests: AbortSignal[] = []
	const search = vi.fn((q: string, request?: { signal: AbortSignal }) => {
		requests.push(request!.signal)
		return q === 'A' ? new Promise<SearchableItem[]>((resolve) => { finish = resolve }) : [{ id: 'b', label: 'B' }]
	})
	const controller = new AbortController(), task = resolveEntityEntries('A,B', config(search), [], controller.signal)
	expect(search).toHaveBeenCalledTimes(1)
	controller.abort(); expect(requests[0].aborted).toBe(true)
	finish([{ id: 'a', label: 'A' }]); expect(await task).toEqual({}); expect(search).toHaveBeenCalledTimes(1)
	const completed = await resolveEntityEntries('B,C', config((q, request) => { requests.push(request!.signal); return [{ id: q, label: q }] }), [], signal())
	expect(completed.items).toHaveLength(2); expect(requests[1]).not.toBe(requests[2])
})
