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
		isFlipped: () => flipped,
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

// Exercise the existing renderer scroll dispatch as well as the layout helper:
// geometry work must not invent new scroll fields or call a stale handler.
import { runInNewContext } from 'node:vm'

test('existing onScroll event shape and latest callback survive replacement and removal', () => {
	const { node, clip, observers } = fixture()
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

	const start = source.indexOf('function setScrollAction(')
	const code = source.slice(start, source.indexOf('\nconst layoutHandlers', start))
	const setScrollAction = runInNewContext(code + '\nsetScrollAction', {
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
