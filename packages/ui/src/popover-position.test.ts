import { describe, expect, it } from 'vitest'
import { positionPopover } from './popover-position'

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
