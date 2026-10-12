import { describe, expect, it } from 'vitest'
import { gridListPress, isGridListKeySelected, normalizeSelection } from './grid-list-selection'

const keys = ['a', 'b', 'c', 'd', 'e', 'f']

const press = (over: Partial<Parameters<typeof gridListPress>[0]> = {}) =>
	gridListPress({
		selection: new Set(),
		key: 'a',
		index: 0,
		anchorIndex: null,
		keys,
		selectionMode: 'multiple',
		selectionBehavior: 'toggle',
		...over,
	})

describe('normalizeSelection', () => {
	it("keeps 'all', copies iterables, defaults empty", () => {
		expect(normalizeSelection('all')).toBe('all')
		expect(normalizeSelection(['a', 'b'])).toEqual(new Set(['a', 'b']))
		expect(normalizeSelection(undefined)).toEqual(new Set())
	})
})

describe('isGridListKeySelected', () => {
	it("reads 'all' and Set membership", () => {
		expect(isGridListKeySelected('all', 'a')).toBe(true)
		expect(isGridListKeySelected(new Set(['a']), 'a')).toBe(true)
		expect(isGridListKeySelected(new Set(['a']), 'b')).toBe(false)
	})
})

describe('gridListPress', () => {
	it('toggles membership in multiple mode', () => {
		expect(press({ selection: new Set(['a']) }).selection).toEqual(new Set())
		expect(press({ selection: new Set(['b']) }).selection).toEqual(new Set(['a', 'b']))
	})

	it('replaces selection under replace behavior', () => {
		expect(
			press({ selection: new Set(['b', 'c']), selectionBehavior: 'replace' }).selection,
		).toEqual(new Set(['a']))
	})

	it('toggles membership in single mode', () => {
		expect(press({ selectionMode: 'single' }).selection).toEqual(new Set(['a']))
		expect(press({ selectionMode: 'single', selection: new Set(['a']) }).selection).toEqual(
			new Set(),
		)
	})

	it("materializes 'all' over item keys on mutation", () => {
		expect(press({ selection: 'all' }).selection).toEqual(
			new Set(['b', 'c', 'd', 'e', 'f']),
		)
	})

	it('extends a range from the anchor on shift+press', () => {
		const result = press({
			key: 'd',
			index: 3,
			anchorIndex: 0,
			shiftKey: true,
			selection: new Set(['a']),
		})

		expect(result.selection).toEqual(new Set(['a', 'b', 'c', 'd']))
		expect(result.anchorIndex).toBe(0)
	})

	it('replaces with the range under replace + shift', () => {
		const result = press({
			key: 'd',
			index: 3,
			anchorIndex: 0,
			shiftKey: true,
			selectionBehavior: 'replace',
			selection: new Set(['f']),
		})

		expect(result.selection).toEqual(new Set(['a', 'b', 'c', 'd']))
	})

	it('keeps the last selected key under disallowEmptySelection', () => {
		expect(
			press({ selection: new Set(['a']), disallowEmptySelection: true }).selection,
		).toEqual(new Set(['a']))
	})
})
