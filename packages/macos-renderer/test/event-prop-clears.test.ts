import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice } from './mock-globals.ts'
import { sourceWithoutImports } from './mock-globals.ts'

// applyProps merges each update into node.props — a prop dropped by a host
// update kept its last value forever (recognizers, action handlers, scroll/
// layout observers, and sync readers all consult node.props). The update path
// injects explicit undefined clears for every dropped prop so removal restores
// the documented default; `on*` drops additionally reach the unbind setters.
const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))

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
	source.slice(at('function droppedPropClears('), at('\nfunction applyProps(')),
	source.slice(at('function applyCommand('), at('\nconst macOSDriver')),
].join('\n')

const prefix = 'let nextActionId = 1000\nconst DEFAULT_TEXT_LINE_HEIGHT_RATIO = 21 / 16\n'

function fixture() {
	const applied: Record<string, any>[] = []
	const sandbox = {
		elementBehaviors: new Map(),
		behaviorOf: () => undefined,
		isManualLayoutParent: (t: string) =>
			['masonview','liquidglass','contentview','actionbar','rootlayout'].includes(t),
		registerElementType: () => {},
		
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

	const api = runSlice(prefix + slices + '\n;({ applyCommand })', sandbox)

	const container = { nodes: new Map<number, any>(), children: [] }
	return { ...api, container, applied }
}

function existingNode(
	container: any,
	id: number,
	type: string,
	props: Record<string, any>,
	parent: any = null,
) {
	const node = { id, type, props: { ...props }, parent, children: [], container, view: {} }
	container.nodes.set(id, node)
	return node
}

test('a dropped on* prop clears to undefined on update', () => {
	const fx = fixture()
	const onTap = () => {}
	const onPan = () => {}
	existingNode(fx.container, 1, 'masonview', { onTap, onPan, disabled: true })

	fx.applyCommand(fx.container, { op: 'update', id: 1, props: { disabled: false } })

	assert.equal(fx.applied[0].onTap, undefined)
	assert.equal(fx.applied[0].onPan, undefined)
	assert.equal(fx.applied[0].disabled, false)
})

test('a retained on* prop is not cleared', () => {
	const fx = fixture()
	const onTap = () => {}
	const next = () => {}
	existingNode(fx.container, 2, 'masonview', { onTap })

	fx.applyCommand(fx.container, { op: 'update', id: 2, props: { onTap: next } })

	assert.equal(fx.applied[0].onTap, next)
})

test('non-function stale values do not inject clears', () => {
	const fx = fixture()
	existingNode(fx.container, 3, 'masonview', { onTap: undefined, onLongPress: null, id: 'x' })

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
		['masonview', 'onPan'],
		['masonview', 'onSwipe'],
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

test('a dropped non-event prop clears to undefined on update', () => {
	const fx = fixture()
	existingNode(fx.container, 20, 'searchbar', { text: 'query', hint: 'search' })
	existingNode(fx.container, 21, 'label', { maxLines: 2, text: 'hi' })

	fx.applyCommand(fx.container, { op: 'update', id: 20, props: { text: 'query' } })
	fx.applyCommand(fx.container, { op: 'update', id: 21, props: { text: 'hi' } })

	assert.equal(fx.applied[0].hint, undefined)
	assert.equal(fx.applied[1].maxLines, undefined)
})

test('keys that applied nothing get no clear', () => {
	const fx = fixture()
	existingNode(fx.container, 22, 'label', { maxLines: undefined, whiteSpace: null, text: 'hi' })

	fx.applyCommand(fx.container, { op: 'update', id: 22, props: { text: 'hi' } })

	assert.equal('maxLines' in fx.applied[0], false)
	assert.equal('whiteSpace' in fx.applied[0], false)
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
}
// Mason prop dispatch in the sandbox mirrors the registered behavior: tap
// and pan route to their action setters, style/class/a11y consume silently.
const masonCalls = (key: string) => {
	const spy: any = (...args: any[]) => spy.calls.push(args)
	spy.calls = [] as any[][]
	return (applyPropsSandbox[key] ??= spy)
}
const masonPropStub = (node: any, name: string, value: any) => {
	if (name === 'onTap' || name === 'onClick' || name === 'onPress') {
		masonCalls('setAction')(node, value)
		return true
	}
	if (name === 'onPan') {
		masonCalls('setPanAction')(node, value)
		return true
	}
	return true
}
applyPropsSandbox.elementBehaviors = new Map([
	['masonview', { containerStyles: true, applyProp: masonPropStub }],
])
applyPropsSandbox.behaviorOf = (t: string) => applyPropsSandbox.elementBehaviors.get(t)

const applyPropsApi = runSlice(
	source.slice(at('function applyProps('), at('\nfunction detach(')) + '\n;({ applyProps })',
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
	const { node, applyProps } = applyPropsFixture('masonview')
	const ctx = applyPropsSandbox
	// masonview onTap -> setAction; onPan/onSwipe -> setPanAction;
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

// A cleared prop has nothing left to apply — an unhandled name must not warn
// as "ignored" when it arrives as a removal.
test('applyProps warns on an unknown value but not on its clear', () => {
	const { node, applyProps } = applyPropsFixture('contentview')
	const warnings: any[][] = []
	applyPropsSandbox.console = { warn: (...args: any[]) => warnings.push(args) }
	try {
		applyProps(node, { bogusProp: 5 })
		applyProps(node, { bogusProp: undefined })
	} finally {
		applyPropsSandbox.console = console
	}

	assert.equal(warnings.length, 1)
})
