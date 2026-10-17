import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/gestures.ts', import.meta.url)).replaceAll(
	'export ',
	'',
)

function fixture() {
	class Native {
		static new() {
			return new this()
		}
		static alloc() {
			return new this()
		}
		initWithTargetAction(target, action) {
			this.target = target
			this.action = action
			return this
		}
		reset() {}
	}

	const api = runInNewContext(
		source +
			'\n({ setPressGesture, disposePressGestures, configureGesture, swipeDirection, target, delegate })',
		{
		releaseMasonNodes: () => {},
		layoutMasonChildren: () => {},
		masonNaturalSize: () => null,
		MASON_STYLE_KEYS: new Set(),
		
			NSObject: Native,
			NSGestureRecognizer: Native,
			NSClickGestureRecognizer: Native,
			NSPressGestureRecognizer: Native,
			NSGestureRecognizerDelegate: {},
			NativeClass() {},
			registerGestureClass() {},
			interop: { types: { void: {} } },
			console,
		},
	)

	const events = []
	const scopes = []
	const recognizers = []
	const view = {
		addGestureRecognizer(r) {
			r.view = view
			recognizers.push(r)
		},
		removeGestureRecognizer(r) {
			recognizers.splice(recognizers.indexOf(r), 1)
		},
	}

	const node = {
		view,
		props: {
			onTouch: (e) => events.push(e.action),
			onLongPress: () => events.push('long'),
			onDoubleTap: () => events.push('double'),
		},
		container: {
			root: {
				eventScope(kind, fn) {
					scopes.push(kind)
					fn()
				},
			},
		},
	}

	for (const name of ['onTouch', 'onLongPress', 'onDoubleTap']) {
		api.setPressGesture(node, name)
	}

	return { ...api, node, events, scopes, recognizers }
}

test('press observer delivers balanced down/move/up and reset cancellation in event scope', () => {
	const f = fixture(),
		r = f.node.onTouchGestureRecognizer

	r.mouseDown({})
	r.mouseDragged({})
	r.mouseUp({})
	r.reset()
	assert.deepEqual(f.events, ['down', 'move', 'up'])
	r.mouseDown({})
	r.reset()
	r.reset()
	r.mouseUp({})
	assert.deepEqual(f.events, ['down', 'move', 'up', 'down', 'cancel'])
	assert.ok(f.scopes.every((s) => s === 'discrete'))
})

test('long and double press use configured native recognizers and ignore failed/cancelled states', () => {
	const f = fixture()
	assert.equal(f.node.onLongPressGestureRecognizer.minimumPressDuration, 0.5)
	assert.equal(f.node.onDoubleTapGestureRecognizer.numberOfClicksRequired, 2)
	for (const state of [0, 1, 2, 4, 5]) {
		f.target.longPressed({ view: f.node.view, state })
		f.target.doublePressed({ view: f.node.view, state })
	}

	assert.deepEqual(f.events, [])
	f.target.longPressed({ view: f.node.view, state: 3 })
	f.target.doublePressed({ view: f.node.view, state: 3 })
	assert.deepEqual(f.events, ['long', 'double'])
})

test('callback replacement, removal, disabled transitions and teardown cannot deliver stale callbacks', () => {
	const f = fixture(),
		r = f.node.onTouchGestureRecognizer

	f.node.props.onTouch = (e) => f.events.push('new:' + e.action)
	r.mouseDown({})
	f.node.props.disabled = true
	for (const name of ['onTouch', 'onLongPress', 'onDoubleTap']) {
		f.setPressGesture(f.node, name)
	}

	r.reset()
	f.target.longPressed({ view: f.node.view, state: 3 })
	f.target.doublePressed({ view: f.node.view, state: 3 })
	assert.deepEqual(f.events, ['new:down'])
	assert.ok(f.recognizers.every((r) => r.enabled === false))
	f.node.props.disabled = false
	f.setPressGesture(f.node, 'onTouch')
	r.mouseDown({})
	r.mouseUp({})
	assert.deepEqual(f.events, ['new:down', 'new:down', 'new:up'])
	f.node.props.onTouch = undefined
	f.setPressGesture(f.node, 'onTouch')
	r.mouseDown({})
	r.reset()
	assert.equal(f.events.length, 3)
	f.disposePressGestures(f.node)
	f.target.doublePressed({ view: f.node.view, state: 3 })
	assert.equal(f.recognizers.length, 0)
	assert.equal(f.events.length, 3)
})

test('simultaneous recognition is confined to renderer-owned recognizers on the same host', () => {
	const f = fixture(),
		a = f.recognizers[0],
		b = f.recognizers[1]

	assert.equal(
		f.delegate.gestureRecognizerShouldRecognizeSimultaneouslyWithGestureRecognizer(a, b),
		true,
	)

	assert.equal(
		f.delegate.gestureRecognizerShouldRecognizeSimultaneouslyWithGestureRecognizer(a, {
			view: a.view,
		}),
		false,
	)

	const other = f.configureGesture({ view: {} })
	assert.equal(
		f.delegate.gestureRecognizerShouldRecognizeSimultaneouslyWithGestureRecognizer(a, other),
		false,
	)

	assert.equal(a.delaysPrimaryMouseButtonEvents, false)
})

