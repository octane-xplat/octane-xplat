import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// applyProps merges each update into node.props — an `on*` prop dropped by a
// host update left a bound closure firing the stale handler (recognizers,
// action handlers, scroll/layout observers all read node.props). The update
// path must inject explicit undefined clears for every dropped callback prop.
const source = stripTypeScriptTypes(
	readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8'),
)

const at = (marker: string, from = 0) => source.indexOf(marker, from)
const fn = (name: string) =>
	source.slice(at(`function ${name}(`), at('\nfunction ', at(`function ${name}(`) + 1))

const constSet = (name: string) =>
	source.slice(at(`const ${name} = new Set(`), at('\n])', at(`const ${name} = new Set(`)) + 3)

const slices = [
	constSet('VIEW_PARENT_TYPES'),
	constSet('SUPPORTED_TYPES'),
	fn('typeHasView'),
	fn('assertSupportedType'),
	fn('validateNodeProps'),
	source.slice(at('const CLEAR_ON_UPDATE'), at('\nfunction applyProps(')),
	source.slice(at('function applyCommand('), at('\nconst macOSDriver')),
].join('\n')

const prefix = 'let nextActionId = 1000\nconst DEFAULT_TEXT_LINE_HEIGHT_RATIO = 21 / 16\n'

function fixture() {
	const applied: Record<string, any>[] = []
	const sandbox = {
		applyProps: (_node: any, props: any) => {
			applied.push(props)
			Object.assign(_node.props, props)
		},
		insert: () => {},
		remove: () => {},
		detach: () => {},
		destroy: () => {},
		console,
	}

	const api = runInNewContext(
		prefix + slices + '\n;({ applyCommand })',
		sandbox,
	)

	const container = { nodes: new Map<number, any>(), children: [] }
	return { ...api, container, applied }
}

function existingNode(container: any, id: number, type: string, props: Record<string, any>, parent: any = null) {
	const node = { id, type, props: { ...props }, parent, children: [], container, view: {} }
	container.nodes.set(id, node)
	return node
}

test('a dropped on* prop clears to undefined on update', () => {
	const fx = fixture()
	const onTap = () => {}
	const onPan = () => {}
	existingNode(fx.container, 1, 'flexboxlayout', { onTap, onPan, disabled: true })

	fx.applyCommand(fx.container, { op: 'update', id: 1, props: { disabled: false } })

	assert.equal(fx.applied[0].onTap, undefined)
	assert.equal(fx.applied[0].onPan, undefined)
	assert.equal(fx.applied[0].disabled, false)
})

test('a retained on* prop is not cleared', () => {
	const fx = fixture()
	const onTap = () => {}
	const next = () => {}
	existingNode(fx.container, 2, 'flexboxlayout', { onTap })

	fx.applyCommand(fx.container, { op: 'update', id: 2, props: { onTap: next } })

	assert.equal(fx.applied[0].onTap, next)
})

test('non-function stale values do not inject clears', () => {
	const fx = fixture()
	existingNode(fx.container, 3, 'flexboxlayout', { onTap: undefined, onLongPress: null, id: 'x' })

	fx.applyCommand(fx.container, { op: 'update', id: 3, props: { id: 'x' } })

	assert.equal('onTap' in fx.applied[0], false)
	assert.equal('onLongPress' in fx.applied[0], false)
})

test('control and text event props clear on every element type', () => {
	const fx = fixture()
	const cases: [string, string][] = [
		['button', 'onPress'],
		['switch', 'onCheckedChange'],
		['slider', 'onValueChange'],
		['textfield', 'onTextChange'],
		['textview', 'onTextChange'],
		['scrollview', 'onScroll'],
		['gridlayout', 'onPan'],
		['absolutelayout', 'onSwipe'],
	]

	cases.forEach(([type, prop], index) => {
		existingNode(fx.container, 10 + index, type, { [prop]: () => {} })
		fx.applyCommand(fx.container, { op: 'update', id: 10 + index, props: {} })
	})

	cases.forEach(([, prop], index) => {
		assert.equal(
			fx.applied[index][prop],
			undefined,
			`${cases[index][0]} dropped ${prop} must clear`,
		)
	})
})

