import { describe, expect, it, vi } from 'vitest'
import { mergeProps } from './merge-props'
import { refList, mergedRef } from './ref-list'

describe('mergeProps', () => {
	it('chains event handlers in argument order', () => {
		const calls: string[] = []
		const merged = mergeProps(
			{ onClick: () => calls.push('a'), onFocus: () => calls.push('fa') },
			{ onClick: () => calls.push('b'), onBlur: () => calls.push('bl') },
		)

		merged.onClick()
		expect(calls).toEqual(['a', 'b'])
		merged.onFocus()
		merged.onBlur()
		expect(calls).toEqual(['a', 'b', 'fa', 'bl'])
	})

	it('concatenates className and merges style shallowly', () => {
		const merged = mergeProps(
			{ className: 'one', style: { color: 'red', margin: 4 } },
			{ className: 'two', style: { margin: 8, padding: 2 } },
		)

		expect(merged.className).toBe('one two')
		expect(merged.style).toEqual({ color: 'red', margin: 8, padding: 2 })
	})

	it('last non-function prop wins; undefined is skipped', () => {
		const merged = mergeProps({ role: 'grid', id: 'a' }, { role: 'list', id: undefined })
		expect(merged.role).toBe('list')
		expect(merged.id).toBe('a')
	})

	it('tolerates null/undefined bags', () => {
		expect(mergeProps(undefined, { id: 'x' }, null)).toEqual({ id: 'x' })
	})
})

describe('refList + mergedRef', () => {
	it('flattens nested refs and fans out assignments', () => {
		const callback = vi.fn()
		const object = { current: null as any }
		const list = refList(callback, [object], undefined)

		expect(list.length).toBe(2)

		const merged = mergedRef(callback, [object])

		;(merged as (i: any) => void)({ node: true })
		expect(callback).toHaveBeenCalledWith({ node: true })
		expect(object.current).toEqual({ node: true })
	})
})
