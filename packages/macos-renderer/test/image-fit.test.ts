import { test } from 'node:test'
import assert from 'node:assert/strict'
import { imageContentRect, parseImagePosition } from '../src/image-fit.ts'

const center = parseImagePosition('center')!
test('AppKit image fit rectangles retain aspect ratio, cover/crop, contain, fill, none and scale-down', () => {
	assert.deepEqual(imageContentRect('cover', center, 400, 300, 200, 100), { x: -100, y: 0, width: 600, height: 300 })
	assert.deepEqual(imageContentRect('contain', center, 400, 300, 200, 100), { x: 0, y: 50, width: 400, height: 200 })
	assert.deepEqual(imageContentRect('fill', center, 400, 300, 200, 100), { x: 0, y: 0, width: 400, height: 300 })
	assert.deepEqual(imageContentRect('none', center, 400, 300, 200, 100), { x: 100, y: 100, width: 200, height: 100 })
	assert.deepEqual(imageContentRect('scale-down', center, 400, 300, 200, 100), { x: 100, y: 100, width: 200, height: 100 })
	assert.deepEqual(imageContentRect('scale-down', center, 400, 300, 800, 600), { x: 0, y: 0, width: 400, height: 300 })
})

test('image position percentages use free space, including negative crop space; edge lengths use points', () => {
	assert.deepEqual(imageContentRect('cover', parseImagePosition('top 50% right 25%')!, 400, 300, 200, 100),
		{ x: -150, y: 0, width: 600, height: 300 })
	assert.deepEqual(imageContentRect('contain', parseImagePosition('bottom 10px right 20px')!, 400, 300, 200, 100),
		{ x: -20, y: 90, width: 400, height: 200 })
	assert.deepEqual(imageContentRect('none', parseImagePosition('25% 70%')!, 400, 300, 200, 100),
		{ x: 50, y: 140, width: 200, height: 100 })
	assert.deepEqual(imageContentRect('none', parseImagePosition('left -10px top 120%')!, 400, 300, 200, 100),
		{ x: -10, y: 240, width: 200, height: 100 })
})

test('all public keyword positions and shared edge-offset strings parse without CSS/DOM dependencies', () => {
	for (const value of ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top center', 'top right',
		'right top', 'right center', 'right bottom', 'bottom left', 'bottom center', 'bottom right', 'left top', 'left center', 'left bottom',
		'top 50% left 50%', 'bottom 10px right 25%', 'top 0px left 10px']) {assert.ok(parseImagePosition(value), value)}
	assert.deepEqual(parseImagePosition(10), parseImagePosition('10px'))
	assert.deepEqual(parseImagePosition('top left'), parseImagePosition('left top'))
	assert.deepEqual(parseImagePosition('center right'), parseImagePosition('right center'))
	assert.deepEqual(parseImagePosition('top 10px left 0px'), parseImagePosition('left 0px top 10px'))
	for (const value of ['calc(50% + 1px) 0', '1em 2em', 'diagonal', 'left right top', '10% 20% 30%', 'top Infinitypx left 0px', 'top 10px', '10px right', 'left 10px top', 'center left 10px', '10 20']) {
		assert.equal(parseImagePosition(value), null, value)
	}
})

test('zero, invalid and overflowing geometry never reaches native drawing', () => {
	for (const value of [0, -1, NaN, Infinity]) {
		assert.equal(imageContentRect('cover', center, value, 100, 20, 20), null)
		assert.equal(imageContentRect('cover', center, 100, 100, value, 20), null)
	}
	assert.equal(imageContentRect('cover', center, 1e308, 100, 1e-308, 20), null)
})
