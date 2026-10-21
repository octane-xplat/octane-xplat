import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(
	new URL('../src/ios/liquid-glass-view.ios.ts', import.meta.url),
	'utf8',
)

const compiled = ts.transpile(source, {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
})

const containerSource = await readFile(
	new URL('../src/ios/liquid-glass-container-view.ios.ts', import.meta.url),
	'utf8',
)

const containerCompiled = ts.transpile(containerSource, {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
})

const PAD_BORDER_FIELDS = [
	'effectivePaddingLeft',
	'effectivePaddingTop',
	'effectivePaddingRight',
	'effectivePaddingBottom',
	'effectiveBorderLeftWidth',
	'effectiveBorderTopWidth',
	'effectiveBorderRightWidth',
	'effectiveBorderBottomWidth',
]

// Records the border-box spec minus the effective padding/border the child
// sees, like a real layout measuring its content.
function recordingMeasure(calls) {
	return function (width, _height) {
		const left = (this.effectivePaddingLeft ?? 0) + (this.effectiveBorderLeftWidth ?? 0)
		const right = (this.effectivePaddingRight ?? 0) + (this.effectiveBorderRightWidth ?? 0)
		calls.push(['measure', { left, right, content: width - left - right }])
	}
}

// Mimics core 9.1.3's zero-padding onMeasure (NativeScript#11134): the
// glass classes save, zero all eight effective padding/border fields, call
// the real layout's onMeasure, and restore.
function zeroPadBorder(self, fn) {
	const saved = {}
	for (const field of PAD_BORDER_FIELDS) {
		saved[field] = self[field] ?? 0
		self[field] = 0
	}
	try {
		return fn()
	} finally {
		for (const field of PAD_BORDER_FIELDS) {
			self[field] = saved[field]
		}
	}
}

function fixture(glassSupported) {
	const setter = 'setGlassEffect'
	const calls = []
	class GridLayout {}
	GridLayout.prototype.onMeasure = recordingMeasure(calls)
	class CoreLiquidGlass extends GridLayout {
		onMeasure(width, height) {
			return zeroPadBorder(this, () => super.onMeasure(width, height))
		}
		createNativeView() {
			// Model core's root and child host, not UIKit hit testing.
			const view = {
				effect: { kind: glassSupported ? 'glass' : 'empty' },
				contentView: { host: {} },
			}

			calls.push(['create', view])
			return view
		}
		[setter](value) {
			return this._applyGlassEffect(value, {
				effectType: 'glass',
				targetView: this.nativeViewProtected,
			})
		}
		_applyGlassEffect(value, options) {
			calls.push(['set', value, options])
			options.targetView.effect = { kind: glassSupported ? 'glass' : 'empty', value }
		}
		disposeNativeView() {
			calls.push(['dispose', this.nativeViewProtected])
			this.nativeViewProtected = undefined
		}
	}

	const core = {
		GridLayout,
		LiquidGlass: CoreLiquidGlass,
		Utils: { supportsGlass: () => glassSupported },
	}

	const blurEffect = { effectWithStyle: (style) => ({ kind: 'blur', style }) }

	const context = vm.createContext({
		exports: {},
		require: (name) => {
			if (name === '@nativescript/core') {
				return core
			}

			if (name === '@octane-xplat/platform/ios') {
				return { UIBlurEffect: blurEffect }
			}

			throw new Error(`Unexpected import: ${name}`)
		},
		UIBlurEffect: blurEffect,
	})

	vm.runInContext(compiled, context)
	return { view: new context.exports.LiquidGlassView(), calls, setter, CoreLiquidGlass }
}

function containerFixture() {
	const calls = []
	class AbsoluteLayout {}
	AbsoluteLayout.prototype.onMeasure = recordingMeasure(calls)
	class CoreLiquidGlassContainer extends AbsoluteLayout {
		onMeasure(width, height) {
			return zeroPadBorder(this, () => super.onMeasure(width, height))
		}
	}

	const core = {
		AbsoluteLayout,
		LiquidGlassContainer: CoreLiquidGlassContainer,
	}

	const context = vm.createContext({
		exports: {},
		require: (name) => {
			if (name === '@nativescript/core') {
				return core
			}

			throw new Error(`Unexpected import: ${name}`)
		},
	})

	vm.runInContext(containerCompiled, context)
	return {
		view: new context.exports.LiquidGlassContainerView(),
		calls,
		CoreLiquidGlassContainer,
	}
}

