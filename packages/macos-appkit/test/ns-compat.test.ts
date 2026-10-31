import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runSlice } from './mock-globals.ts'

// The compat slice is self-contained — eval it with the renderer seam stubbed.
const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/ns-compat.ts', import.meta.url), 'utf8'),
)
	.replace(/^import [^\n]*\n/gm, '')
	.replaceAll('export ', '')

function fixture() {
	const registered = new Map<string, any>()
	const reconciles: any[] = []
	const classNames: any[] = []
	const styles: any[] = []
	const api = runSlice(
		source +
			'\n;({ Observable, Property, CssProperty, Style, ViewBase, registerPluginElement, installCompat })',
		{ console },
	)
	api.installCompat({
		registerElementType: (type: string, behavior: any) => registered.set(type, behavior),
		applyStyle: (_node: any, value: any) => styles.push(value),
		applyClassName: (node: any, value: any) => classNames.push([node.id, value]),
		applyAccessibility: () => {},
		queueLayoutReconcile: (_c: any, parent: any) => reconciles.push(parent),
	})
	return { api, registered, reconciles, classNames, styles }
}

test('Observable on/notify/off round-trips events', () => {
	const { api } = fixture()
	const obs = new api.Observable()
	const seen: any[] = []
	const cb = (args: any) => seen.push(args)
	obs.on('loaded', cb)
	obs.notify({ eventName: 'loaded', answer: 42 })
	assert.equal(seen.length, 1)
	assert.equal(seen[0].answer, 42)
	assert.equal(seen[0].object, obs)
	obs.off('loaded', cb)
	obs.notify({ eventName: 'loaded' })
	assert.equal(seen.length, 1)
})

test('Property.register installs accessors with default + change notification', () => {
	const { api } = fixture()
	class MyView extends api.ViewBase {}
	const title = new api.Property<MyView, string>({ name: 'title', defaultValue: 'untitled' })
	title.register(MyView)

	const view = new MyView()
	assert.equal(view.title, 'untitled')
	const events: any[] = []
	view.on('titleChange', (args: any) => events.push(args))
	view.title = 'hello'
	assert.equal(view.title, 'hello')
	assert.equal(events.length, 1)
	assert.equal(events[0].oldValue, 'untitled')
	assert.equal(events[0].value, 'hello')
	// equal assignment does not re-notify
	view.title = 'hello'
	assert.equal(events.length, 1)
})

test('affectsLayout properties request a layout reconcile', () => {
	const { api, registered, reconciles } = fixture()
	class MyView extends api.ViewBase {
		createNativeView() {
			return { kind: 'native' }
		}
	}
	new api.Property<MyView, number>({
		name: 'count',
		defaultValue: 0,
		affectsLayout: true,
	}).register(MyView)
	api.registerPluginElement('myview', { createView: () => new MyView() })

	const behavior = registered.get('myview')
	const node = { id: 1, type: 'myview', container: {}, children: [] }
	behavior.make(node, {})
	assert.deepEqual(node.view, { kind: 'native' })
	node.nsCompatView.count = 3
	assert.equal(reconciles.length, 1)
	assert.equal(reconciles[0], node)
})

test('registerPluginElement bridges props, style, className and dispose', () => {
	const { api, registered, classNames } = fixture()
	const disposals: number[] = []
	class MyView extends api.ViewBase {
		createNativeView() {
			return { kind: 'v' }
		}
		dispose() {
			disposals.push(1)
		}
	}
	new api.Property<MyView, string>({ name: 'heading' }).register(MyView)
	api.registerPluginElement('myview', { createView: () => new MyView(), container: true })

	const behavior = registered.get('myview')
	assert.equal(behavior.container, true)
	assert.equal(behavior.containerStyles, true)

	const node = { id: 7, type: 'myview', container: {}, children: [] }
	behavior.make(node, {})
	const view = node.nsCompatView
	assert.ok(view instanceof api.ViewBase)
	assert.equal(view.hostNode, node)

	// registered property lands on the view
	assert.equal(behavior.applyProp(node, 'heading', 'hi'), true)
	assert.equal(view.heading, 'hi')

	// style object fans out through the style bag
	assert.equal(behavior.applyProp(node, 'style', { gap: 4, rowGap: 2 }), true)
	assert.equal(view.style.getProp('gap'), 4)
	assert.equal(view.style.getProp('rowGap'), 2)

	// className goes to the view and the renderer's class pipeline
	assert.equal(behavior.applyProp(node, 'className', 'gap-4'), true)
	assert.equal(view.className, 'gap-4')
	assert.deepEqual(classNames, [[7, 'gap-4']])

	// unknown prop → not consumed
	assert.equal(behavior.applyProp(node, 'nonsense', 1), false)
	// id swallowed
	assert.equal(behavior.applyProp(node, 'id', 'x'), true)

	behavior.destroy(node)
	assert.equal(disposals.length, 1)
	assert.equal(node.nsCompatView, undefined)
})

test('registrations before installCompat replay on install', () => {
	// separate sandbox: register BEFORE install
	const registered = new Map<string, any>()
	const api = runSlice(source + '\n;({ ViewBase, registerPluginElement, installCompat })', {
		console,
	})
	api.registerPluginElement('earlyview', {
		createView: () => {
			const v = new api.ViewBase()
			v.createNativeView = () => ({ early: true })
			return v
		},
	})
	assert.equal(registered.has('earlyview'), false)
	api.installCompat({
		registerElementType: (type: string, behavior: any) => registered.set(type, behavior),
		applyStyle: () => {},
		applyClassName: () => {},
		applyAccessibility: () => {},
		queueLayoutReconcile: () => {},
	})
	assert.ok(registered.has('earlyview'))
	const node = { id: 1, type: 'earlyview', container: {}, children: [] }
	registered.get('earlyview').make(node, {})
	assert.deepEqual(node.view, { early: true })
})
