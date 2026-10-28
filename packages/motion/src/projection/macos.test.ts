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
		expect(measureNativeBox(root)).toBeNull()
	})
})
