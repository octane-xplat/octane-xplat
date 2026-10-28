import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { mockGlobals, runSlice, sourceWithoutImports } from './mock-globals.ts'
import { srgbComponents } from '../src/color-components.ts'
import { parseHtmlText } from '../src/html-text.ts'

// AppKit resolves a catalog color against the current drawing appearance;
// its component getters raise "-redComponent not valid for the NSColor
// Catalog color", which aborts the process instead of throwing into JS.
let drawingAppearance = 'aqua'
const touched: string[] = []
const appearance = (name: string) => ({
	name,
	performAsCurrentDrawingAppearance(block: () => void) {
		const previous = drawingAppearance
		drawingAppearance = name
		try {
			block()
		} finally {
			drawingAppearance = previous
		}
	},
})

const darkAqua = appearance('darkAqua')
const catalogColor = (convert: () => any) => {
	const color: any = { colorUsingColorSpace: (space: string) => (space === 'srgb' ? convert() : null) }
	for (const key of ['redComponent', 'greenComponent', 'blueComponent']) {
		Object.defineProperty(color, key, {
			get() {
				touched.push(key)
				throw new Error(`-${key} not valid for the NSColor Catalog color: System labelColor`)
			},
		})
	}
	return color
}

const labelColor = catalogColor(() =>
	drawingAppearance === 'darkAqua'
		? { redComponent: 1, greenComponent: 1, blueComponent: 1, alphaComponent: 0.85 }
		: { redComponent: 0, greenComponent: 0, blueComponent: 0, alphaComponent: 0.85 },
)

const patternColor = catalogColor(() => null)
let imported = ''
let restore: () => void
beforeEach(() => {
	drawingAppearance = 'aqua'
	touched.length = 0
	restore = mockGlobals({
		NSColorSpace: { sRGBColorSpace: 'srgb' },
		NSString: {
			stringWithString: (value: string) => ({ dataUsingEncoding: () => (imported = value) }),
		},
		NSAttributedString: {
			alloc: () => ({ initWithDataOptionsDocumentAttributesError: () => ({ string: 'parsed' }) }),
		},
	})
})

afterEach(() => {
	restore()
	assert.deepEqual(touched, [], 'read components on an unconverted catalog color')
})

const html = { fontSize: 16, fontFamily: 'System', fontWeight: '400', style: {} }

test('catalog colors resolve to sRGB under the supplied appearance', () => {
	assert.deepEqual(srgbComponents(labelColor), { red: 0, green: 0, blue: 0, alpha: 0.85 })
	assert.deepEqual(srgbComponents(labelColor, darkAqua), { red: 1, green: 1, blue: 1, alpha: 0.85 })
	assert.equal(drawingAppearance, 'aqua')
})

test('a catalog color without an sRGB equivalent reports nothing', () => {
	assert.equal(srgbComponents(patternColor, darkAqua), null)
	assert.equal(srgbComponents(null), null)
})

test('HtmlView bakes labelColor resolved under the view appearance into its body CSS', () => {
	parseHtmlText('<b>hi</b>', { ...html, color: labelColor, appearance: darkAqua })
	assert.match(imported, /color:rgb\(255,255,255\)/)
	parseHtmlText('<b>hi</b>', { ...html, color: labelColor })
	assert.match(imported, /color:rgb\(0,0,0\)/)
})

test('HtmlView leaves an unconvertible default color to the HTML importer', () => {
	assert.equal(parseHtmlText('<b>hi</b>', { ...html, color: patternColor }).string, 'parsed')
	assert.doesNotMatch(imported, /color:/)
})

test('parity colorValue resolves catalog colors under the view appearance', () => {
	const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
	const { colorValue } = runSlice(
		source.slice(source.indexOf('function colorValue('), source.indexOf('function parityStyle(')) +
			'\n({ colorValue })',
		{ srgbComponents },
	)

	assert.equal(colorValue(labelColor), '#000000')
	assert.equal(colorValue(labelColor, darkAqua), '#ffffff')
	assert.equal(colorValue(patternColor, darkAqua), undefined)
})
