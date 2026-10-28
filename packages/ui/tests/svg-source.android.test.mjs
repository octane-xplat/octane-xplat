import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(
	new URL('../src/vendor/ui-svg/src/index.android.ts', import.meta.url),
	'utf8',
)

const compiled = ts.transpile(source, {
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES2022,
})

const markup = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"/>'

function fixture() {
	const setNative = Symbol('setNative')
	let dirty = true
	let requests = 0
	let measurements = 0
	const assignments = []
	class View {
		requestLayout() {
			// Model the NativeScript measurement cache: drawing invalidation alone
			// must not allow the next layout pass to reuse the empty measurement.
			assert.equal(this.nativeViewProtected._svg, assignments.at(-1))
			dirty = true
			requests++
		}
	}
	const layout = {
		EXACTLY: 1,
		getMeasureSpecMode: (spec) => spec.mode,
		getMeasureSpecSize: (spec) => spec.size,
		makeMeasureSpec: (size, mode) => ({ size, mode }),
		toDevicePixels: (value) => value,
	}
	const context = vm.createContext({
		exports: {},
		// handleSrc uses instanceof Promise; deferred sources share this realm.
		Promise,
		require(name) {
			if (name === './index.common') {
				return { SVGView: View, srcProperty: { setNative } }
			}
			assert.equal(name, '@nativescript/core')
			return {
				File: class {},
				ImageAsset: class {},
				Utils: { layout, isFileOrResourcePath: () => false },
			}
		},
		com: {
			caverock: {
				androidsvg: {
					SVGExternalFileResolver: class {},
					SVG: {
						registerExternalFileResolver() {},
						getFromString(value) {
							assert.equal(value, markup)
							const svg = {
								setDocumentWidth() {},
								setDocumentHeight() {},
								getDocumentViewBox: () => ({ width: () => 24, height: () => 24 }),
							}
							return svg
						},
					},
				},
			},
		},
		android: {
			view: {
				View: {
					extend: (methods) =>
						class {
							constructor() {
								Object.assign(this, methods)
							}
							invalidate() {
								assignments.push(this._svg)
							}
							getSuggestedMinimumWidth() {
								return 0
							}
							getSuggestedMinimumHeight() {
								return 0
							}
							setMeasuredDimension(width, height) {
								this.size = [width, height]
							}
						},
					getDefaultSize: (_minimum, spec) => spec.size,
				},
			},
		},
	})
	vm.runInContext(compiled, context)
	const view = new context.exports.SVGView()
	view.nativeViewProtected = view.createNativeView()
	return {
		view,
		setSource: (value) => view[setNative](value),
		get requests() {
			return requests
		},
		get measurements() {
			return measurements
		},
		layout() {
			if (dirty) {
				view.nativeViewProtected.onMeasure({ size: 54, mode: 1 }, { size: 0, mode: 0 })
				dirty = false
				measurements++
			}
			return view.nativeViewProtected.size
		},
	}
}

test('Android SVG remeasures when a delayed source completes after the first layout', async () => {
	const f = fixture()
	let complete
	const pending = new Promise((resolve) => {
		complete = resolve
	})
	f.setSource(pending)
	assert.deepEqual(f.layout(), [54, 0])
	assert.equal(f.requests, 0)
	// Give the initial layout a full turn before delivering the remote markup.
	await new Promise(setImmediate)
	assert.deepEqual(f.layout(), [54, 0])
	assert.equal(f.measurements, 1)
	complete(markup)
	await pending
	await new Promise(setImmediate)
	assert.ok(f.view.nativeViewProtected._svg)
	assert.deepEqual(f.layout(), [54, 54])
	assert.equal(f.requests, 1)
	assert.equal(f.measurements, 2)
})

test('Android SVG synchronous sources still request layout after assignment', async () => {
	const f = fixture()
	await f.view.handleSrc(markup)
	assert.deepEqual(f.layout(), [54, 54])
	assert.equal(f.requests, 1)
})

test('Android SVG rejected sources clear the image and request another layout', async () => {
	const f = fixture()
	await f.view.handleSrc(markup)
	f.layout()
	// Clearing is represented by a null native assignment.
	await f.view.handleSrc(Promise.reject(new Error('fetch failed')))
	assert.equal(f.view.nativeViewProtected._svg, null)
	assert.equal(f.requests, 2)
	assert.deepEqual(f.layout(), [54, 0])
})
