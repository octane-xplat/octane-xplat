import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { sourceWithoutImports } from './mock-globals.ts'

// Exercise the production factory, event and validation paths, not replicas.
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

const fn = (name: string) => {
	const start = source.indexOf(`function ${name}(`)
	assert.ok(start >= 0, name)
	return source.slice(start, source.indexOf('\nfunction ', start + 1))
}

const placeholderHostClass = source.slice(
	source.indexOf('class PlaceholderHostView'),
	source.indexOf('\nclass DockLayoutView'),
)

class NSView {
	subviews: any[] = []
	superview: any = null
	frame = { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } }
	_ics: any
	fittingSize = { width: 0, height: 0 }
	get intrinsicContentSize() {
		return this._ics ?? { width: -1, height: -1 }
	}

	set intrinsicContentSize(value: any) {
		this._ics = value
	}
	translatesAutoresizingMaskIntoConstraints = true
	constraints: any[] = []
	leadingAnchor = this.anchor()
	trailingAnchor = this.anchor()
	topAnchor = this.anchor()
	bottomAnchor = this.anchor()

	private anchor() {
		return {
			constraintEqualToAnchor: (other: any) => {
				const constraint = { other, active: false }
				this.constraints.push(constraint)
				return constraint
			},
		}
	}

	addSubview(child: any) {
		this.subviews.push(child)
		child.superview = this
	}

	removeFromSuperview() {
		if (this.superview) {
			this.superview.subviews.splice(this.superview.subviews.indexOf(this), 1)
		}

		this.superview = null
	}

	isDescendantOf(_view: any) {
		return false
	}

	invalidateIntrinsicContentSize() {}

	static alloc() {
		return { initWithFrame: () => new this() }
	}
}

function makeContext(calls: string[] = []) {
	const noop = () => {}
	return {
		NSView,
		NativeClass: noop,
		placeholderNodesByView: new WeakMap(),
		placeholderContentOwners: new WeakMap(),
		nodeContainersByView: new WeakMap(),
		contentViewNodesByView: new WeakMap(),
		queueLayoutReconcile: (_container: any, node: any) => calls.push('reconcile:' + node?.id),
		console: { warn: (message: string) => calls.push(message) },
		applyStyle: noop,
		applyClassName: noop,
		applyAccessibility: noop,
		isStackLayoutInput: () => false,
		setPressGesture: noop,
		setPanAction: noop,
		setLayoutAction: noop,
	}
}

function fixture(props: any = {}) {
	const calls: string[] = []
	const context = makeContext(calls)
	const container: any = {
		nodes: new Map(),
		children: [],
		root: {
			eventScope: (_priority: string, run: () => void) => run(),
		},
	}

	const api = runInNewContext(
		placeholderHostClass +
			'\n' +
			['makePlaceholder', 'fireCreatingView', 'validateNodeProps', 'applyProps']
				.map(fn)
				.join('\n') +
			'\n;({makePlaceholder,fireCreatingView,validateNodeProps,applyProps,PlaceholderHostView})',
		context,
	)

	const node: any = {
		id: 7,
		type: 'placeholder',
		view: null,
		props: { ...props },
		children: [],
		parent: null,
		container,
	}

	node.view = api.makePlaceholder(node)
	container.nodes.set(7, node)
	return { api, node, container, context, calls }
}

test('placeholder host is an AppKit view registered for intrinsic sizing', () => {
	const { api, node, context } = fixture()
	assert.ok(node.view instanceof api.PlaceholderHostView)
	assert.ok(node.view instanceof NSView)
	assert.equal(node.view.translatesAutoresizingMaskIntoConstraints, false)
	assert.equal(context.placeholderNodesByView.get(node.view), node)
	assert.equal(node.view.intrinsicContentSize.width, 0)
	assert.equal(node.view.intrinsicContentSize.height, 0)
})

test('creatingView fires once on attach and pins the assigned view', () => {
	const assigned = new NSView()
	assigned.intrinsicContentSize = { width: 60, height: 30 }
	const events: any[] = []
	const { api, node, context } = fixture({
		onCreatingView: (event: any) => {
			events.push(event)
			event.view = assigned
		},
	})

	api.fireCreatingView(node)
	assert.equal(events.length, 1)
	assert.equal(events[0].eventName, 'creatingView')
	assert.equal(events[0].object, node.view)
	assert.equal(node.placeholderContent, assigned)
	assert.equal(assigned.superview, node.view)
	assert.equal(assigned.translatesAutoresizingMaskIntoConstraints, false)
	assert.equal(context.placeholderContentOwners.get(assigned), node)
	assert.equal(context.nodeContainersByView.get(assigned), node.container)
	assert.equal(assigned.constraints.length, 4)
	assert.ok(assigned.constraints.every((c: any) => c.active))
	assert.equal(node.view.intrinsicContentSize.width, 60)
	assert.equal(node.view.intrinsicContentSize.height, 30)

	api.fireCreatingView(node)
	assert.equal(events.length, 1, 'creatingView must not refire')
})

test('creatingView without a handler or assignment leaves an empty host', () => {
	const bare = fixture()
	bare.api.fireCreatingView(bare.node)
	assert.equal(bare.node.placeholderCreated, true)
	assert.equal(bare.node.placeholderContent ?? null, null)
	assert.equal(bare.node.view.subviews.length, 0)

	const silent = fixture({ onCreatingView: () => {} })
	silent.api.fireCreatingView(silent.node)
	assert.equal(silent.node.placeholderContent ?? null, null)
	assert.equal(silent.node.view.subviews.length, 0)
})

