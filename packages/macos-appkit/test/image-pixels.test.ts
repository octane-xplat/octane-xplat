import { test } from 'node:test'
import assert from 'node:assert/strict'
import { imagePixelSize } from '../src/image-pixels.ts'
test('pixel metadata selects the largest positive representation independently of logical image size', () => {
	const image = { size: { width: 999, height: 999 }, representations: [{ pixelsWide: 16, pixelsHigh: 8 }, { pixelsWide: 64, pixelsHigh: 32 }, { pixelsWide: -1, pixelsHigh: -1 }] }
	assert.deepEqual(imagePixelSize(image), { width: 64, height: 32 })
})
test('native NSArray metadata and nonfinite/unsafe dimensions do not become invented pixels', () => {
	const reps = [{ pixelsWide: NaN, pixelsHigh: 20 }, { pixelsWide: Number.MAX_SAFE_INTEGER + 1, pixelsHigh: 2 }, { pixelsWide: 20, pixelsHigh: 10 }]
	assert.deepEqual(imagePixelSize({ representations: { count: reps.length, objectAtIndex: (index: number) => reps[index] } }), { width: 20, height: 10 })
})
test('unknown/vector metadata and failed native reads report zero without falling back to points', () => {
	const points = { size: { width: 64, height: 32 }, representations: undefined }
	assert.deepEqual(imagePixelSize(points), { width: 0, height: 0 })
	assert.deepEqual(imagePixelSize({ representations: [{ pixelsWide: -1, pixelsHigh: -1 }] }), { width: 0, height: 0 })
	assert.deepEqual(imagePixelSize({ get representations() { throw Error('metadata unavailable') } }), { width: 0, height: 0 })
})
