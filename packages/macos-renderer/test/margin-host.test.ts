import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// Exercise margin-host insertion and layout-observer migration without the
// Objective-C bridge. NSStackView insertion indices are local to a gravity
// area, and NSViewFrameDidChangeNotification observers must follow whichever
// view the stack actually arranges (the margin host when margins wrap a
// child).
const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const fn = (name) => {
	const start = source.indexOf(`function ${name}(`)
	return source.slice(start, source.indexOf('\nfunction ', start + 1))
}

const program = [
	source.slice(
		source.indexOf('const layoutHandlers'),
		source.indexOf('function setTextFieldPlaceholder'),
	),
	source.slice(
		source.indexOf('function marginInsetsOf('),
		source.indexOf('function setMarginStyle('),
	),
	fn('gravityInsertIndex'),
	fn('destroy'),
	'({ layoutHandlers, setLayoutAction, syncMarginHost, destroy })',
].join('\n')

function anchor() {
	return {
		constraintEqualToAnchorConstant: (_other, constant) => ({ active: false, constant }),
		constraintEqualToAnchor: () => ({ active: false, constant: 0 }),
	}
}

function view(extra = {}) {
	return {
		subviews: [],
		bounds: { size: { width: 0, height: 0 } },
		leadingAnchor: anchor(),
		trailingAnchor: anchor(),
		topAnchor: anchor(),
		bottomAnchor: anchor(),
		removeFromSuperview() {},
		addSubview(child) {
			this.subviews.push(child)
		},
		...extra,
	}
}

function fixture() {
	const observers = []
	const center = {
		addObserverForNameObjectQueueUsingBlock(_name, object, _queue, block) {
			const entry = { object, block, removed: false }
			observers.push(entry)
			return entry
		},
		removeObserver(entry) {
			if (entry) {
				entry.removed = true
			}
		},
	}

	const stack = {
		arranged: [],
		insertCalls: [],
		addViewInGravity(view) {
			this.arranged.push(view)
		},
		removeArrangedSubview(view) {
			const index = this.arranged.indexOf(view)
			if (index >= 0) {
				this.arranged.splice(index, 1)
			}
		},
		insertViewAtIndexInGravity(view, index, gravity) {
			this.insertCalls.push({ view, index, gravity })
			this.arranged.splice(index, 0, view)
		},
	}

	const parent = { id: 1, type: 'flexboxlayout', children: [], view: stack }
	const context = {
		NSView: { alloc: () => ({ initWithFrame: () => view() }) },
		NSNotificationCenter: { defaultCenter: center },
		stackGravity: (_parent, node) => node.view.gravity,
		queueLayoutReconcile: () => {},
		console,
		disposeWebView: () => {},
		scrollHandlers: new WeakMap(),
		actionHandlers: new Map(),
		accessibilityLabels: new Map(),
		accessibilityRoles: new Map(),
	}

	const api = runInNewContext(program, context)
	const row = (id, gravity = 1, extra = {}) => ({
		id,
		type: 'label',
		view: view({ gravity }),
		props: {},
		parent,
		children: [],
		...extra,
	})

	const adopt = (...children) => {
		parent.children.push(...children)
		for (const child of children) {
			child.parent = parent
		}
	}

	return { ...api, observers, stack, parent, row, adopt }
}

test('margin host wraps at the gravity-local index, not the child index', () => {
	const { syncMarginHost, stack, row, adopt } = fixture()
	const text = { id: 'text', type: '#text', view: null, props: {}, children: [] }
	const a = row('a', 1)
	const b = row('b', 2)
	const c = row('c', 2)
	adopt(text, a, b, c)

	c.marginInsets = { top: 4, right: 0, bottom: 0, left: 0 }
	syncMarginHost(c)

	assert.equal(stack.insertCalls.length, 1)
	const call = stack.insertCalls[0]
	assert.equal(call.view, c.marginHost)
	assert.equal(call.gravity, 2)
	// Only b precedes c inside gravity 2; the logical child index is 3.
	assert.equal(call.index, 1)
	assert.deepEqual(c.marginHost.subviews, [c.view])
	assert.equal(c.marginConstraints.length, 4)
})

test('removing margins keeps the host arranged and collapses its constants', () => {
	const { syncMarginHost, stack, row, adopt } = fixture()
	const text = { id: 'text', type: '#text', view: null, props: {}, children: [] }
	const x = row('x', 2)
	const d = row('d', 2, {
		marginHost: view({ gravity: 2 }),
		marginConstraints: [
			{ constant: 4 },
			{ constant: -4 },
			{ constant: 4 },
			{ constant: -4 },
		],
	})

	const y = row('y', 2)
	adopt(text, x, d, y)
	stack.arranged.push(x.view, d.marginHost, y.view)

	d.marginInsets = { top: 0, right: 0, bottom: 0, left: 0 }
	syncMarginHost(d)

	// No stack churn — the wrapper stays so a descendant first responder is
	// never detached by margin removal.
	assert.equal(stack.insertCalls.length, 0)
	assert.deepEqual(stack.arranged, [x.view, d.marginHost, y.view])
	assert.equal(d.marginConstraints[0].constant, 0)
	assert.equal(d.marginConstraints[1].constant, 0)
	assert.equal(d.marginConstraints[2].constant, 0)
	assert.equal(d.marginConstraints[3].constant, 0)
})

test('layout observer migrates to the margin host and stays', () => {
	const { setLayoutAction, syncMarginHost, observers, row, adopt } = fixture()
	const e = row('e', 1)
	e.container = { root: { eventScope: (_scope, run) => run() } }
	adopt(e)

	const events = []
	e.props.onLayoutChanged = (event) => events.push(event)
	setLayoutAction(e, e.props.onLayoutChanged)

	assert.equal(observers.length, 1)
	assert.equal(observers[0].object, e.view)
	assert.equal(e.layoutObservedView, e.view)

	e.marginInsets = { top: 6, right: 0, bottom: 0, left: 0 }
	syncMarginHost(e)

	assert.ok(e.marginHost)
	assert.equal(e.layoutObservedView, e.marginHost)
	assert.ok(observers[0].removed)
	const hostObserver = observers.at(-1)
	assert.equal(hostObserver.object, e.marginHost)
	assert.ok(!hostObserver.removed)

	e.marginHost.bounds.size.width = 40
	e.marginHost.bounds.size.height = 12
	hostObserver.block()
	assert.equal(events.length, 1)
	assert.equal(events[0].object, e.marginHost)
	assert.equal(events[0].width, 40)
	assert.equal(events[0].height, 12)

	e.marginInsets = null
	syncMarginHost(e)

	// The host stays arranged after margins clear, so the observer stays put.
	assert.ok(e.marginHost)
	assert.equal(e.layoutObservedView, e.marginHost)
	assert.ok(!hostObserver.removed)

	e.marginHost.bounds.size.width = 30
	hostObserver.block()
	assert.equal(events.at(-1).object, e.marginHost)
	assert.equal(events.at(-1).width, 30)
})

test('destroy removes the layout observer and drops its handler', () => {
	const { setLayoutAction, destroy, layoutHandlers, observers, row, adopt } = fixture()
	const e = row('e', 1)
	e.container = { root: { eventScope: (_scope, run) => run() } }
	adopt(e)

	setLayoutAction(e, () => {})
	const observed = e.layoutObservedView
	assert.equal(observed, e.view)

	destroy(e)
	assert.equal(e.layoutObserver, null)
	assert.equal(e.layoutObservedView, null)
	assert.ok(observers[0].removed)
	assert.equal(layoutHandlers.has(observed), false)
})