test('creatingView rejects non-NSView assignments', () => {
	const { api, node } = fixture({
		onCreatingView: (event: any) => {
			event.view = { not: 'a view' }
		},
	})

	assert.throws(() => api.fireCreatingView(node), /must assign an AppKit NSView/)
	assert.equal(node.placeholderContent ?? null, null)
})

test('creatingView rejects the host itself', () => {
	const { api, node } = fixture({
		onCreatingView: (event: any) => {
			event.view = node.view
		},
	})

	assert.throws(() => api.fireCreatingView(node), /cycle the hierarchy/)
})

test('creatingView rejects foreign-owned and already-owned views', () => {
	const foreign = new NSView()
	const foreignFixture = fixture({
		onCreatingView: (event: any) => {
			event.view = foreign
		},
	})

	foreignFixture.context.nodeContainersByView.set(foreign, { foreign: true })
	assert.throws(
		() => foreignFixture.api.fireCreatingView(foreignFixture.node),
		/owned by another Octane root/,
	)

	const taken = new NSView()
	const takenFixture = fixture({
		onCreatingView: (event: any) => {
			event.view = taken
		},
	})

	takenFixture.context.placeholderContentOwners.set(taken, { other: true })
	assert.throws(
		() => takenFixture.api.fireCreatingView(takenFixture.node),
		/already owned by another placeholder/,
	)
})

test('creatingView rejects a host already used by another element', () => {
	const { api, node, container } = fixture()
	container.nodes.set(9, {
		id: 9,
		type: 'label',
		view: new NSView(),
		props: {},
		children: [],
		parent: null,
		container,
	})

	node.props.onCreatingView = (event: any) => {
		event.view = container.nodes.get(9).view
	}

	assert.throws(() => api.fireCreatingView(node), /already used by another element/)
})

test('insert attaches the host, fires creatingView once, survives a keyed move', () => {
	const calls: string[] = []
	const context = makeContext(calls)
	Object.assign(context, {
		layoutView: (node: any) => node.view,
		arrangedView: (node: any) => node.view,
		deactivateSizeConstraints: () => {},
		releasePlacementPins: () => {},
		applySizeConstraints: () => {},
		syncScheme: () => {},
		syncText: () => {},
		marginInsetsOf: () => null,
		makeMarginHost: () => {},
		setLayoutAction: () => {},
		stackGravity: () => 0,
		gravityInsertIndex: () => 0,
		detach: (container: any, node: any) => {
			const siblings = node.parent ? node.parent.children : container.children
			const index = siblings.indexOf(node)
			if (index >= 0) {
				siblings.splice(index, 1)
			}

			node.parent = null
		},
	})

	const parentView = new NSView() as any
	parentView.insertViewAtIndexInGravity = function (view: any, index: number) {
		this.subviews.splice(index, 0, view)
		view.superview = this
	}

	const parent: any = {
		id: 1,
		type: 'stacklayout',
		view: parentView,
		props: {},
		children: [],
		parent: null,
	}

	const container: any = {
		nodes: new Map([[1, parent]]),
		children: [],
		root: { eventScope: (_p: string, run: () => void) => run() },
	}

	parent.container = container
	const api = runInNewContext(
		placeholderHostClass +
			'\n' +
			[
				'makePlaceholder',
				'fireCreatingView',
				'parentReference',
				'resolveParentNode',
				'canContainView',
				'validateTextNesting',
				'insert',
			]
				.map(fn)
				.join('\n') +
			source.slice(
				source.indexOf('const VIEW_PARENT_TYPES'),
				source.indexOf('function typeHasView'),
			) +
			'\n;({insert,makePlaceholder})',
		context,
	)

	const assigned = new NSView()
	const fires: any[] = []
	const node: any = {
		id: 7,
		type: 'placeholder',
		view: null,
		props: {
			onCreatingView: (event: any) => {
				fires.push(event)
				event.view = assigned
			},
		},
		children: [],
		parent: null,
		container,
	}

	node.view = api.makePlaceholder(node)
	container.nodes.set(7, node)

	api.insert(container, 1, node, null)
	assert.equal(fires.length, 1)
	assert.equal(assigned.superview, node.view)
	assert.equal(node.view.superview, parentView)
	assert.equal(parent.children[0], node)

	api.insert(container, 1, node, null)
	assert.equal(fires.length, 1, 're-attach must not refire creatingView')
	assert.equal(node.placeholderContent, assigned)
	assert.equal(assigned.superview, node.view)
})

test('validateNodeProps rejects a non-function onCreatingView', () => {
	const { api } = fixture()
	assert.throws(
		() => api.validateNodeProps('placeholder', { onCreatingView: 'x' }),
		/onCreatingView must be a function/,
	)

	api.validateNodeProps('placeholder', { onCreatingView: () => {} })
	api.validateNodeProps('placeholder', {})
})

test('placeholder rejects JSX children through the shared nesting rule', () => {
	const api = runInNewContext(fn('validateTextNesting') + '\n;({validateTextNesting})', {})
	assert.throws(
		() => api.validateTextNesting('placeholder', 'label'),
		/content comes from creatingView/,
	)
})

test('applyProps keeps handler registration inert and warns on foreign props', () => {
	const { api, node, calls } = fixture()
	api.applyProps(node, {
		onCreatingView: () => {},
		id: 'slot',
		style: { opacity: 0.5 },
		className: 'chip',
		mystery: 1,
	})

	assert.equal(node.props.mystery, 1)
	assert.ok(calls.includes('[macos-host] ignored placeholder prop mystery'))
})
