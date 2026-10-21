import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(
	new URL('../src/vendor/ui-svg/src/index.android.ts', import.meta.url),
	'utf8',
)
const compiled = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const EXACTLY = 0x40000000
const AT_MOST = 0x80000000
const UNSPECIFIED = 0
const layout = {
	EXACTLY,
	AT_MOST,
	UNSPECIFIED,
	getMeasureSpecSize: (spec) => spec & 0x3fffffff,
	getMeasureSpecMode: (spec) => spec & 0xc0000000,
	makeMeasureSpec: (size, mode) => Math.round(size) | mode,
	toDevicePixels: (size) => size * 3,
}
// android.view.View.extend captures the literal so tests can instantiate it.
let viewLiteral
class AndroidView {
	constructor() {
		Object.assign(this, viewLiteral)
	}
	getSuggestedMinimumWidth() {
		return 0
	}
	getSuggestedMinimumHeight() {
		return 0
	}
	setMeasuredDimension(w, h) {
		this.measured = [w, h]
	}
	invalidate() {}
	static getDefaultSize(_suggested, spec) {
		return layout.getMeasureSpecSize(spec)
	}
}
AndroidView.extend = (literal) => {
	viewLiteral = literal
	return class extends AndroidView {}
}
const exports = {}
runInNewContext(compiled, {
	exports,
	require(name) {
		if (name === '@nativescript/core') {
			return {
				Utils: { layout },
				ImageSource: {},
				ImageAsset: class {},
				File: class {},
				knownFolders: { currentApp: () => ({ path: '' }) },
				path: { join: (...a) => a.join('/') },
				Trace: { write() {}, categories: { Error: 0 } },
			}
		}
		if (name === './index.common') {
			class Base {
				requestLayout() {}
			}
			return {
				SVGView: Base,
				srcProperty: { setNative: Symbol('src') },
				stretchProperty: { setNative: Symbol('stretch') },
			}
		}
		throw new Error(`Unexpected import: ${name}`)
	},
	globalAndroid: {},
	com: {
		caverock: {
			androidsvg: {
				SVG: { registerExternalFileResolver() {} },
				SVGExternalFileResolver: class {},
				RenderOptions: class {
					viewPort() {}
					preserveAspectRatio() {}
				},
			},
		},
	},
	android: { view: { View: AndroidView } },
})

const fakeSvg = ({ viewBox, docWidth, docHeight }) => ({
	getDocumentViewBox: () => viewBox ?? null,
	getDocumentWidth: () => docWidth ?? -1,
	getDocumentHeight: () => docHeight ?? -1,
	setDocumentWidth() {},
	setDocumentHeight() {},
})

function measure({ viewBox, docWidth, docHeight, widthSpec, heightSpec, ratio = 0 }) {
	const view = new AndroidView()
	Object.assign(view, viewLiteral)
	view.aspectRatio = ratio
	view.setSvg(fakeSvg({ viewBox, docWidth, docHeight }))
	view.onMeasure(widthSpec, heightSpec)
	return view.measured.map(layout.getMeasureSpecSize)
}
const exactly = layout.makeMeasureSpec

test('viewBox intrinsic, width-only spec preserves ratio at 3x density', () => {
	assert.deepEqual(
		measure({ viewBox: { width: () => 31, height: () => 36 }, widthSpec: exactly(93, EXACTLY), heightSpec: UNSPECIFIED }),
		[93, 108],
	)
})

test('no viewBox falls back to document width/height (probe fixture shape)', () => {
	assert.deepEqual(
		measure({ docWidth: 31, docHeight: 36, widthSpec: exactly(93, EXACTLY), heightSpec: UNSPECIFIED }),
		[93, 108],
	)
})

test('viewBox intrinsic, height-only spec preserves ratio', () => {
	assert.deepEqual(
		measure({ viewBox: { width: () => 31, height: () => 36 }, widthSpec: UNSPECIFIED, heightSpec: exactly(108, EXACTLY) }),
		[93, 108],
	)
})

test('explicit dimensions stay exact; an authored ratio controls inferred height', () => {
	assert.deepEqual(
		measure({ viewBox: { width: () => 31, height: () => 36 }, widthSpec: exactly(93, EXACTLY), heightSpec: exactly(108, EXACTLY) }),
		[93, 108],
	)
	assert.deepEqual(
		measure({ widthSpec: exactly(90, EXACTLY), heightSpec: UNSPECIFIED, ratio: 2 }),
		[90, 45],
	)
})

test('no intrinsic size and no aspectRatio falls through to spec sizes', () => {
	assert.deepEqual(
		measure({ widthSpec: exactly(93, EXACTLY), heightSpec: UNSPECIFIED }),
		[93, 0],
	)
})

test('setSvg(null) resets the intrinsic size', () => {
	const view = new AndroidView()
	Object.assign(view, viewLiteral)
	view.setSvg(fakeSvg({ docWidth: 31, docHeight: 36 }))
	assert.equal(view._intrinsicWidth, 31)
	view.setSvg(null)
	assert.equal(view._intrinsicWidth, 0)
	assert.equal(view._intrinsicHeight, 0)
	view.onMeasure(exactly(93, EXACTLY), UNSPECIFIED)
	assert.deepEqual(view.measured, [93, 0])
})
