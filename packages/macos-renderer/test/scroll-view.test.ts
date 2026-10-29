import assert from 'node:assert/strict'
import { test } from 'node:test'
import { configureScrollAxes, observeScrollGeometry } from '../src/scroll-view.ts'
import { mockGlobals, sourceWithoutImports } from './mock-globals.ts'

function fixture(flipped = false) {
	const constraints: any[] = []
	const anchor = () => ({
		constraintEqualToAnchor(other: any) {
			const c = { kind: 'equal', other, active: false }
			constraints.push(c)
			return c
		},
		constraintGreaterThanOrEqualToAnchor(other: any) {
			const c = { kind: 'minimum', other, active: false }
			constraints.push(c)
			return c
		},
	})

	const clip = {
		bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
		widthAnchor: anchor(),
		heightAnchor: anchor(),
		scrollToPoint(point: any) {
			this.bounds.origin = point
		},
	}

	const document = {
		frame: { size: { width: 300, height: 400 } },
		widthAnchor: anchor(),
		heightAnchor: anchor(),
		flipped,
	}

	const view = {
		contentView: clip,
		documentView: document,
		reflectScrolledClipView() {},
		layoutSubtreeIfNeeded() {},
	}

	const observers: any[] = []
	mockGlobals({
		NSUserInterfaceLayoutOrientation: { Horizontal: 0, Vertical: 1 },
		NSViewFrameDidChangeNotification: 'frame',
		NSNotificationCenter: {
			defaultCenter: {
				addObserverForNameObjectQueueUsingBlock(
					name: string,
					object: any,
					_queue: any,
					callback: () => void,
				) {
					const entry = { name, object, callback, removed: false }
					observers.push(entry)
					return entry
				},
				removeObserver(observer: any) {
					observer.removed = true
				},
			},
		},
	})

	const node: any = { view, childHost: document, props: {} }
	return { node, clip, document, constraints, observers }
}

const tick = () => new Promise<void>((resolve) => queueMicrotask(resolve))

test('default block, inline and both release old pins and constrain only disabled axes', () => {
	const { node, constraints } = fixture()
	configureScrollAxes(node)
	assert.equal(node.view.hasVerticalScroller, true)
	assert.equal(node.view.hasHorizontalScroller, false)
	assert.deepEqual(
		node.scrollAxisConstraints.map((c: any) => c.kind),
		['equal', 'minimum'],
	)

	node.props.orientation = 'horizontal'
	configureScrollAxes(node)
	assert.equal(node.view.hasVerticalScroller, false)
	assert.equal(node.view.hasHorizontalScroller, true)
	assert.deepEqual(
		node.scrollAxisConstraints.map((c: any) => c.kind),
		['minimum', 'equal'],
	)

	assert.ok(constraints.slice(0, 2).every((c) => !c.active))
	node.props.orientation = 'both'
	configureScrollAxes(node)
	assert.equal(node.view.hasVerticalScroller, true)
	assert.equal(node.view.hasHorizontalScroller, true)
	assert.deepEqual(
		node.scrollAxisConstraints.map((c: any) => c.kind),
		['minimum', 'minimum'],
	)

	assert.ok(constraints.slice(0, 4).every((c) => !c.active))
	node.props.orientation = undefined
	configureScrollAxes(node)
	assert.deepEqual(
		node.scrollAxisConstraints.map((c: any) => c.kind),
		['equal', 'minimum'],
	)
})

test('first layout, clip/document resize and axis changes measure once per layout turn', async () => {
	const { node, clip, document, observers } = fixture()
	node.props.orientation = 'both'
	configureScrollAxes(node)
	let calls = 0
	const detach = observeScrollGeometry(node, node.view, () => calls++)
	await tick()
	assert.equal(calls, 1)
	assert.equal(clip.bounds.origin.y, 300, 'unflipped document starts at its visual top')
	assert.equal(observers.length, 3)
	clip.bounds.origin = { x: 200, y: 300 }
	document.frame.size = { width: 150, height: 120 }
	for (const observer of observers) {
		observer.callback()
	}

	await tick()
	assert.equal(calls, 2)
	assert.deepEqual(clip.bounds.origin, { x: 50, y: 20 })
	clip.bounds.size = { width: 200, height: 200 }
	observers.find((o) => o.object === clip).callback()
	await tick()
	assert.deepEqual(clip.bounds.origin, { x: 0, y: 0 })
	document.frame.size = { width: 400, height: 500 }
	clip.bounds.origin = { x: 80, y: 100 }
	node.props.orientation = 'horizontal'
	configureScrollAxes(node)
	await tick()
	assert.deepEqual(
		clip.bounds.origin,
		{ x: 80, y: 300 },
		'disabled block axis remains at visual top',
	)

	detach()
	assert.ok(observers.every((o) => o.removed))
	const before = calls
	for (const observer of observers) {
		observer.callback()
	}

	await tick()
	assert.equal(calls, before)
})

