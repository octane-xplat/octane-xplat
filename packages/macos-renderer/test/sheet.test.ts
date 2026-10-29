import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createNativeSheet } from '../src/sheet.macos.ts'

// Native resource/controller model. Does not exercise AppKit or the ObjC ABI.
function fixture(attached = true) {
	const events: string[] = [], observers: any[] = [], windows: any[] = []
	let changed = () => {}, fit: any = { width: 500, height: 230 }, fail = '', completed = () => {}
	const parent: any = {
		beginSheetCompletionHandler(window: any, callback: () => void) { events.push('begin'); completed = callback; if (fail === 'begin') throw Error('private detail') },
		endSheet() { events.push('end'); completed() },
	}
	const view: any = { window: attached ? parent : null }, content = {}
	const handle = createNativeSheet(view, { onDismissed: () => events.push('dismissed'), onUnavailable: () => events.push('unavailable') }, {
		makeContent: () => content,
		makeWindow(target, size, cancel) {
			if (fail === 'make') throw Error('private detail')
			const window = { target, size, cancel, attachedSheet: null as any, contentViewController: {}, orderOut() { events.push('out') }, close() { events.push('close'); notify(window) } }
			windows.push(window); return window
		},
		releaseWindow: () => events.push('release'),
		watchWindow(_view, callback) { changed = callback; return () => { events.push('unwatch') } },
		observeClose(window, callback) {
			if (fail === 'observe' && window !== parent) throw Error('private detail')
			const entry = { window, callback, active: true }; observers.push(entry)
			return () => { entry.active = false; events.push('unobserve') }
		},
		fittingSize: () => fit,
	})!
	function notify(window: any) { for (const o of observers) if (o.active && o.window === window) o.callback() }
	return { handle, view, parent, content, windows, events, observers, notify,
		changed: () => changed(), complete: () => completed(), fit: (next: any) => { fit = next }, fail: (next: string) => { fail = next } }
}

test('prepares without showing; waits for real anchor attachment, never creates a floating window', () => {
	const f = fixture(false); assert.equal(f.handle.target, f.content); assert.equal(f.windows.length, 0)
	assert.equal(f.handle.present(), true); assert.equal(f.handle.presented, false); assert.equal(f.windows.length, 0)
	f.view.window = f.parent; f.changed(); assert.equal(f.handle.presented, true)
	assert.deepEqual(f.windows[0].size, { width: 500, height: 230 }); f.handle.present(); f.changed()
	assert.equal(f.windows.length, 1); f.handle.close(); assert.ok(!f.events.includes('dismissed'))
})
test('explicit close cancels an accepted/queued sheet exactly once and releases observers first', () => {
	const f = fixture(); f.handle.present(); f.handle.close(); f.handle.close(); f.complete()
	assert.equal(f.events.filter((e) => e === 'begin').length, 1); assert.equal(f.events.filter((e) => e === 'end').length, 1)
	assert.equal(f.events.filter((e) => e === 'release').length, 1); assert.ok(f.events.indexOf('unwatch') < f.events.indexOf('end'))
	assert.ok(f.observers.every((o) => !o.active)); assert.equal(f.windows[0].contentViewController, null)
	assert.ok(!f.events.includes('dismissed')); assert.equal(f.handle.present(), false)
})
test('native completion dismisses once without a second endSheet call', () => {
	const f = fixture(); f.handle.present(); f.complete(); f.complete(); f.handle.close()
	assert.equal(f.events.filter((e) => e === 'dismissed').length, 1); assert.ok(!f.events.includes('end'))
	assert.ok(f.observers.every((o) => !o.active))
})
test('native cancel respects a child sheet; native close then cancels the parent session once', () => {
	const f = fixture(); f.handle.present(); const sheet = f.windows[0]
	sheet.attachedSheet = {}; sheet.cancel(); assert.ok(!f.events.includes('dismissed'))
	sheet.attachedSheet = null; sheet.cancel(); f.notify(sheet); f.complete()
	assert.equal(f.events.filter((e) => e === 'dismissed').length, 1); assert.equal(f.events.filter((e) => e === 'end').length, 1)
	const closing = fixture(); closing.handle.present(); closing.notify(closing.windows[0]); closing.complete()
	assert.equal(closing.events.filter((e) => e === 'dismissed').length, 1)
	assert.ok(!closing.events.includes('close')); assert.ok(!closing.events.includes('out')) // Do not recursively close from willClose.
})
test('parent close or anchor retarget ends only the owned session, never reparents it', () => {
	for (const mode of ['close', 'detach', 'retarget']) {
		const f = fixture(); f.handle.present()
		if (mode === 'close') f.notify(f.parent)
		else { f.view.window = mode === 'detach' ? null : {}; f.changed() }
		f.complete(); assert.equal(f.events.filter((e) => e === 'dismissed').length, 1)
		assert.equal(f.windows.length, 1); assert.equal(f.handle.present(), false)
	}
})
test('closing while awaiting a parent prevents later presentation or callbacks', () => {
	const f = fixture(false); f.handle.present(); f.handle.close(); f.view.window = f.parent; f.changed()
	assert.equal(f.windows.length, 0); assert.deepEqual(f.events, ['unwatch'])
})
test('construction, observation and begin failures clean partial resources and report unavailable', () => {
	for (const mode of ['make', 'observe', 'begin']) {
		const f = fixture(); f.fail(mode); assert.equal(f.handle.present(), false); f.complete(); f.handle.close()
		assert.ok(f.observers.every((o) => !o.active)); assert.equal(f.events.filter((e) => e === 'unavailable').length, 1)
		assert.ok(!f.events.includes('dismissed')); if (f.windows[0]) assert.equal(f.windows[0].contentViewController, null)
	}
})
test('invalid measurements use finite native minima; unsupported parents fail without a window', () => {
	const f = fixture(); f.fit({ width: NaN, height: Infinity }); f.handle.present()
	assert.deepEqual(f.windows[0].size, { width: 360, height: 160 }); f.handle.close()
	const other = fixture(); other.view.window = {}; assert.equal(other.handle.present(), false)
	assert.equal(other.windows.length, 0); assert.ok(other.events.includes('unavailable'))
})
