import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

// Exercise the shipped patch helpers without loading device-only Mason APIs.
// This models NativeScript's resolved-style notifications, not native geometry.
const patch = readFileSync(
	new URL('../patches/@nativescript-community__octane@0.2.5.patch', import.meta.url),
	'utf8',
)

const driver = patch
	.split('diff --git a/dist/elements.js')[0]
	.split('\n')
	.filter((line) => (line.startsWith('+') && !line.startsWith('+++')) || line.startsWith(' '))
	.map((line) => line.slice(1))
	.join('\n')

const helpers = driver.slice(
	driver.indexOf('const MASON_CONTAINER_TAGS'),
	driver.indexOf('/** Recompute a text host'),
)

const inline = driver.slice(
	driver.indexOf('function refreshCss'),
	driver.indexOf('// --- Mason layout cutover'),
)

const unsetValue = Symbol('unset')
const nativeStyles = new WeakMap()
const api = runInNewContext(
	`${inline}\n${helpers}\n;({ applyStyle, applyMasonDefaults, applyMasonChildLayout, releaseMasonChildLayout })`,
	{
		unsetValue,
		Utils: { layout: { toDeviceIndependentPixels: (value) => value / 3 } },
		MasonStyle: {
			fromView(_view, native) {
				if (!nativeStyles.has(native)) {
					nativeStyles.set(native, {})
				}
				return nativeStyles.get(native)
			},
		},
		// The leaf longhands are real CssProperties — report them registered so
		// removal restores via unsetValue (the cascade path), not the captured
		// default reserved for plain fields.
		_getStyleProperties: () =>
			[
				'display',
				'visibility',
				'width',
				'height',
				'minWidth',
				'minHeight',
				'maxWidth',
				'maxHeight',
				'marginTop',
				'marginRight',
				'marginBottom',
				'marginLeft',
				'flexGrow',
				'flexShrink',
				'flexBasis',
				'alignSelf',
				'justifySelf',
				'order',
				'position',
				'left',
				'top',
				'right',
				'bottom',
				'aspectRatio',
				'gridRow',
				'gridColumn',
				'gridRowStart',
				'gridRowEnd',
				'gridColumnStart',
				'gridColumnEnd',
			].map((name) => ({ name })),
		cssTreeParse: (source) => {
			const declarations = [...source.matchAll(/([\w-]+)\s*:/g)].map((m) => ({
				type: 'declaration',
				property: m[1],
			}))
			return { stylesheet: { rules: [{ declarations }] } }
		},
	},
)

const plain = (value) => JSON.parse(JSON.stringify(value))

function observable() {
	const listeners = new Map()
	return {
		on(event, fn) {
			if (!listeners.has(event)) {
				listeners.set(event, new Set())
			}
			listeners.get(event).add(fn)
		},
		off(event, fn) {
			listeners.get(event)?.delete(fn)
		},
		emit(event) {
			for (const fn of listeners.get(event) ?? []) {
				fn()
			}
		},
		listenerCount() {
			return [...listeners.values()].reduce((n, set) => n + set.size, 0)
		},
	}
}

function foreign() {
	const defaults = {
		display: 'flex',
		visibility: 'visible',
		width: 'auto',
		height: 'auto',
		minWidth: 0,
		minHeight: 0,
		maxWidth: 'auto',
		maxHeight: 'auto',
		marginTop: 0,
		marginRight: 0,
		marginBottom: 0,
		marginLeft: 0,
		alignSelf: 'auto',
		justifySelf: 'auto',
		gridRow: 'auto',
		gridColumn: 'auto',
	}
	const css = {}
	const local = {}
	const resolved = { ...defaults }
	const style = observable()
	const recascade = () => {
		for (const key of Object.keys(defaults)) {
			resolved[key] = local[key] ?? css[key] ?? defaults[key]
			style.emit(key + 'Change')
		}
	}
	const view = {
		...observable(),
		nativeViewProtected: {},
		style,
		_cssState: { onChange: recascade },
		setInlineStyle() {},
	}
	style.removeUnscopedCssVariable = () => {}
	for (const key of Object.keys(defaults)) {
		Object.defineProperty(style, key, {
			get: () => resolved[key],
			set(value) {
				if (value === unsetValue) {
					delete local[key]
					resolved[key] = defaults[key]
				} else {
					local[key] = value
					resolved[key] = value
				}
				style.emit(key + 'Change')
			},
		})
	}
	return {
		view,
		node: {
			view,
			styleKeys: new Set(),
			styleDefaults: new Map(),
		},
		classStyle(next) {
			for (const key of Object.keys(css)) {
				delete css[key]
			}
			Object.assign(css, next)
			recascade()
		},
		leaf: () => nativeStyles.get(view.nativeViewProtected),
	}
}

test('container defaults leave class-authored alignment in the CSS cascade', () => {
	const style = { alignItems: 'center', justifyContent: 'center' }
	api.applyMasonDefaults('masonview', { style })
	assert.equal(style.alignItems, 'center')
	assert.equal(style.justifyContent, 'center')
	const empty = {}
	api.applyMasonDefaults('masonview', { style: empty })
	assert.equal(Object.hasOwn(empty, 'alignItems'), false)
})

test('class-sized foreign leaves copy resolved dimensions and track class replacement/removal', () => {
	const f = foreign()
	f.classStyle({ width: 31, height: 36, marginLeft: 4, alignSelf: 'center' })
	api.applyMasonChildLayout(f.node, {})
	assert.equal(f.leaf().width, 31)
	assert.equal(f.leaf().height, 36)
	assert.equal(f.leaf().marginLeft, 4)
	assert.equal(f.leaf().alignSelf, 'center')
	f.classStyle({ width: 54, height: 54 })
	assert.equal(f.leaf().width, 54)
	assert.equal(f.leaf().marginLeft, 0)
	assert.equal(f.leaf().alignSelf, 'normal')
	f.classStyle({})
	assert.equal(f.leaf().width, 'auto')
	assert.equal(f.leaf().height, 'auto')
})