test('queued geometry work is cancelled on removal and flipped origin stays at zero', async () => {
	const { node, clip, observers } = fixture(true)
	node.props.orientation = 'vertical'
	const detach = observeScrollGeometry(node, node.view, () =>
		assert.fail('removed viewport notified'),
	)

	detach()
	await tick()
	assert.ok(observers.every((o) => o.removed))
	let calls = 0
	const next = observeScrollGeometry(node, node.view, () => calls++)
	await tick()
	assert.equal(calls, 1)
	assert.equal(clip.bounds.origin.y, 0)
	next()
})

// Authored ownership/failure cases below remain source models, not native proof.

test('partial geometry setup unwinds acquired handles, retires callbacks and allows retry', async () => {
	const { node, observers } = fixture()
	const center = globalThis.NSNotificationCenter.defaultCenter as any
	const add = center.addObserverForNameObjectQueueUsingBlock
	const failure = new Error('private setup payload')
	let attempt = 0, held!: () => void, calls = 0
	center.addObserverForNameObjectQueueUsingBlock = (...args: any[]) => {
		if (++attempt === 2) { held = args[3]; held(); throw failure }
		return add.apply(center, args)
	}
	assert.throws(() => observeScrollGeometry(node, node.view, () => calls++), error => error === failure)
	assert.ok(observers.every(observer => observer.removed))
	assert.equal(node.scrollGeometryDetach, null)
	assert.equal(node.scrollGeometrySchedule, null)
	held()
	await tick()
	assert.equal(calls, 0)
	center.addObserverForNameObjectQueueUsingBlock = add
	const stop = observeScrollGeometry(node, node.view, () => calls++)
	await tick()
	assert.equal(calls, 1)
	stop()
})

test('reentrant replacement releases the old late handle without clobbering the new geometry owner', async () => {
	const { node, observers } = fixture()
	const center = globalThis.NSNotificationCenter.defaultCenter as any
	const add = center.addObserverForNameObjectQueueUsingBlock
	let replacing = true, oldCalls = 0, nextCalls = 0, latest!: () => void
	center.addObserverForNameObjectQueueUsingBlock = (...args: any[]) => {
		const token = add.apply(center, args)
		if (replacing) {
			replacing = false
			latest = observeScrollGeometry(node, node.view, () => nextCalls++)
		}
		return token
	}
	const stale = observeScrollGeometry(node, node.view, () => oldCalls++)
	assert.equal(observers[0].removed, true)
	assert.equal(node.scrollGeometryDetach, latest)
	stale()
	await tick()
	assert.equal(oldCalls, 0)
	assert.equal(nextCalls, 1)
	for (const observer of observers) observer.callback()
	await tick()
	assert.equal(nextCalls, 2)
	latest()
	assert.ok(observers.every(observer => observer.removed))
})

test('cleanup attempts every native removal once and held callbacks cannot revive it', async () => {
	const { node, observers } = fixture()
	const center = globalThis.NSNotificationCenter.defaultCenter as any
	let removals = 0, calls = 0
	center.removeObserver = (observer: any) => { observer.removed = true; removals++; throw Error('private cleanup payload') }
	const warn = console.warn, warnings: string[] = []
	console.warn = message => { warnings.push(String(message)) }
	try {
		const stop = observeScrollGeometry(node, node.view, () => calls++)
		stop(); stop()
		for (const observer of observers) observer.callback()
		await tick()
		assert.equal(removals, 3)
		assert.equal(calls, 0)
		assert.equal(node.scrollGeometryDetach, null)
		assert.equal(node.scrollGeometrySchedule, null)
		assert.deepEqual(warnings, Array(3).fill('[macos-scroll] Geometry observer cleanup failed'))
	} finally { console.warn = warn }
})

