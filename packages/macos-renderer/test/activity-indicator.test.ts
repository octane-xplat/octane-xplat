import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runSlice } from './mock-globals.ts'

const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const fn = (name: string) => {
	const start = source.indexOf(`function ${name}(`)
	assert.ok(start >= 0, name)
	return source.slice(start, source.indexOf('\n}', start) + 2)
}

function controlFixture() {
	const calls: string[] = []
	const view: any = {
		startAnimation(sender: any) {
			assert.equal(sender, null)
			calls.push('start')
		},
		stopAnimation(sender: any) {
			assert.equal(sender, null)
			calls.push('stop')
		},
		sizeToFit() {
			calls.push('size')
		},
	}

	const constants = source.slice(
		source.indexOf('function droppedPropClears('),
		source.indexOf('\nfunction applyProps('),
	)

	const api = runSlice(
		constants +
			'\n' +
			[
				'makeActivityIndicator',
				'syncActivityIndicator',
				'validateNodeProps',
				'parentReference',
				'resolveParentNode',
				'canContainView',
				'droppedPropClears',
				'applyProps',
				'applyCommand',
			]
				.map(fn)
				.join('\n') +
			'\n({makeActivityIndicator,validateNodeProps,applyProps,applyCommand})',
		{
		elementBehaviors: new Map(),
		behaviorOf: () => undefined,
		isManualLayoutParent: (t: string) =>
			['gridlayout','liquidglass','absolutelayout','contentview','actionbar','docklayout','wraplayout','rootlayout'].includes(t),
		registerElementType: () => {},
		
			NSProgressIndicator: { alloc: () => ({ initWithFrame: () => view }) },
			NSProgressIndicatorStyle: { Spinning: 1 },
			NSControlSize: { Regular: 0 },
			applyStyle: (node: any, value: any) => {
				node.appliedStyle = value
				calls.push('style:' + String(value?.opacity))
			},
			applyClassName: (_node: any, value: any) => calls.push('class:' + String(value)),
			queueLayoutReconcile: () => {},
			console: { warn: (message: string) => calls.push(message) },
		},
	)

	const container = { nodes: new Map() }
	const node = {
		id: 1,
		type: 'activityindicator',
		view: api.makeActivityIndicator(),
		props: {},
		children: [],
		parent: null,
		container,
	}

	container.nodes.set(1, node)
	return { api, node, view, calls, container }
}

test('raw ActivityIndicator creates an indeterminate regular spinner with native sizing', () => {
	const { view, calls } = controlFixture()
	assert.equal(view.style, 1)
	assert.equal(view.controlSize, 0)
	assert.equal(view.indeterminate, true)
	assert.equal(view.displayedWhenStopped, false)
	assert.equal(view.translatesAutoresizingMaskIntoConstraints, false)
	assert.deepEqual(calls, ['size'])
})

test('production ActivityIndicator updates start/stop animation and dropped props restore defaults', () => {
	const { api, node, view, calls, container } = controlFixture()
	api.applyProps(node, {})
	assert.equal(view.alphaValue, 0)
	api.applyProps(node, { busy: true, style: { opacity: 0.5 }, className: 'loading' })
	assert.equal(view.alphaValue, 0.5)
	api.applyCommand(container, { op: 'update', id: 1, props: { busy: false } })
	assert.equal(view.alphaValue, 0)
	api.applyCommand(container, { op: 'update', id: 1, props: { busy: true } })
	assert.equal(view.alphaValue, 1)
	api.applyCommand(container, { op: 'update', id: 1, props: {} })
	assert.equal(view.alphaValue, 0)
	assert.equal(node.view, view)
	assert.equal(node.props.busy, undefined)
	assert.deepEqual(
		calls.filter((call) => call === 'start' || call === 'stop'),
		['stop', 'start', 'stop', 'start', 'stop'],
	)

	assert.ok(calls.includes('style:undefined'))
	assert.ok(calls.includes('class:undefined'))
	assert.equal(
		calls.some((call) => call.includes('ignored')),
		false,
	)
})