test('older iOS installs material on the same core root without replacing the child host', () => {
	const { view, calls } = fixture(false)
	const root = view.createNativeView()
	assert.equal(root, calls[0][1])
	assert.ok(root.contentView.host)
	assert.deepEqual(root.effect, { kind: 'blur', style: 8 })
})

test('older iOS property replay and updates preserve blur instead of an empty core effect', () => {
	const { view, calls, setter } = fixture(false)
	view.nativeViewProtected = view.createNativeView()
	for (const value of [
		{ variant: 'regular' },
		{ variant: 'clear', interactive: true, tint: '#fff' },
	]) {
		view[setter](value)
		assert.deepEqual(view.nativeViewProtected.effect, { kind: 'blur', style: 8 })
	}

	assert.equal(calls.filter(([name]) => name === 'set').length, 0)
})

test('iOS 26+ forwards the exact config including explicit interaction and tint to core', () => {
	const { view, calls, setter } = fixture(true)
	view.nativeViewProtected = view.createNativeView()
	assert.equal(view.nativeViewProtected.effect.kind, 'glass')
	for (const interactive of [false, true]) {
		const config = { variant: 'clear', interactive, tint: '#123456', animateChangeDuration: 0 }
		view[setter](config)
		assert.equal(calls.at(-1)[1], config)
		assert.equal(calls.at(-1)[2].targetView, view.nativeViewProtected)
		assert.equal(calls.at(-1)[2].effectType, 'glass')
		assert.equal(view.nativeViewProtected.effect.value, config)
	}
})

test('native disposal stays inherited and a recreated root gets its own fallback', () => {
	const { view, calls } = fixture(false)
	const first = view.createNativeView()
	view.nativeViewProtected = first
	view.disposeNativeView()
	assert.equal(view.nativeViewProtected, undefined)
	assert.equal(calls.at(-1)[0], 'dispose')
	const second = view.createNativeView()
	assert.notEqual(first, second)
	assert.notEqual(first.contentView.host, second.contentView.host)
	assert.deepEqual(second.effect, { kind: 'blur', style: 8 })
})

test('component registers the adapter and defaults interaction off while keeping layout and escapes', async () => {
	const leaf = await readFile(new URL('../src/ios/LiquidGlass.ios.tsrx', import.meta.url), 'utf8')
	assert.match(leaf, /registerElement\('liquidglass', LiquidGlassView\)/)
	assert.match(leaf, /interactive: props\.interactive \?\? false/)
	assert.match(leaf, /applyEscapeProps\(v, props\)/)
	assert.match(leaf, /layoutChildProps\(props/)
	assert.match(leaf, /\{props\.children\}/)
})

test('LiquidGlass measures its content inside effective padding (issue #37)', () => {
	const { view, calls, CoreLiquidGlass } = fixture(true)
	view.effectivePaddingLeft = 19
	view.effectivePaddingRight = 19
	view.onMeasure(353, 82)
	assert.deepEqual(calls.at(-1), ['measure', { left: 19, right: 19, content: 315 }])
	assert.equal(view.effectivePaddingLeft, 19)
	assert.equal(view.effectivePaddingRight, 19)

	// Fixture sanity: core's zero-padding onMeasure reproduces the bug.
	calls.length = 0
	CoreLiquidGlass.prototype.onMeasure.call(view, 353, 82)
	assert.deepEqual(calls.at(-1), ['measure', { left: 0, right: 0, content: 353 }])
	assert.equal(view.effectivePaddingLeft, 19)
})

test('LiquidGlassContainer measures its content inside effective padding (issue #37)', () => {
	const { view, calls, CoreLiquidGlassContainer } = containerFixture()
	view.effectivePaddingLeft = 19
	view.effectivePaddingRight = 19
	view.onMeasure(353, 82)
	assert.deepEqual(calls.at(-1), ['measure', { left: 19, right: 19, content: 315 }])
	assert.equal(view.effectivePaddingLeft, 19)
	assert.equal(view.effectivePaddingRight, 19)

	calls.length = 0
	CoreLiquidGlassContainer.prototype.onMeasure.call(view, 353, 82)
	assert.deepEqual(calls.at(-1), ['measure', { left: 0, right: 0, content: 353 }])
	assert.equal(view.effectivePaddingLeft, 19)
})

test('container registers the padding-aware core view', async () => {
	const leaf = await readFile(
		new URL('../src/ios/LiquidGlassContainer.ios.tsrx', import.meta.url),
		'utf8',
	)
	assert.match(leaf, /registerElement\('liquidglasscontainer', LiquidGlassContainerView\)/)
})