test('onLayoutChanged clears on any element type', () => {
	const fx = fixture()
	existingNode(fx.container, 30, 'contentview', { onLayoutChanged: () => {} })

	fx.applyCommand(fx.container, { op: 'update', id: 30, props: {} })

	assert.equal(fx.applied[0].onLayoutChanged, undefined)
})

test('contentview children keep their alignment clears alongside event clears', () => {
	const fx = fixture()
	const parent = existingNode(fx.container, 40, 'contentview', {})
	existingNode(fx.container, 41, 'label', { onCustom: () => {}, text: 'hi' }, parent)

	fx.applyCommand(fx.container, { op: 'update', id: 41, props: { text: 'hi' } })

	assert.equal(fx.applied[0].onCustom, undefined)
	assert.equal(fx.applied[0].horizontalAlignment, undefined)
	assert.equal(fx.applied[0].verticalAlignment, undefined)
})

// End-to-end: a cleared event prop must reach the binding setter as undefined
// — the merge alone would never produce that call, leaving the stale closure
// subscribed on the recognizer/action handler.
const applyPropsSandbox: Record<string, any> = {
	console,
	isStackLayoutInput: () => false,
}

const applyPropsApi = runInNewContext(
	source.slice(at('function applyProps('), at('\nfunction detach(')) +
		'\n;({ applyProps })',
	new Proxy(applyPropsSandbox, {
		get(target, key: string | symbol) {
			if (key in target) {
				return (target as any)[key]
			}

			if (typeof key === 'string' && key in globalThis) {
				return (globalThis as any)[key]
			}

			const calls: any[][] = []
			const spy: any = (...args: any[]) => calls.push(args)
			spy.calls = calls
			return ((target as any)[key] = spy)
		},
	}),
)

function applyPropsFixture(type: string) {
	const node = {
		id: 1,
		type,
		props: {},
		parent: null,
		children: [],
		container: {},
		view: {},
	}

	const applyProps = (applyPropsApi as any).applyProps
	return { node, applyProps }
}

test('applyProps routes a cleared on* prop to the unbind setters', () => {
	const { node, applyProps } = applyPropsFixture('flexboxlayout')
	const ctx = applyPropsSandbox
	// flexboxlayout onTap -> setAction; onPan/onSwipe -> setPanAction;
	// onTouch/onLongPress/onDoubleTap -> setPressGesture; onLayoutChanged ->
	// setLayoutAction.
	applyProps(node, {
		onTap: undefined,
		onPan: undefined,
		onSwipe: undefined,
		onTouch: undefined,
		onLongPress: undefined,
		onDoubleTap: undefined,
		onLayoutChanged: undefined,
	})

	assert.deepEqual(ctx.setAction.calls, [[node, undefined]])
	assert.equal(ctx.setPanAction.calls.length, 2)
	assert.deepEqual(
		ctx.setPressGesture.calls.map((call: any[]) => call[1]),
		['onTouch', 'onLongPress', 'onDoubleTap'],
	)

	assert.deepEqual(ctx.setLayoutAction.calls, [[node, undefined]])
})

test('applyProps routes cleared control events to their unbind setters', () => {
	const { node, applyProps } = applyPropsFixture('scrollview')
	const ctx = applyPropsSandbox
	applyProps(node, { onScroll: undefined })
	assert.deepEqual(ctx.setScrollAction.calls, [[node, undefined]])

	const field = applyPropsFixture('textfield')
	applyProps(field.node, { onTextChange: undefined, onSubmit: undefined })
	assert.equal(ctx.setControlAction.calls.at(-1)[0], field.node)
	assert.equal(ctx.setControlAction.calls.at(-1)[1], undefined)
	assert.equal(ctx.setTextSubmitAction.calls.at(-1)[0], field.node)
	assert.equal(ctx.setTextSubmitAction.calls.at(-1)[1], undefined)
})
