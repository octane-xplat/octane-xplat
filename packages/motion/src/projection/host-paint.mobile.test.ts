import { expect, it } from 'vitest'
import { attachHost } from '../host'
import { createDelta } from './geometry'

it('corrects Mason native paint strings without replacing Core stylesheet state', () => {
	const authored = { borderRadius: 20, borderTopLeftRadius: 0, boxShadow: '0px 4px 12px 0px black' }
	const paint = { borderRadius: '20', boxShadow: authored.boxShadow }
	const view = {
		opacity: 1,
		translateX: 0,
		translateY: 0,
		scaleX: 1,
		scaleY: 1,
		rotate: 0,
		style: authored,
		_styleHelper: paint,
	}
	const host = attachHost(view)
	const delta = createDelta()
	delta.x.scale = delta.y.scale = 0.5
	const write = { delta, treeScale: { x: 1, y: 1 }, latest: {} }
	host.project!(write)
	expect(paint.borderRadius).toBe('40')
	expect(paint.boxShadow).toContain('8px 24px')
	expect(authored.borderRadius).toBe(20)
	expect(authored.borderTopLeftRadius).toBe(0)
	paint.borderRadius = '30'
	host.project!(write)
	expect(paint.borderRadius).toBe('60')
	host.project!(null)
	expect(paint.borderRadius).toBe('30')
	expect(paint.boxShadow).toBe(authored.boxShadow)
})

it('preserves the intentional user scale of native paint while compensating layout scale', () => {
	const paint = { borderRadius: '20', boxShadow: '0px 4px 12px 0px black' }
	const view = {
		opacity: 1,
		translateX: 0,
		translateY: 0,
		scaleX: 1,
		scaleY: 1,
		rotate: 0,
		style: {},
		_styleHelper: paint,
	}
	// Attach before the user channel takes ownership; existing transforms remain rejected.
	const host = attachHost(view)
	const layoutDelta = createDelta(),
		delta = createDelta()
	layoutDelta.x.scale = layoutDelta.y.scale = 0.5
	host.project!({ delta, layoutDelta, treeScale: { x: 1, y: 1 }, latest: { scale: 2 } })
	expect(view.scaleX).toBe(1)
	expect(Number(paint.borderRadius) * view.scaleX).toBe(40)
	expect(paint.boxShadow).toContain('24px')
	host.project!(null)
	expect(view.scaleX).toBe(2)
	expect(paint.boxShadow).toContain('12px')
	expect(Number(paint.borderRadius) * view.scaleX).toBe(40)
})
