import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(
	new URL('../src/vendor/ui-svg/src/index.ios.ts', import.meta.url),
	'utf8',
)

const compiled = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

const EXACTLY = 0x40000000
const UNSPECIFIED = 0
const layout = {
	EXACTLY,
	getMeasureSpecSize: (spec) => spec & 0x3fffffff,
	getMeasureSpecMode: (spec) => spec & 0xc0000000,
	makeMeasureSpec: (size, mode) => Math.round(size) | mode,
	toDevicePixels: (size) => size * 3,
}

class Base {
	onMeasure(width, height) {
		this.measured = [width, height]
	}
}

const exports = {}
runInNewContext(compiled, {
	exports,
	require(name) {
		if (name === '@nativescript/core') {
			return { Utils: { layout } }
		}
		if (name === './index.common') {
			return {
				SVGView: Base,
				srcProperty: { setNative: Symbol('src') },
				stretchProperty: { setNative: Symbol('stretch') },
			}
		}
		throw new Error(`Unexpected import: ${name}`)
	},
})

function measure(width, height, ratio = 0) {
	const view = new exports.SVGView()
	view.nativeViewProtected = { image: { size: { width: 31, height: 36 } } }
	view.aspectRatio = ratio
	view.onMeasure(width, height)
	return view.measured.map(layout.getMeasureSpecSize)
}

test('width-only non-square SVG preserves intrinsic ratio at native pixel density', () => {
	assert.deepEqual(measure(layout.makeMeasureSpec(93, EXACTLY), UNSPECIFIED), [93, 108])
})

test('height-only non-square SVG preserves intrinsic ratio', () => {
	assert.deepEqual(measure(UNSPECIFIED, layout.makeMeasureSpec(108, EXACTLY)), [93, 108])
})

test('explicit dimensions stay exact; an authored ratio controls inferred height', () => {
	assert.deepEqual(
		measure(layout.makeMeasureSpec(93, EXACTLY), layout.makeMeasureSpec(108, EXACTLY)),
		[93, 108],
	)
	assert.deepEqual(measure(layout.makeMeasureSpec(90, EXACTLY), UNSPECIFIED, 2), [90, 45])
})
