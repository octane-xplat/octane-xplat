import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'
import { borderStyleSides, hiddenBorderStyle, borderStrokeStyle, borderBands, borderBandPoints, darkBorderComponents } from '../src/border-styles.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const SLICE =
	source.slice(source.indexOf('function outlineSpec'), source.indexOf('// ---- Background layers')) +
	'\n({ outlineSpec, syncOutline })'

function harness(style: any) {
	const observerTokens: any[] = []
	let resize: any
	const shapes: any[] = []
	const makeShape = () => {
		const s: any = {
			addSublayer(l: any) { l.superlayer = this },
			removeFromSuperlayer() { this.superlayer = null },
		}
		shapes.push(s)
		return s
	}
	const ctx = {
		borderStyleSides, hiddenBorderStyle, borderStrokeStyle, borderBands, borderBandPoints, darkBorderComponents,
		BORDER_CORNERS: ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'],
		BORDER_SIDES: ['top', 'right', 'bottom', 'left'],
		BORDER_STYLE_WORDS: new Set(['none', 'hidden', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset']),
		CALayer: { alloc: () => ({ init: makeShape }) },
		CAShapeLayer: { alloc: () => ({ init: makeShape }) },
		CGPathCreateMutable: () => ({}),
		borderBandCGPath: (points: any) => points,
		borderStrokeCGPath: (_w: any, _h: any, _r: any, width: any) => ({ stroke: width }),
		roundedBoxCGPath: () => ({}),
		resolveBorderRadii: () => ({ topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 }),
		scaleBorderRadii: (r: any) => r,
		correctProjectionRadii: (_v: any, r: any) => r,
		NSNumber: { numberWithDouble: (v: number) => v },
		NSColor: { keyboardFocusIndicatorColor: { CGColor: 'focus' }, colorWithSRGBRedGreenBlueAlpha: () => ({ CGColor: 'dark' }) },
		nativeColor: (c: any) => ({ CGColor: 'cg:' + c }),
		srgbComponents: () => ({ red: 0.5, green: 0.5, blue: 0.5, alpha: 1 }),
		effectiveStyle: () => style,
		NSNotificationCenter: { defaultCenter: {
			addObserverForNameObjectQueueUsingBlock(_n: any, _v: any, _q: any, cb: any) { resize = cb; const t = {}; observerTokens.push(t); return t },
			removeObserver(t: any) { observerTokens.splice(observerTokens.indexOf(t), 1) },
		} },
		NSViewFrameDidChangeNotification: 'frame',
		console,
	}
	const api = runSlice(SLICE, ctx)
	const node: any = { view: { wantsLayer: false, flipped: false, bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 40 } }, layer: { addSublayer(l: any) { l.superlayer = this }, cornerRadius: 4 } } }
	return { api, node, shapes, observerTokens, fireResize: () => resize?.() }
}

test('outlineSpec parses shorthand and longhands, none clears', () => {
	const { api } = harness({})
	assert.equal(api.outlineSpec({ outline: '2px dashed red' })?.style, 'dashed')
	assert.equal(api.outlineSpec({ outline: '2px dashed red' })?.width, 2)
	assert.equal(api.outlineSpec({ outlineStyle: 'dotted', outlineWidth: 3, outlineOffset: 2 })?.offset, 2)
	assert.equal(api.outlineSpec({ outline: 'none' }), null)
	assert.equal(api.outlineSpec({ outlineWidth: 0 }), null)
	assert.equal(api.outlineSpec({ outlineStyle: 'auto' })?.style ?? null, null)
	assert.equal(api.outlineSpec({ outlineStyle: 'auto', outlineWidth: 2 })?.style, 'solid')
})

test('dashed outline strokes the centered expanded path; resize repaints', () => {
	const { api, node, fireResize } = harness({ outline: '2px dashed red', outlineOffset: 1 })
	api.syncOutline(node)
	const host = node.outlineLayer
	assert.ok(host)
	assert.equal(host.borderWidth ?? 0, 0)
	const shape = node.outlineShapes.stroke
	assert.ok(shape)
	assert.equal(shape.strokeColor, 'cg:red')
	assert.equal(shape.lineWidth, 2)
	assert.deepEqual(Array.from(shape.lineDashPattern), [6, 6])
	assert.equal(shape.path.stroke, 2)
	node.view.bounds = { origin: { x: 0, y: 0 }, size: { width: 200, height: 60 } }
	fireResize()
	assert.equal(host.frame.size.width, 200 + 2 * (1 + 2))
})

test('double outline paints per-side bands; groove shades dark', () => {
	const { api, node } = harness({ outline: '6px double #888' })
	api.syncOutline(node)
	assert.ok(node.outlineMask)
	const sides = node.outlineShapes
	assert.equal(sides.top.length, 2, 'double = two bands per side')
	assert.ok(sides.top.every((s: any) => s.fillColor === 'cg:#888'))
	const { api: api2, node: node2 } = harness({ outline: '4px groove #888' })
	api2.syncOutline(node2)
	const tops = node2.outlineShapes.top
	assert.equal(tops.length, 2)
	assert.equal(tops[0].fillColor, 'dark', 'groove outer top band shades dark')
	assert.equal(tops[1].fillColor, 'cg:#888')
})

test('solid keeps the CALayer border fast path; removal tears down', () => {
	const { api, node, observerTokens } = harness({ outline: '2px solid blue' })
	api.syncOutline(node)
	const host = node.outlineLayer
	assert.equal(host.borderWidth, 2)
	assert.equal(host.borderColor, 'cg:blue')
	assert.equal(host.cornerRadius, 4 + 2)
	node.view.layer = null
	api.syncOutline(node)
	// re-run with no spec clears the observer
	const { api: api3, node: node3 } = harness({})
	api3.syncOutline(node3)
	assert.equal(node3.outlineLayer, null)
	assert.equal(observerTokens.length, 0)
})
