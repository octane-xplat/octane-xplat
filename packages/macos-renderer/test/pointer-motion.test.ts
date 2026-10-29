import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAppKitPointerMotion, viewPoint } from '../src/pointer-motion.ts'

function fixture() {
	const added: any[] = [], removed: any[] = [], inits: any[] = []
	const native: any = {
		NSTrackingArea: { alloc: () => ({
			initWithRectOptionsOwnerUserInfo: (rect: any, options: number, owner: any, info: any) => {
				inits.push([rect, options, owner, info])
				return { id: inits.length }
			},
		}) },
		NSApplication: { sharedApplication: { currentEvent: null as any } },
	}
	const view: any = {
		flipped: true,
		bounds: { origin: { x: 2, y: 3 }, size: { width: 100, height: 50 } },
		window: {},
		addTrackingArea: (area: any) => added.push(area),
		removeTrackingArea: (area: any) => removed.push(area),
		convertPointFromView: (point: any, _from: any) => ({ x: point.x, y: point.y }),
	}
	const target = {}
	const motion = createAppKitPointerMotion(() => native)
	return { motion, native, view, target, added, removed, inits }
}

test('viewPoint converts window points into flipped and unflipped view space and rejects invalid input', () => {
	const view: any = {
		flipped: true,
		bounds: { origin: { x: 2, y: 3 }, size: { width: 100, height: 50 } },
		convertPointFromView: (point: any, _from: any) => ({ x: point.x, y: point.y }),
	}
	assert.deepEqual(viewPoint(view, { x: 10, y: 20 }), { x: 8, y: 17 })
	assert.deepEqual(viewPoint({ ...view, flipped: false }, { x: 10, y: 20 }), { x: 8, y: 33 })
	assert.equal(viewPoint(null, { x: 1, y: 1 }), null)
	assert.equal(viewPoint(view, null), null)
	assert.equal(viewPoint({ ...view, convertPointFromView: () => ({ x: NaN, y: 1 }) }, { x: 1, y: 1 }), null)
	assert.equal(viewPoint({ bounds: view.bounds }, { x: 1, y: 1 }), null)
})

test('observe installs a tracking area with the motion mask and dispatches converted enter/move/exit', () => {
	const f = fixture(), calls: any[] = []
	f.motion.observe(
		f.view,
		{ move: (x: number, y: number) => calls.push(['move', x, y]), exit: () => calls.push(['exit']) },
		f.target,
	)
	assert.equal(f.added.length, 1)
	assert.deepEqual(f.inits[0], [
		{ origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
		0x01 | 0x02 | 0x80 | 0x200,
		f.target,
		null,
	])
	const area = f.added[0]
	assert.equal(f.motion.dispatch(area, 'enter', { locationInWindow: { x: 5, y: 6 } }), true)
	assert.equal(f.motion.dispatch(area, 'move', { locationInWindow: { x: 7, y: 8 } }), true)
	assert.equal(f.motion.dispatch(area, 'exit', {}), true)
	assert.deepEqual(calls, [['move', 3, 3], ['move', 5, 5], ['exit']])
})

test('release removes the area, ends dispatch and is inert on a second call', () => {
	const f = fixture(), calls: any[] = []
	const off = f.motion.observe(f.view, { move: () => calls.push(1), exit: () => {} }, f.target)
	const area = f.added[0]
	off(); off()
	assert.deepEqual(f.removed, [area])
	assert.equal(f.motion.dispatch(area, 'move', { locationInWindow: { x: 1, y: 1 } }), false)
	assert.deepEqual(calls, [])
})

test('leases on one view stay independent', () => {
	const f = fixture(), calls: string[] = []
	const first = f.motion.observe(f.view, { move: () => calls.push('a'), exit: () => {} }, f.target)
	const second = f.motion.observe(f.view, { move: () => calls.push('b'), exit: () => {} }, f.target)
	assert.equal(f.added.length, 2)
	first()
	assert.equal(f.motion.dispatch(f.added[0], 'move', { locationInWindow: { x: 1, y: 1 } }), false)
	assert.equal(f.motion.dispatch(f.added[1], 'move', { locationInWindow: { x: 1, y: 1 } }), true)
	assert.deepEqual(calls, ['b'])
	second()
})

test('a throwing motion handler is contained and dispatch still reports the record', () => {
	const f = fixture(), errors: any[] = []
	const original = console.error
	console.error = (...args: any[]) => { errors.push(args) }
	try {
		f.motion.observe(f.view, { move: () => { throw new Error('boom') }, exit: () => {} }, f.target)
		assert.equal(f.motion.dispatch(f.added[0], 'move', { locationInWindow: { x: 1, y: 1 } }), true)
		assert.equal(errors.length, 1)
	} finally {
		console.error = original
	}
})

test('missing NSTrackingArea, target or a null area leaves nothing registered', () => {
	const missing = createAppKitPointerMotion(() => ({}))
	const calls: any[] = []
	assert.equal(missing.available({}), false)
	missing.observe({ addTrackingArea: () => calls.push(1) }, { move: () => {}, exit: () => {} }, {})
	assert.equal(calls.length, 0)
	const f = fixture()
	f.motion.observe(f.view, { move: () => calls.push(1), exit: () => {} }, null)
	assert.equal(f.added.length, 0)
	f.native.NSTrackingArea.alloc = () => ({ initWithRectOptionsOwnerUserInfo: () => null })
	const off = f.motion.observe(f.view, { move: () => calls.push(1), exit: () => {} }, f.target)
	assert.equal(f.added.length, 0)
	off()
})

test('locate returns the current mouse point only for mouse events in the view window', () => {
	const f = fixture()
	const app = f.native.NSApplication.sharedApplication
	assert.equal(f.motion.locate(f.view), null)
	app.currentEvent = { type: 2, window: f.view.window, locationInWindow: { x: 9, y: 9 } }
	assert.deepEqual(f.motion.locate(f.view), { x: 7, y: 6 })
	app.currentEvent = { type: 2, window: {}, locationInWindow: { x: 9, y: 9 } }
	assert.equal(f.motion.locate(f.view), null)
	app.currentEvent = { type: 10, window: f.view.window, locationInWindow: { x: 9, y: 9 } }
	assert.equal(f.motion.locate(f.view), null)
})
