import { describe, expect, it } from 'vitest'
import { consumeInsets, resolveSafeAreaEdges } from './inset-consumption'

const MEASURED = { top: 24, right: 4, bottom: 34, left: 0 }
const NONE = { top: 0, right: 0, bottom: 0, left: 0 }

describe('safe-area edge resolution', () => {
	it('defaults to all edges and treats ignoreSafeArea as no edges', () => {
		expect(resolveSafeAreaEdges(undefined, undefined)).toEqual(['top', 'right', 'bottom', 'left'])
		expect(resolveSafeAreaEdges(undefined, true)).toEqual([])
		expect(resolveSafeAreaEdges(['top'], true)).toEqual(['top'])
	})
})

describe('inset consumption', () => {
	it('applies selected edges and records them as consumed for descendants', () => {
		const { applied, provided } = consumeInsets(MEASURED, NONE, ['top', 'bottom'])
		expect(applied).toEqual({ top: 24, right: 0, bottom: 34, left: 0 })
		expect(provided).toEqual({ top: 24, right: 0, bottom: 34, left: 0 })
	})

	it('consumes each edge once — a nested container pads only what remains', () => {
		const outer = consumeInsets(MEASURED, NONE, ['top', 'right', 'bottom', 'left'])
		const inner = consumeInsets(MEASURED, outer.provided, ['top', 'right', 'bottom', 'left'])
		expect(inner.applied).toEqual(NONE)
	})

	it('leaves unselected edges available to descendants', () => {
		const outer = consumeInsets(MEASURED, NONE, ['top'])
		const inner = consumeInsets(MEASURED, outer.provided, ['top', 'bottom'])
		expect(inner.applied).toEqual({ top: 0, right: 0, bottom: 34, left: 0 })
	})

	it('never double-applies beyond the measured inset', () => {
		const overConsumed = { top: 40, right: 0, bottom: 0, left: 0 }
		const { applied } = consumeInsets(MEASURED, overConsumed, ['top', 'bottom'])
		expect(applied.top).toBe(0)
		expect(applied.bottom).toBe(34)
	})
})
