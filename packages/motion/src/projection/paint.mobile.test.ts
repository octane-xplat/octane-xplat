import { expect, it } from 'vitest'
import { correctNativePaint } from './paint'
import { createDelta } from './geometry'

it('corrects native length units and every shadow without changing source styles', () => {
	const delta = createDelta()
	delta.x.scale = delta.y.scale = 0.5
	const style = {
		borderTopLeftRadius: 20,
		borderTopRightRadius: { unit: 'dip', value: 10 },
		borderBottomLeftRadius: { unit: '%', value: 0.25 },
		boxShadow: [
			{ offsetX: 2, offsetY: 4, blurRadius: 6, spreadRadius: 8, color: 'black', inset: false },
		],
	}
	const result = correctNativePaint(style, { delta, treeScale: { x: 1, y: 1 }, latest: {} })
	expect(result.borderTopLeftRadius).toBe(40)
	expect(result.borderTopRightRadius).toEqual({ unit: 'dip', value: 20 })
	expect(result.borderBottomLeftRadius).toEqual(style.borderBottomLeftRadius)
	expect(result.boxShadow[0]).toMatchObject({
		offsetX: 4,
		offsetY: 8,
		blurRadius: 12,
		spreadRadius: 16,
	})
	expect(style.borderTopLeftRadius).toBe(20)
	expect(style.boxShadow[0].blurRadius).toBe(6)
})

it('keeps proportional radii and unexpanded CSS expressions intact', () => {
	const write = { delta: createDelta(), treeScale: { x: 2, y: 2 }, latest: {} }
	expect(correctNativePaint({ borderRadius: '20% / 30%' }, write).borderRadius).toBe('20% / 30%')
	expect(
		correctNativePaint({ borderRadius: 'var(--radius20)' }, write).borderRadius,
	).toBeUndefined()
})
