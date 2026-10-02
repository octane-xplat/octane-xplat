import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
// Execute the installed, patched Windows implementation without booting WinRT.
const appRequire = createRequire(new URL('../apps/windows/package.json', import.meta.url))
const gestureFile = appRequire.resolve('@nativescript/core/ui/gestures/index.windows.js')
const pointerFile = appRequire.resolve('@nativescript/core/ui/gestures/pointer-events.windows.js')
const pointerSource = readFileSync(pointerFile, 'utf8').replace(/^export /gm, '')
const subscribeNativeEvent = vm.runInNewContext(pointerSource + '\nsubscribeNativeEvent;')
const types = { tap: 1, doubleTap: 2, longPress: 64, touch: 128 }
function setup() {
	const timers = new Map()
	let nextTimer = 0
	class Base {
		constructor(target, callback, context) {
			Object.assign(this, { target, callback, context })
		}
		disconnect() {
			this.callback = null
			this.target = null
		}
	}

	const native = {
		AddHandler() {
			throw new Error('E_NOINTERFACE')
		},
		RemoveHandler() {
			throw new Error('E_NOINTERFACE')
		},
	}

	const events = new Map()
	const notified = []
	const observers = []
	const target = {
		nativeViewProtected: native,
		isLoaded: true,
		isEnabled: true,
		on(name, callback) {
			const list = events.get(name) || []
			list.push(callback)
			events.set(name, list)
		},
		off(name, callback) {
			events.set(
				name,
				(events.get(name) || []).filter((c) => c !== callback),
			)
		},
		notify(args) {
			notified.push(args.eventName)
		},
		getGestureObservers(type) {
			return observers.filter((o) => o.type === type)
		},
		_addVisualState() {},
		_removeVisualState() {},
	}

	const source = readFileSync(gestureFile, 'utf8')
	const code = source
		.replace(/^export \*.*$/gm, '')
		.replace(/^import .*$/gm, '')
		.replace(/export /g, '')

	const context = vm.createContext({
		GesturesObserverBase: Base,
		GestureTypes: types,
		GestureEvents: { gestureAttached: 'attached' },
		GestureStateTypes: { began: 1, ended: 3 },
		toString: (t) => String(t),
		timer: {
			setTimeout(fn) {
				const id = ++nextTimer
				timers.set(id, () => {
					timers.delete(id)
					fn()
				})

				return id
			},
			clearTimeout(id) {
				timers.delete(id)
			},
		},
		Microsoft: { UI: { Xaml: { UIElement: {} } } },
		NSWinRT: { asDelegate: (name, fn) => fn },
		subscribeNativeEvent,
		Date,
		console,
	})

	vm.runInContext(
		code + '\nglobalThis.Observer=GesturesObserver;globalThis.hovered=isHovered;',
		context,
	)

	const add = (type, callback) => {
		const observer = new context.Observer(target, callback)
		observers.push(observer)
		observer.observe(type)
		return observer
	}

	const emit = (name, x = 0) => {
		native[name]?.(native, {
			Pointer: { PointerId: 1 },
			Timestamp: name === 'PointerReleased' ? 110000 : 100000,
			GetCurrentPoint: () => ({ Position: { X: x, Y: 0 } }),
		})
	}

	const lifecycle = (name) => (events.get(name) || []).slice().forEach((fn) => fn())
	return {
		native,
		target,
		timers,
		notified,
		add,
		emit,
		lifecycle,
		hovered: () => context.hovered(target),
	}
}

test('tap and touch coexist; disconnect and reload retain independent ownership', () => {
	const s = setup()
	const calls = []
	const tap = s.add(types.tap, () => calls.push('tap'))
	const touch = s.add(types.touch, (args) => calls.push(args.action))
	s.emit('PointerPressed')
	s.emit('PointerReleased')
	assert.deepEqual(calls, ['down', 'tap', 'up'])
	touch.disconnect()
	calls.length = 0
	s.emit('PointerPressed')
	s.emit('PointerReleased')
	assert.deepEqual(calls, ['tap'])
	s.lifecycle('unloaded')
	assert.equal(s.native.PointerPressed, null)
	s.lifecycle('loaded')
	calls.length = 0
	s.emit('PointerPressed')
	s.emit('PointerReleased')
	assert.deepEqual(calls, ['tap'])
	tap.disconnect()
})

