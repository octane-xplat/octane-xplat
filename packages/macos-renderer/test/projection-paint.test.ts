import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	setProjectionScale,
	correctProjectionRadii,
	correctProjectionShadows,
} from '../src/projection-paint.ts'

test('temporary scale correction preserves renderer-owned paint and restores without drift', () => {
	const view = {},
		other = {}
	const radii = { topLeft: 20, topRight: 10, bottomLeft: 0, bottomRight: 5 }
	const shadows = [{ dx: 4, dy: 8, blur: 12, spread: 2, color: 'black' }]
	setProjectionScale(view, { x: 0.5, y: 0.5 })
	assert.equal(correctProjectionRadii(view, radii).topLeft, 40)
	assert.deepEqual(correctProjectionShadows(view, shadows), [
		{ dx: 8, dy: 16, blur: 24, spread: 4, color: 'black' },
	])
	assert.equal(correctProjectionRadii(other, radii), radii)
	setProjectionScale(view, { x: 2, y: 2 })
	assert.equal(correctProjectionRadii(view, radii).topLeft, 10)
	setProjectionScale(view, null)
	assert.equal(correctProjectionRadii(view, radii), radii)
	assert.equal(correctProjectionShadows(view, shadows), shadows)
})

test('percentage radii retain their proportional behavior alongside numeric corners', () => {
	const view = {}
	setProjectionScale(view, { x: 0.5, y: 0.5 })
	const corrected = correctProjectionRadii(
		view,
		{ topLeft: 20, topRight: 20 },
		{ topLeft: '20%', topRight: 20 },
	)
	assert.deepEqual(corrected, { topLeft: 20, topRight: 40 })
})
