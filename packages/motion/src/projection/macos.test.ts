import { describe, expect, it } from 'vitest'
import { measureNativeBox } from './measure.macos'

describe('AppKit content coordinates', () => {
	it('converts mixed flipped views and ignores scroll bounds origins', () => {
		const root = {
			bounds: { origin: { x: 0, y: 0 }, size: { width: 300, height: 400 } },
			isFlipped: () => false,
		}
		const parent = {
			superview: root,
			frame: { origin: { x: 10, y: 100 }, size: { width: 200, height: 200 } },
			bounds: { origin: { x: 0, y: 40 }, size: { width: 200, height: 200 } },
			isFlipped: true,
		}
		const child = {
			superview: parent,
			frame: { origin: { x: 20, y: 30 }, size: { width: 50, height: 60 } },
			bounds: { size: { width: 50, height: 60 } },
		}
		expect(measureNativeBox(child)).toEqual({ x: { min: 30, max: 80 }, y: { min: 130, max: 190 } })
		expect(measureNativeBox(child, true)).toEqual({
			x: { min: 30, max: 80 },
			y: { min: 90, max: 150 },
		})
		expect(measureNativeBox(root)).toBeNull()
	})
})

it('retains AppKit scroll offsets through detach and respects flipped coordinates', async () => {
	const { captureViewportOffset } = await import('./viewport-offset.macos')
	const parent = { isFlipped: true, bounds: { origin: { x: 10, y: 20 } } }
	const child: any = { superview: parent }
	const offset = captureViewportOffset(child)
	child.superview = null
	parent.bounds.origin.y = 50
	expect(offset()).toEqual({ x: -10, y: -50 })
})
