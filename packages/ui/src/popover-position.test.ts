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
		expect(() => layerOffset('nonsense')).toThrow(TypeError)
		expect(() => layerOffset('2rem')).toThrow(TypeError)
	})
})

describe('layer logical geometry', () => {
	it('mirrors horizontal alignment without reversing vertical alignment', async () => {
		const { resolveLayerAlignment, nativeLayerRTL } = await import('./popover-position')
		expect(resolveLayerAlignment('start', 'bottom', true)).toBe('end')
		expect(resolveLayerAlignment('end', 'top', true)).toBe('start')
		expect(resolveLayerAlignment('start', 'right', true)).toBe('start')
		expect(nativeLayerRTL({ android: { getLayoutDirection: () => 1 } })).toBe(true)
		expect(nativeLayerRTL({ ios: { effectiveUserInterfaceLayoutDirection: 1 } })).toBe(true)
		expect(nativeLayerRTL({ parent: { style: { direction: 'rtl' } } })).toBe(true)
	})

	it('preserves offset when flipping and clamps oversized surfaces', () => {
		const viewport = { left: 0, top: 0, width: 400, height: 300 }
		const anchor = { left: 120, top: 250, width: 80, height: 30 }
		expect(
			positionPopover(anchor, { width: 60, height: 80 }, viewport, 'bottom', 12, 'end'),
		).toEqual({ left: 140, top: 158, placement: 'top' })

		expect(positionPopover(anchor, { width: 500, height: 400 }, viewport, 'bottom', 12).left).toBe(
			0,
		)
	})
})