test('layout teardown or view replacement prevents stale clamping and notification', async () => {
	for (const replace of [false, true]) {
		const { node, clip, observers } = fixture()
		node.props.orientation = 'vertical'
		let calls = 0
		const stop = observeScrollGeometry(node, node.view, () => calls++)
		node.view.layoutSubtreeIfNeeded = () => {
			if (replace) node.view = { ...node.view, documentView: {} }
			else stop()
		}
		await tick()
		assert.equal(clip.bounds.origin.y, 0)
		assert.equal(calls, 0)
		assert.ok(observers.every(observer => observer.removed))
		assert.equal(node.scrollGeometryDetach, null)
	}
})

test('failed layout and consumer notification release the queued task for later attempts', async () => {
	const { node, observers } = fixture()
	let layoutFails = true, notifyFails = true, calls = 0
	node.view.layoutSubtreeIfNeeded = () => { if (layoutFails) throw Error('private layout payload') }
	const warn = console.warn, warnings: string[] = []
	console.warn = message => { warnings.push(String(message)) }
	try {
		const stop = observeScrollGeometry(node, node.view, () => { calls++; if (notifyFails) throw Error('private consumer payload') })
		await tick()
		assert.equal(calls, 0)
		layoutFails = false
		observers[0].callback(); await tick()
		assert.equal(calls, 1)
		notifyFails = false
		observers[0].callback(); await tick()
		assert.equal(calls, 2)
		assert.deepEqual(warnings, Array(2).fill('[macos-scroll] Geometry update failed'))
		stop()
	} finally { console.warn = warn }
})

test('invalid geometry never reaches native scrolling and failed positioning remains retryable', async () => {
	const { node, clip, document, observers } = fixture()
	node.props.orientation = 'vertical'
	document.frame.size.height = Number.NaN
	const scroll = clip.scrollToPoint
	let writes = 0, calls = 0, fail = true
	clip.scrollToPoint = function(point: any) {
		writes++
		assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y))
		if (fail) throw Error('private scroll payload')
		scroll.call(this, point)
	}
	const warn = console.warn, warnings: string[] = []
	console.warn = message => { warnings.push(String(message)) }
	try {
		const stop = observeScrollGeometry(node, node.view, () => calls++)
		await tick()
		assert.equal(writes, 0)
		assert.equal(node.scrollInitialPositioned, undefined)
		for (const invalid of [Infinity, -1]) {
			document.frame.size.height = invalid
			observers[0].callback(); await tick()
		}
		assert.equal(writes, 0)
		document.frame.size.height = 400
		observers[0].callback(); await tick()
		assert.equal(writes, 1)
		assert.equal(node.scrollInitialPositioned, undefined)
		fail = false
		observers[0].callback(); await tick()
		assert.equal(writes, 2)
		assert.equal(clip.bounds.origin.y, 300)
		assert.equal(node.scrollInitialPositioned, true)
		assert.equal(calls, 1)
		assert.deepEqual(warnings, [...Array(3).fill('[macos-scroll] Invalid geometry frame'), '[macos-scroll] Geometry update failed'])
		stop()
	} finally { console.warn = warn }
})

test('consumer-scheduled geometry keeps its own task while former cleanup leaves the new owner intact', async () => {
	const { node } = fixture()
	let calls = 0
	const first = observeScrollGeometry(node, node.view, () => {
		calls++
		if (calls === 1) node.scrollGeometrySchedule()
	})
	await tick(); await tick()
	assert.equal(calls, 2)
	const next = observeScrollGeometry(node, node.view, () => calls++)
	first()
	assert.equal(node.scrollGeometryDetach, next)
	await tick()
	assert.equal(calls, 3)
	next()
})