test('swipe directions preserve NativeScript values and require a completed threshold-crossing drag', () => {
	const { swipeDirection } = fixture()
	for (const [deltaX, deltaY, direction] of [
		[30, 0, 1],
		[-30, 0, 2],
		[0, -30, 4],
		[0, 30, 8],
		[40, -32, 1],
	]) {
		assert.equal(swipeDirection({ state: 3, deltaX, deltaY }), direction)
	}

	for (const state of [0, 1, 2, 4, 5]) {
		assert.equal(swipeDirection({ state, deltaX: 100, deltaY: 0 }), null)
	}

	assert.equal(swipeDirection({ state: 3, deltaX: 29, deltaY: 29 }), null)
})

const renderer = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

function rendererFunction(name) {
	const start = renderer.indexOf('function ' + name + '(')
	return renderer.slice(start, renderer.indexOf('\nfunction ', start + 1))
}

function panFixture() {
	const f = fixture()
	const handlers = new WeakMap()
	const targetSource = renderer.slice(
		renderer.indexOf('class ButtonActionTarget'),
		renderer.indexOf('const buttonActionTarget'),
	)

	const api = runInNewContext(
		targetSource +
			'\n' +
			rendererFunction('setPanAction') +
			'\n' +
			rendererFunction('setAction') +
			'\n({ setPanAction, setAction, ButtonActionTarget })',
		{
		releaseMasonNodes: () => {},
		layoutMasonChildren: () => {},
		masonNaturalSize: () => null,
		MASON_STYLE_KEYS: new Set(),
		
			NSObject: class {},
			NSButton: {},
			NSPanGestureRecognizer: { alloc: () => ({ initWithTargetAction: () => ({}) }) },
			NSClickGestureRecognizer: { alloc: () => ({ initWithTargetAction: () => ({}) }) },
			NSNotification: {},
			NSTextViewDelegate: {},
			NSTextFieldDelegate: {},
			interop: { types: { void: {} } },
			NativeClass() {},
			registerGestureClass() {},
			configureGesture: (r) => r,
			panHandlersByView: handlers,
			buttonActionTarget: {},
			swipeDirection: f.swipeDirection,
			actionHandlers: new Map(),
			actionIdsByView: new WeakMap(),
			nextActionId: 1,
			console,
		},
	)

	const events = []
	f.node.props = {
		onPan: (e) => events.push(['pan', e.state, e.deltaX, e.deltaY]),
		onSwipe: (e) => events.push(['swipe', e.direction]),
	}

	api.setPanAction(f.node)
	const sender = {
		view: f.node.view,
		state: 3,
		translationInView: () => ({ x: 10, y: 40 }),
		velocityInView: () => ({ x: 2, y: 3 }),
	}

	return { ...f, ...api, events, sender, handlers }
}

test('AppKit pan target normalizes flipped Y, delivers pan plus swipe, and suppresses cancellation and disabled events', () => {
	const f = panFixture(),
		target = new f.ButtonActionTarget()

	f.node.view.isFlipped = false
	target.viewPanned(f.sender)
	assert.deepEqual(f.events, [
		['pan', 3, 10, -40],
		['swipe', 4],
	])

	f.events.length = 0
	f.sender.state = 4
	target.viewPanned(f.sender)
	assert.deepEqual(f.events, [['pan', 0, 10, -40]])
	f.node.props.disabled = true
	f.setPanAction(f.node)
	target.viewPanned(f.sender)
	assert.equal(f.events.length, 1)
	assert.equal(f.node.panGestureRecognizer.enabled, false)
	f.node.props.disabled = false
	f.node.props.onPan = undefined
	f.node.view.isFlipped = () => true
	f.setPanAction(f.node)
	f.sender.state = 3
	target.viewPanned(f.sender)
	assert.deepEqual(f.events.at(-1), ['swipe', 8])
	f.node.props.onSwipe = undefined
	f.setPanAction(f.node)
	assert.equal(f.node.panGestureRecognizer.enabled, false)
	assert.equal(f.handlers.get(f.node.view), null)
})

test('primary press callbacks guard disabled state even when a native action is already queued', () => {
	const f = panFixture()
	const events = []
	// Read the production action closure installed by setAction.
	const handlers = new Map()
	const fn = runInNewContext(rendererFunction('setAction') + '\nsetAction', {
		actionHandlers: handlers,
		configureGesture: (r) => r,
		nextActionId: 1,
		actionIdsByView: new WeakMap(),
		NSClickGestureRecognizer: { alloc: () => ({ initWithTargetAction: () => ({}) }) },
		buttonActionTarget: {},
		console,
	})

	fn(f.node, () => events.push('press'))
	handlers.get(f.node.actionId)()
	f.node.props.disabled = true
	handlers.get(f.node.actionId)()
	assert.deepEqual(events, ['press'])
})

test('JSC gesture registration makes native callbacks enumerable before registration', () => {
	let registered
	const register = runInNewContext(source + '\nregisterGestureClass', {
		releaseMasonNodes: () => {},
		layoutMasonChildren: () => {},
		masonNaturalSize: () => null,
		MASON_STYLE_KEYS: new Set(),
		
		NSObject: class {
			static new() {
				return new this()
			}
		},
		NSGestureRecognizer: class {},
		NSGestureRecognizerDelegate: {},
		interop: { types: { void: {} } },
		NativeClass(ctor) {
			registered = ctor
		},
	})

	class Callback {
		['delivered:']() {}
	}

	assert.equal(Object.keys(Callback.prototype).length, 0)
	register(Callback)
	assert.equal(registered, Callback)
	assert.deepEqual(Object.keys(Callback.prototype), ['delivered:'])
})
