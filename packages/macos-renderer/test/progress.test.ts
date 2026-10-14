import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

const source = stripTypeScriptTypes(readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'))
const fn = (name: string) => {
	const start = source.indexOf(`function ${name}(`)
	assert.ok(start >= 0, name)
	return source.slice(start, source.indexOf('\n}', start) + 2)
}

function controlFixture() {
	const calls: string[] = []
	const view: any = {
		startAnimation(sender: any) { assert.equal(sender, null); calls.push('start') },
		stopAnimation(sender: any) { assert.equal(sender, null); calls.push('stop') },
		sizeToFit() { calls.push('size') },
	}

	const constants = source.slice(source.indexOf('const CLEAR_ON_UPDATE'), source.indexOf('\nfunction clearOnUpdate'))
	const api = runInNewContext(
		constants + '\n' + ['makeProgress', 'syncProgress', 'validateNodeProps',
			'clearOnUpdate', 'staleEventClears', 'applyProps', 'applyCommand'].map(fn).join('\n') +
			'\n({makeProgress,validateNodeProps,applyProps,applyCommand})',
		{
			NSProgressIndicator: { alloc: () => ({ initWithFrame: () => view }) },
			NSProgressIndicatorStyle: { Bar: 0 }, NSControlSize: { Regular: 0 },
			applyStyle: (node: any, value: any) => { node.appliedStyle = value; calls.push('style:' + String(value?.opacity)) },
			applyClassName: (_node: any, value: any) => calls.push('class:' + String(value)),
			queueLayoutReconcile: () => {}, console: { warn: (message: string) => calls.push(message) },
		},
	)

	const container = { nodes: new Map() }
	const node = { id: 1, type: 'progress', view: api.makeProgress(), props: {},
		children: [], parent: null, container }

	container.nodes.set(1, node)
	return { api, node, view, calls, container }
}

test('raw Progress creates a determinate regular bar with a safe default range', () => {
	const { view, calls } = controlFixture()
	assert.equal(view.style, 0)
	assert.equal(view.controlSize, 0)
	assert.equal(view.indeterminate, false)
	assert.equal(view.displayedWhenStopped, true)
	assert.equal(view.minValue, 0)
	assert.equal(view.maxValue, 100)
	assert.equal(view.doubleValue, 0)
	assert.equal(view.translatesAutoresizingMaskIntoConstraints, false)
	assert.deepEqual(calls, ['size'])
})

test('Progress clamps all finite ranges and updates value and maximum independently of key order', () => {
	const { api, node, view } = controlFixture()
	const update = (props: any) => api.applyProps(node, props)
	update({ value: -12, maxValue: 40 })
	assert.equal(view.doubleValue, 0)
	update({ value: 55 })
	assert.equal(view.doubleValue, 40)
	update({ maxValue: 80 })
	assert.equal(view.doubleValue, 55)
	assert.equal(view.maxValue, 80)
	update({ maxValue: 20, value: 10.5 })
	assert.equal(view.doubleValue, 10.5)
	update({ value: 10, maxValue: 5 })
	assert.equal(view.doubleValue, 5)
	for (const maxValue of [0, -1, -100]) {
		update({ maxValue, value: 50 })
		assert.equal(view.doubleValue / view.maxValue, 0)
		assert.ok(view.maxValue > 0)
	}

	update({ maxValue: 100 })
	assert.equal(view.doubleValue, 50)
	assert.equal(node.view, view)
})

test('production Progress update commands restore dropped value, maximum and styling defaults', () => {
	const { api, node, view, calls, container } = controlFixture()
	api.applyProps(node, { value: 30, maxValue: 60, style: { opacity: 0.5 }, className: 'working' })
	api.applyCommand(container, { op: 'update', id: 1, props: { value: 25 } })
	assert.equal(view.doubleValue, 25)
	assert.equal(view.maxValue, 100)
	api.applyCommand(container, { op: 'update', id: 1, props: { maxValue: 10 } })
	assert.equal(view.doubleValue, 0)
	assert.equal(view.maxValue, 10)
	api.applyCommand(container, { op: 'update', id: 1, props: {} })
	assert.equal(view.doubleValue, 0)
	assert.equal(view.maxValue, 100)
	assert.equal(node.view, view)
	assert.ok(calls.includes('style:undefined'))
	assert.ok(calls.includes('class:undefined'))
	assert.equal(calls.some((call) => call.includes('ignored')), false)
})

test('Progress rejects nonnumeric/nonfinite inputs before allocation but accepts negative and fractional values', () => {
	const { api, calls } = controlFixture()
	for (const name of ['value', 'maxValue']) {
		for (const value of ['12', true, {}, [], NaN, Infinity, -Infinity]) {
			assert.throws(() => api.validateNodeProps('progress', { [name]: value }), /must be a finite number/)
		}

		for (const value of [-100, 0, 0.5, 100, undefined]) {
			api.validateNodeProps('progress', { [name]: value })
		}
	}

	assert.deepEqual(calls, ['size'])
})

test('Progress accepts layout parents and rejects all children before insertion', () => {
	const api = runInNewContext(fn('validateTextNesting') + '\n({validateTextNesting})')
	for (const child of ['label', '#text', 'span', 'progress']) {
		assert.throws(() => api.validateTextNesting('progress', child), /cannot contain JSX children/)
	}

	for (const parent of ['stacklayout', 'contentview', 'docklayout', 'rootlayout', 'gridlayout']) {
		api.validateTextNesting(parent, 'progress')
	}
})

test('Progress production ownership moves its native host between parents and releases it on destroy', () => {
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

	const api = runInNewContext(
		['validateTextNesting', 'insert', 'detach', 'destroy'].map(fn).join('\n') +
			'\n({insert,destroy})',
		{
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
			props: { value: 25, maxValue: 100 },
			children: [],
			parent: null,
			container,
		}

		container.nodes.set(id, item)
		return item
	}

	const left: any = node(1, 'contentview'),
		right: any = node(2, 'contentview'),
		progress: any = node(3, 'progress')

	const retained = progress.view
	api.insert(container, 1, progress, null)
	assert.equal(left.contentChild, progress)
	api.insert(container, 2, progress, null)
	assert.equal(left.contentChild, null)
	assert.equal(left.children.length, 0)
	assert.equal(progress.view, retained)
	assert.equal(retained.superview, right.view)
	assert.equal(right.contentChild, progress)
	api.destroy(progress)
	assert.equal(retained.superview, null)
	assert.equal(stops, 0)
	assert.equal(progress.parent, null)
	assert.equal(right.contentChild, null)
	assert.equal(right.children.length, 0)
})