test('hover persists while one observer remains and clears on final unload', () => {
	const s = setup()
	const tap = s.add(types.tap, () => {})
	const touch = s.add(types.touch, () => {})
	s.emit('PointerEntered')
	assert.equal(s.hovered(), true)
	tap.disconnect()
	assert.equal(s.hovered(), true)
	s.emit('PointerExited')
	assert.equal(s.hovered(), false)
	s.emit('PointerEntered')
	touch.disconnect()
	assert.equal(s.hovered(), false)
	assert.equal(s.native.PointerEntered, null)
	assert.deepEqual(
		s.notified.filter((n) => n.startsWith('mouse')),
		['mouseEnter', 'mouseLeave', 'mouseEnter', 'mouseLeave'],
	)
})

test('cancel and capture loss prevent a tap and cancel pending long press', () => {
	for (const event of ['PointerCanceled', 'PointerCaptureLost']) {
		const s = setup()
		const calls = []
		s.add(types.tap, () => calls.push('tap'))
		s.add(types.longPress, () => calls.push('long'))
		s.add(types.touch, (args) => calls.push(args.action))
		s.emit('PointerPressed')
		assert.equal(s.timers.size, 1)
		s.emit(event)
		assert.equal(s.timers.size, 0)
		s.emit('PointerReleased')
		assert.deepEqual(calls, ['down', 'cancel'])
	}
})

test('moving beyond slop cancels long press and disabled views do not activate', () => {
	const s = setup()
	const calls = []
	s.add(types.tap, () => calls.push('tap'))
	s.add(types.longPress, () => calls.push('long'))
	s.emit('PointerPressed')
	s.emit('PointerMoved', 50)
	assert.equal(s.timers.size, 0)
	s.emit('PointerReleased', 50)
	assert.deepEqual(calls, [])
	s.target.isEnabled = false
	s.emit('PointerPressed')
	s.emit('PointerReleased')
	s.emit('RightTapped')
	assert.deepEqual(calls, [])
})

test('long press fires only its own callback and unload cancels timers', () => {
	const s = setup()
	const calls = []
	s.add(types.tap, () => calls.push('tap'))
	s.add(types.longPress, () => calls.push('long'))
	s.emit('PointerPressed')
	s.timers.values().next().value()
	assert.deepEqual(calls, ['long'])
	s.lifecycle('unloaded')
	assert.equal(s.timers.size, 0)
	assert.equal(s.native.RightTapped, null)
})

test('double tap delivers only double callback and suppresses delayed single tap', () => {
	const s = setup()
	const calls = []
	s.add(types.tap, () => calls.push('tap'))
	s.add(types.doubleTap, () => calls.push('double'))
	s.add(types.touch, (args) => calls.push(args.action))
	s.emit('PointerPressed')
	s.emit('PointerReleased')
	s.emit('PointerPressed')
	s.emit('PointerReleased')
	assert.equal(s.timers.size, 0)
	assert.deepEqual(calls, ['down', 'up', 'down', 'double', 'up'])
})

test('disable before a delayed tap suppresses activation; unload removes the pending timer', () => {
	const s = setup()
	const calls = []
	s.add(types.tap, () => calls.push('tap'))
	s.add(types.doubleTap, () => {})
	s.emit('PointerPressed')
	s.emit('PointerReleased')
	s.target.isEnabled = false
	s.timers.values().next().value()
	assert.deepEqual(calls, [])
	s.target.isEnabled = true
	s.lifecycle('unloaded')
	s.lifecycle('loaded')
	s.emit('PointerPressed')
	s.emit('PointerReleased')
	assert.equal(s.timers.size, 1)
	s.lifecycle('unloaded')
	assert.equal(s.timers.size, 0)
})

test('a throwing cancellation callback does not prevent sibling cancellation', () => {
	const s = setup()
	const calls = []
	s.add(types.touch, (args) => {
		if (args.action === 'cancel') {
			throw new Error('callback failed')
		}
	})

	s.add(types.touch, (args) => calls.push(args.action))
	s.emit('PointerPressed')
	s.emit('PointerCanceled')
	assert.deepEqual(calls, ['down', 'cancel'])
})

test('reload after native identity replacement removes old delegates and binds only the new native', () => {
	const s = setup()
	const calls = []
	s.add(types.tap, () => calls.push('tap'))
	s.add(types.touch, (args) => calls.push(args.action))
	s.lifecycle('unloaded')
	const replacement = {}
	s.target.nativeViewProtected = replacement
	s.lifecycle('loaded')
	assert.equal(s.native.PointerPressed, null)
	assert.equal(typeof replacement.PointerPressed, 'function')
	s.lifecycle('unloaded')
	assert.equal(replacement.PointerPressed, null)
	assert.deepEqual(calls, [])
})