test('geometry cleanup retains its notification center and method receiver after replacement', async () => {
	const { node, observers } = fixture()
	const center = globalThis.NSNotificationCenter.defaultCenter as any
	let removed = 0
	center.removeObserver = function(observer: any) { assert.equal(this, center); observer.removed = true; removed++ }
	const stop = observeScrollGeometry(node, node.view, () => {})
	center.removeObserver = () => assert.fail('replacement method received an old handle')
	;(globalThis.NSNotificationCenter as any).defaultCenter = { removeObserver: () => assert.fail('replacement center received an old handle') }
	stop()
	await tick()
	assert.equal(removed, 3)
	assert.ok(observers.every(observer => observer.removed))
})

// Exercise the actual renderer caller so late native removal reentry cannot
// overwrite its replacement subscription after the helper already returned.
test('renderer layout unbinding preserves a newer subscription acquired during native cleanup', async () => {
	const { node, observers } = fixture()
	node.type = 'scrollview'
	node.view.bounds = { size: { width: 100, height: 100 } }
	node.container = { root: { eventScope: (_scope: string, run: () => void) => run() } }
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
	const start = source.indexOf('function syncLayoutObserver(')
	const code = source.slice(start, source.indexOf('function setTextFieldPlaceholder(', start))
	const setLayoutAction = runSlice(code + '\nsetLayoutAction', {
		layoutView: (candidate: any) => candidate.view,
		layoutHandlers: new WeakMap(), observeScrollGeometry,
		NSNotificationCenter: globalThis.NSNotificationCenter,
		NSViewFrameDidChangeNotification: 'frame', console,
	})
	const center = globalThis.NSNotificationCenter.defaultCenter as any
	const remove = center.removeObserver
	let reenter = true, oldCalls = 0, nextCalls = 0
	center.removeObserver = (observer: any) => {
		remove.call(center, observer)
		if (reenter) { reenter = false; setLayoutAction(node, () => nextCalls++) }
	}
	setLayoutAction(node, () => oldCalls++)
	const previous = node.scrollGeometryDetach
	setLayoutAction(node, undefined)
	assert.ok(node.scrollGeometryDetach)
	assert.notEqual(node.scrollGeometryDetach, previous)
	await tick()
	assert.equal(oldCalls, 0)
	assert.equal(nextCalls, 1)
	for (const observer of observers) observer.callback()
	await tick()
	assert.equal(nextCalls, 2)
	node.scrollGeometryDetach()
	assert.ok(observers.every(observer => observer.removed))
})

// Exercise the existing renderer scroll dispatch as well as the layout helper:
// geometry work must not invent new scroll fields or call a stale handler.
import { runSlice } from './mock-globals.ts'

test('existing onScroll event shape and latest callback survive replacement and removal', () => {
	const { node, clip, observers } = fixture()
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

	const start = source.indexOf('function setScrollAction(')
	const code = source.slice(start, source.indexOf('\nconst layoutHandlers', start))
	const setScrollAction = runSlice(code + '\nsetScrollAction', {
		elementBehaviors: new Map(),
		behaviorOf: () => undefined,
		isManualLayoutParent: (t: string) =>
			[
				'gridlayout',
				'liquidglass',
				'absolutelayout',
				'contentview',
				'actionbar',
				'docklayout',
				'wraplayout',
				'rootlayout',
			].includes(t),
		registerElementType: () => {},

		scrollHandlers: new WeakMap(),
		NSNotificationCenter: globalThis.NSNotificationCenter,
		NSViewBoundsDidChangeNotification: 'bounds',
		performance,
		process,
		console,
	})

	node.container = { root: { eventScope: (_scope: string, run: () => void) => run() } }
	let oldCalls = 0
	const events: any[] = []
	setScrollAction(node, () => oldCalls++)
	setScrollAction(node, (event: any) => events.push(event))
	assert.equal(observers.length, 1)
	clip.bounds.origin.y = 75.5
	observers[0].callback()
	assert.equal(oldCalls, 0)
	assert.equal(events.length, 1)
	assert.deepEqual(Object.keys(events[0]), ['verticalOffset', 'viewportHeight', 'contentHeight'])
	assert.equal(events[0].verticalOffset, 75.5)
	assert.equal(events[0].viewportHeight, 100)
	assert.equal(events[0].contentHeight, 400)
	setScrollAction(node, undefined)
	observers[0].callback()
	assert.equal(events.length, 1)
})
