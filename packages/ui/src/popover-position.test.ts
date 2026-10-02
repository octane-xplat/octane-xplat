import { describe, expect, it } from 'vitest'
import { layerOffset, positionPopover, resolveLayerSide } from './popover-position'

describe('positionPopover alignment', () => {
	const viewport = { left: 0, top: 0, width: 800, height: 600 }
	const anchor = { left: 100, top: 100, width: 200, height: 40 }
	const panel = { width: 100, height: 80 }
	it('aligns panel start, center, and end along the anchor edge', () => {
		expect(positionPopover(anchor, panel, viewport, 'bottom', 8, 'start').left).toBe(100)
		expect(positionPopover(anchor, panel, viewport, 'bottom', 8, 'center').left).toBe(150)
		expect(positionPopover(anchor, panel, viewport, 'bottom', 8, 'end').left).toBe(200)
	})
})

describe('resolveLayerSide', () => {
	it('maps logical placements to physical sides', () => {
		expect(resolveLayerSide('above')).toBe('top')
		expect(resolveLayerSide('below')).toBe('bottom')
		expect(resolveLayerSide('start')).toBe('left')
		expect(resolveLayerSide('end')).toBe('right')
	})

	it('mirrors inline sides under RTL', () => {
		expect(resolveLayerSide('start', true)).toBe('right')
		expect(resolveLayerSide('end', true)).toBe('left')
		expect(resolveLayerSide('above', true)).toBe('top')
	})

	it('passes physical sides through and defaults to top', () => {
		expect(resolveLayerSide('left')).toBe('left')
		expect(resolveLayerSide('bottom')).toBe('bottom')
		expect(resolveLayerSide(undefined)).toBe('top')
	})
})

describe('layerOffset', () => {
	it('defaults to flush and parses CSS lengths', () => {
		expect(layerOffset(undefined)).toBe(0)
		expect(layerOffset(12)).toBe(12)
		expect(layerOffset('8px')).toBe(8)
		expect(layerOffset('nonsense')).toBe(0)
	})
})
