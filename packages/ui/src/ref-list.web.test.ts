import { describe, expect, it, vi } from 'vitest'
import { mergedRef, refList } from './ref-list'

describe('composed refs', () => {
	it('preserves array refs through successive wrappers', () => {
		const inner = vi.fn()
		const outer = vi.fn()
		const objectRef = { current: null }
		expect(refList(outer, refList(inner, [objectRef]), undefined)).toEqual([
			outer, inner, objectRef,
		])
	})

	it('attaches and detaches every callback and object ref', () => {
		const callback = vi.fn()
		const objectRef = { current: null as { id: string } | null }
		const ref = mergedRef<{ id: string }>([callback, objectRef])
		const element = { id: 'host' }
		if (typeof ref !== 'function') throw new Error('Expected a callback ref')
		ref(element)
		expect(callback).toHaveBeenLastCalledWith(element)
		expect(objectRef.current).toBe(element)
		ref(null)
		expect(callback).toHaveBeenLastCalledWith(null)
		expect(objectRef.current).toBeNull()
	})
})