const wrap = (fn) => fn
const subscribe = (native, callback, event = null) =>
	subscribeNativeEvent(native, 'PointerPressed', callback, event, wrap)

test('independent subscriptions survive removal, reattachment and idempotent disposal', () => {
	const native = {}
	const calls = []
	const callback = () => calls.push('same')
	const first = subscribe(native, callback)
	const second = subscribe(native, callback)
	native.PointerPressed()
	assert.equal(calls.length, 2)
	first()
	first()
	native.PointerPressed()
	assert.equal(calls.length, 3)
	second()
	assert.equal(native.PointerPressed, null)
	const third = subscribe(native, callback)
	native.PointerPressed()
	assert.equal(calls.length, 4)
	third()
})

test('dispatch respects removal and defers subscriptions added during delivery', () => {
	const native = {}
	const calls = []
	let added
	let removeSecond
	const removeFirst = subscribe(native, () => {
		calls.push('first')
		removeSecond()
		added ||= subscribe(native, () => calls.push('new'))
	})

	removeSecond = subscribe(native, () => calls.push('removed'))
	native.PointerPressed()
	assert.deepEqual(calls, ['first'])
	native.PointerPressed()
	assert.deepEqual(calls, ['first', 'first', 'new'])
	removeFirst()
	added()
})

test('routed registrations are shared and removed using the same event/delegate', () => {
	const event = {}
	const calls = []
	const native = {
		AddHandler: (...args) => calls.push(['add', ...args]),
		RemoveHandler: (...args) => calls.push(['remove', ...args]),
	}

	const one = subscribe(native, () => {}, event)
	const two = subscribe(native, () => {}, event)
	assert.equal(calls.length, 1)
	assert.equal(calls[0][3], true)
	one()
	assert.equal(calls.length, 1)
	two()
	assert.equal(calls[1][1], event)
	assert.equal(calls[1][2], calls[0][2])
})

test('partial routed registration rolls back before fallback and siblings stay additive', () => {
	let routed
	const order = []
	const native = {
		AddHandler(event, delegate) {
			routed = delegate
			order.push('add')
			throw new Error('projection failed after registration')
		},
		RemoveHandler(event, delegate) {
			assert.equal(delegate, routed)
			routed = null
			order.push('rollback')
		},
		set PointerPressed(value) {
			this.handler = value
			order.push(value ? 'fallback' : 'clear')
		},
	}

	const calls = []
	const one = subscribe(native, () => calls.push(1), {})
	const two = subscribe(native, () => calls.push(2), {})
	assert.deepEqual(order, ['add', 'rollback', 'fallback'])
	native.handler()
	assert.deepEqual(calls, [1, 2])
	one()
	native.handler()
	assert.deepEqual(calls, [1, 2, 2])
	two()
	assert.equal(native.handler, null)
})

test('failed fallback registration can be retried without a poisoned registry', () => {
	let reject = true
	const native = {
		set PointerPressed(value) {
			if (reject) {
				throw new Error('bad property')
			}

			this.handler = value
		},
	}

	assert.throws(() => subscribe(native, () => {}))
	reject = false
	const dispose = subscribe(native, () => {})
	assert.equal(typeof native.handler, 'function')
	dispose()
})

test('native objects and event names are independent', () => {
	const a = {}
	const b = {}
	const calls = []
	const removeA = subscribe(a, () => calls.push('a'))
	const removeB = subscribe(b, () => calls.push('b'))
	const removeUp = subscribeNativeEvent(a, 'PointerReleased', () => calls.push('up'), null, wrap)
	removeA()
	b.PointerPressed()
	a.PointerReleased()
	assert.deepEqual(calls, ['b', 'up'])
	removeB()
	removeUp()
})

test('ambiguous routed failure with failed rollback must not install a second listener', () => {
	const native = {
		AddHandler() {
			throw new Error('ambiguous')
		},
		RemoveHandler() {
			throw new Error('cannot roll back')
		},
	}

	assert.throws(() => subscribe(native, () => {}, {}), /ambiguous/)
	assert.equal(native.PointerPressed, undefined)
})

test('known E_NOINTERFACE rejection safely uses fallback even when RemoveHandler is unsupported', () => {
	const native = {
		AddHandler() {
			throw new Error('HRESULT 0x80004002')
		},
		RemoveHandler() {
			throw new Error('unsupported')
		},
	}

	const calls = []
	const dispose = subscribe(native, () => calls.push(1), {})
	native.PointerPressed()
	assert.deepEqual(calls, [1])
	dispose()
})