test('ActivityIndicator primitive validation rejects invalid busy values before native mutation', () => {
	const { api, calls } = controlFixture()
	for (const busy of ['false', 1, {}, []]) {
		assert.throws(
			() => api.validateNodeProps('activityindicator', { busy }),
			/busy must be boolean/,
		)
	}

	for (const busy of [true, false, undefined]) {
		api.validateNodeProps('activityindicator', { busy })
	}

	assert.deepEqual(calls, ['size'])
})

test('ActivityIndicator accepts layout parents and rejects all children before insertion', () => {
	const api = runSlice(fn('validateTextNesting') + '\n({validateTextNesting})')
	for (const child of ['label', '#text', 'span', 'activityindicator']) {
		assert.throws(
			() => api.validateTextNesting('activityindicator', child),
			/cannot contain JSX children/,
		)
	}

	for (const parent of ['stacklayout', 'contentview', 'docklayout', 'rootlayout', 'gridlayout']) {
		api.validateTextNesting(parent, 'activityindicator')
	}
})

test('ActivityIndicator production ownership moves its native host between parents and releases it on destroy', () => {
	let stops = 0
	const noop = () => {}
	const view = () => ({
		subviews: [] as any[],
		superview: null as any,
		invalidateIntrinsicContentSize: noop,
		stopAnimation: () => stops++,
		addSubview(child: any) {
			this.subviews.push(child)
			child.superview = this
		},
		removeFromSuperview() {
			if (this.superview) {
				this.superview.subviews.splice(this.superview.subviews.indexOf(this), 1)
			}

			this.superview = null
		},
	})

	const api = runSlice(
		[
			'parentReference',
			'resolveParentNode',
			'canContainView',
			'validateTextNesting',
			'insert',
			'detach',
			'destroy',
		]
			.map(fn)
			.join('\n') + '\n({insert,destroy})',
		{
		elementBehaviors: new Map(),
		behaviorOf: () => undefined,
		isManualLayoutParent: (t: string) =>
			['gridlayout','liquidglass','absolutelayout','contentview','actionbar','docklayout','wraplayout','rootlayout'].includes(t),
		registerElementType: () => {},
		
			VIEW_PARENT_TYPES: new Set(['contentview']),
			layoutView: (node: any) => node.view,
			arrangedView: (node: any) => node.view,
			deactivateSizeConstraints: noop,
			releasePlacementPins: noop,
			queueLayoutReconcile: noop,
			syncText: noop,
			syncScheme: noop,
			disposePressGestures: noop,
			panHandlersByView: new WeakMap(),
			layoutHandlers: new WeakMap(),
		},
	)

	const container: any = { nodes: new Map(), children: [] }
	const node = (id: number, type: string) => {
		const item = {
			id,
			type,
			view: view(),
			props: { busy: true },
			children: [],
			parent: null,
			container,
		}

		container.nodes.set(id, item)
		return item
	}

	const left: any = node(1, 'contentview'),
		right: any = node(2, 'contentview'),
		html: any = node(3, 'activityindicator')

	const retained = html.view
	api.insert(container, 1, html, null)
	assert.equal(left.contentChild, html)
	api.insert(container, 2, html, null)
	assert.equal(left.contentChild, null)
	assert.equal(left.children.length, 0)
	assert.equal(html.view, retained)
	assert.equal(retained.superview, right.view)
	assert.equal(right.contentChild, html)
	api.destroy(html)
	assert.equal(retained.superview, null)
	assert.equal(retained.hidden, true)
	assert.equal(retained.alphaValue, 0)
	assert.equal(stops, 1)
	assert.equal(html.parent, null)
	assert.equal(right.contentChild, null)
	assert.equal(right.children.length, 0)
})