test('inline replacement and removal reveal current class dimensions', () => {
	const f = foreign()
	f.classStyle({ width: 31, height: 36 })
	api.applyMasonChildLayout(f.node, {})
	api.applyStyle(f.node, f.view, { width: 54, height: 54 })
	f.classStyle({ width: 43, height: 43 })
	assert.equal(f.leaf().width, 54)
	api.applyStyle(f.node, f.view, { height: 30 })
	assert.equal(f.leaf().width, 43)
	assert.equal(f.leaf().height, 30)
	api.applyStyle(f.node, f.view, null)
	assert.equal(f.leaf().height, 43)
})

test('core pixel lengths convert once; percentage lengths retain their fraction', () => {
	const f = foreign()
	f.classStyle({ width: { value: 93, unit: 'px' }, height: { value: 0.5, unit: '%' } })
	api.applyMasonChildLayout(f.node, {})
	assert.deepEqual(plain(f.leaf().width), { value: 31, unit: 'dip' })
	assert.deepEqual(plain(f.leaf().height), { value: 0.5, unit: '%' })
})

test('removed grid placement writes an explicit auto reset to the leaf', () => {
	const f = foreign()
	f.classStyle({ gridRow: '1', gridColumn: '1 / span 2' })
	api.applyMasonChildLayout(f.node, {})
	assert.equal(f.leaf().gridColumn, '1 / span 2')
	f.classStyle({ gridRow: '1' })
	assert.equal(f.leaf().gridColumn, 'auto')
})

test('late native creation and recreation replay styles; teardown removes subscriptions', () => {
	const f = foreign()
	f.view.nativeViewProtected = undefined
	f.classStyle({ width: 31, height: 36 })
	api.applyMasonChildLayout(f.node, {})
	f.view.nativeViewProtected = {}
	f.view.emit('loaded')
	assert.equal(f.leaf().width, 31)
	const previous = f.leaf()
	f.view.nativeViewProtected = {}
	f.view.emit('loaded')
	assert.notEqual(f.leaf(), previous)
	assert.equal(f.leaf().height, 36)
	api.releaseMasonChildLayout(f.view)
	assert.equal(f.view.listenerCount(), 0)
	assert.equal(f.view.style.listenerCount(), 0)
	f.classStyle({ width: 54 })
	assert.equal(f.leaf().width, 31)
	api.applyMasonChildLayout(f.node, {})
	assert.equal(f.leaf().width, 54)
})

test('Mason-owned views retain their own style forwarding', () => {
	const view = { _styleHelper: {}, style: observable() }
	api.applyMasonChildLayout({ view }, {})
	assert.equal(view.style.listenerCount(), 0)
})

test('foreign style commits finish before requesting the Mason parent layout', () => {
	const f = foreign()
	const calls = []
	const style = {
		batch(update) {
			calls.push('begin')
			update()
			calls.push('commit')
		},
	}
	nativeStyles.set(f.view.nativeViewProtected, style)
	const parent = {
		view: {
			requestLayout() {
				calls.push('layout')
				assert.equal(calls.at(-2), 'commit')
			},
		},
	}
	api.applyMasonChildLayout(f.node, parent)
	assert.equal(calls.at(-1), 'layout')
	calls.length = 0
	f.classStyle({ width: 54 })
	assert.equal(style.width, 54)
	assert.equal(calls.filter((call) => call === 'layout').length, 1)
	calls.length = 0
	api.applyMasonChildLayout(f.node, parent)
	assert.equal(calls.includes('layout'), false)
})

test('collapsed foreign leaves leave Mason layout and restore the effective display', () => {
	const f = foreign()
	f.classStyle({ display: 'block', visibility: 'collapse' })
	let requests = 0
	api.applyMasonChildLayout(f.node, { view: { requestLayout: () => requests++ } })
	assert.equal(f.leaf().display, 'none')
	assert.equal(f.view.style.display, 'block')

	// Repeated cascade notifications must not create another invalidation.
	requests = 0
	f.view.style.emit('visibilityChange')
	assert.equal(requests, 0)

	f.classStyle({ display: 'grid', visibility: 'collapse' })
	assert.equal(f.leaf().display, 'none')
	assert.equal(requests, 0)
	f.classStyle({ display: 'grid', visibility: 'hidden' })
	assert.equal(f.leaf().display, 'grid')
	assert.equal(requests, 1)

	api.applyStyle(f.node, f.view, { visibility: 'collapse' })
	assert.equal(f.leaf().display, 'none')
	api.applyStyle(f.node, f.view, {})
	assert.equal(f.leaf().display, 'grid')
	f.classStyle({})
	assert.equal(f.leaf().display, 'flex')
})

test('visibility never overrides authored display none and survives native recreation', () => {
	const f = foreign()
	f.classStyle({ display: 'none', visibility: 'hidden' })
	api.applyMasonChildLayout(f.node, {})
	assert.equal(f.leaf().display, 'none')
	f.classStyle({ display: 'none', visibility: 'visible' })
	assert.equal(f.leaf().display, 'none')

	f.classStyle({ visibility: 'collapse' })
	f.view.nativeViewProtected = {}
	f.view.emit('loaded')
	assert.equal(f.leaf().display, 'none')
	api.releaseMasonChildLayout(f.view)
	assert.equal(f.view.style.listenerCount(), 0)
	f.classStyle({ visibility: 'visible' })
	api.applyMasonChildLayout(f.node, {})
	assert.equal(f.leaf().display, 'flex')
})
