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
