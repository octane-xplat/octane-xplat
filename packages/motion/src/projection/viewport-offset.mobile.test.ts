import { expect, it } from 'vitest'
import { captureViewportOffset as ios } from './viewport-offset.ios'
import { captureViewportOffset as android } from './viewport-offset.android'

it('retains live iOS scroll ancestors through detach', () => {
	const root = { bounds: { origin: { x: 0, y: 10 } } }
	const parent = { superview: root, bounds: { origin: { x: 0, y: 20 } } }
	const view = { nativeView: { superview: parent } as any }
	const offset = ios(view)
	view.nativeView.superview = null
	parent.bounds.origin.y = 50
	expect(offset().y).toBe(-60)
})

it('retains Android scroll ancestors and converts pixels to DIP', () => {
	let scroll = 20
	const parent = { getLeft: () => 0, getScrollY: () => scroll, getParent: () => null }
	const view = {
		nativeView: {
			getParent: () => parent,
			getResources: () => ({ getDisplayMetrics: () => ({ density: 2 }) }),
		},
	}
	const offset = android(view)
	scroll = 80
	expect(offset().y).toBe(-40)
})
