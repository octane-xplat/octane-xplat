import assert from 'node:assert/strict'
import test from 'node:test'
import {
	keyboardBottomOverlap,
	keyboardBottomDisplacement,
	keyboardAvoidancePadding,
} from '../src/keyboard-geometry.ts'

const rect = (x, y, width, height) => ({ x, y, width, height })

test('sticky movement can exceed control height while viewport overlap stays bounded', () => {
	const host = rect(0, 752, 400, 48),
		keyboard = rect(0, 500, 400, 300)
	assert.equal(keyboardBottomOverlap(host, keyboard), 48)
	assert.equal(keyboardBottomDisplacement(host, keyboard), 300)
	assert.equal(keyboardBottomDisplacement(rect(0, 100, 400, 48), keyboard), 0)
})

test('bottom overlap is relative to the host rather than the main screen', () => {
	const keyboard = rect(0, 500, 400, 300)
	assert.equal(keyboardBottomOverlap(rect(0, 0, 400, 800), keyboard), 300)
	assert.equal(keyboardBottomOverlap(rect(20, 100, 360, 600), keyboard), 200)
	assert.equal(keyboardBottomOverlap(rect(20, 100, 360, 400), keyboard), 0)
	assert.equal(keyboardBottomOverlap(rect(0, 0, 400, 400), rect(0, 200, 400, 200)), 200)
})

test('floating or narrow occlusions do not become full-width bottom padding', () => {
	const host = rect(0, 0, 400, 800)
	assert.equal(keyboardBottomOverlap(host, rect(100, 500, 200, 200)), 0)
	assert.equal(keyboardBottomOverlap(host, rect(100, 500, 200, 300)), 0)
	assert.equal(keyboardBottomOverlap(host, rect(0, 800, 400, 300)), 0)
	assert.equal(keyboardBottomOverlap(host, rect(0, 500, 400, 0)), 0)
	assert.equal(keyboardBottomOverlap(host, rect(0, NaN, 400, 300)), 0)
	assert.equal(keyboardBottomOverlap(null, rect(0, 500, 400, 300)), 0)
})

test('physical resizing and consumed safe-area/ancestor space are counted once', () => {
	const padding = (hostOverlap, extra = {}) =>
		keyboardAvoidancePadding({ windowInset: 300, hostOverlap, ...extra })
	assert.equal(padding(300, { consumedSafeArea: 34 }), 266)
	assert.equal(padding(266, { consumedSafeArea: 34 }), 266)
	assert.equal(padding(200, { consumedSafeArea: 34 }), 200)
	assert.equal(padding(300, { consumedSafeArea: 34, ancestorAvoidance: 266 }), 0)
	assert.equal(padding(0), 0)
	assert.equal(padding(0, { offset: 12 }), 12)
	assert.equal(padding(300, { offset: -20 }), 280)
	assert.equal(padding(10, { offset: -20 }), 0)
	assert.equal(keyboardAvoidancePadding({ windowInset: 0, hostOverlap: 300, offset: 12 }), 0)
})
