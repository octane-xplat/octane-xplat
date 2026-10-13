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

function fixture(glassSupported) {
	const setter = 'setGlassEffect'
	const calls = []
	class CoreLiquidGlass {
		createNativeView() {
			// Model core's root and child host, not UIKit hit testing.
			const view = { effect: { kind: glassSupported ? 'glass' : 'empty' }, contentView: { host: {} } }
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
		LiquidGlass: CoreLiquidGlass,
		Utils: { supportsGlass: () => glassSupported },
	}

	const context = vm.createContext({
		exports: {},
		require: (name) => {
			if (name === '@nativescript/core') {
				return core
			}

			throw new Error(`Unexpected import: ${name}`)
		},
		UIBlurEffect: { effectWithStyle: (style) => ({ kind: 'blur', style }) },
	})

	vm.runInContext(compiled, context)
	return { view: new context.exports.LiquidGlassView(), calls, setter }
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
	assert.match(leaf, /layoutChildProps\(props\)/)
	assert.match(leaf, /\{props\.children\}/)
})
