import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'
import {
	collectBackground,
	positioningBox,
	resolveImageSize,
	resolveStops,
	tileRects,
} from '../src/background-layers.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const SLICE =
	source.slice(source.indexOf('// ---- Background layers'), source.indexOf('const BORDER_SIDES')) +
	'\n({ syncBackgrounds, paintBackgrounds, clearBackgrounds })'

function harness() {
	const created: any[] = []
	const makeLayer = () => {
		const layer: any = {
			children: [] as any[],
			addSublayer(l: any) { this.children.push(l); l.superlayer = this },
			insertSublayerAtIndex(l: any, i: number) { this.children.splice(i, 0, l); l.superlayer = this },
			removeFromSuperlayer() { this.superlayer?.children?.splice(this.superlayer.children.indexOf(this), 1); this.superlayer = null },
		}
		created.push(layer)
		return layer
	}
	const releases: string[] = []
	const ctx = {
		collectBackground, positioningBox, resolveImageSize, resolveStops, tileRects,
		BORDER_CORNERS: ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'],
		CALayer: { alloc: () => ({ init: makeLayer }) },
		CAShapeLayer: { alloc: () => ({ init: makeLayer }) },
		CAGradientLayer: { layer: makeLayer },
		NSNumber: { numberWithDouble: (v: number) => v },
		NSImage: { alloc: () => ({ initWithSize: () => ({ lockFocusFlipped() {}, unlockFocus() {}, CGImageForProposedRectContextHints: () => ({}) }) }) },
		nativeColor: (c: any) => ({ CGColor: c }),
		requestImage: (url: string, deliver: any) => { ctx.delivered?.(url, deliver); return () => releases.push(url) },
		borderStyleSides: () => ({ top: 'solid', right: 'solid', bottom: 'solid', left: 'solid' }),
		hiddenBorderStyle: () => false,
		borderLength: (v: any) => Number(v) || 0,
		parseEdgeInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
		resolveBorderRadii: () => ({ topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 }),
		scaleBorderRadii: (r: any) => r,
		correctProjectionRadii: (_v: any, r: any) => r,
		roundedBoxCGPath: () => ({}),
		effectiveStyle: (n: any) => n.computedStyle ?? {},
		console,
		delivered: undefined as any,
	}
	const api = runSlice(SLICE, ctx)
	return { api, ctx, created, releases }
}

const node = (style: any) => ({
	view: { flipped: false, wantsLayer: false, bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 40 } }, layer: makeLayer() },
	computedStyle: style,
})

function makeLayer(): any {
	const l: any = {
		children: [] as any[],
		superlayer: null,
		addSublayer(c: any) { this.children.push(c); c.superlayer = this },
		insertSublayerAtIndex(c: any, i: number) { this.children.splice(i, 0, c); c.superlayer = this },
		removeFromSuperlayer() { this.superlayer?.children?.splice(this.superlayer.children.indexOf(this), 1); this.superlayer = null },
	}
	return l
}

test('a gradient layer paints stops, resizes with the host, and clears', () => {
	const { api } = harness()
	const n = node({ backgroundImage: 'linear-gradient(to right, red, blue)' }) as any
	api.syncBackgrounds(n)
	const host = n.bgHost
	assert.ok(host)
	assert.equal(n.view.layer.children[0], host)
	assert.equal(host.children.length, 1)
	const g = host.children[0]
	assert.deepEqual(Array.from(g.colors), ['red', 'blue'])
	assert.deepEqual(Array.from(g.locations), [0, 1])
	assert.equal(g.startPoint.x, 0)
	assert.equal(g.endPoint.x, 1)
	n.view.bounds = { origin: { x: 0, y: 0 }, size: { width: 200, height: 60 } }
	api.paintBackgrounds(n)
	assert.equal(host.frame.size.width, 200)
	n.computedStyle = {}
	api.syncBackgrounds(n)
	assert.equal(n.bgHost, undefined)
	assert.equal(host.superlayer, null)
})

test('multiple layers keep CSS first-on-top order under the border layer', () => {
	const { api } = harness()
	const n = node({
		backgroundImage: 'linear-gradient(red, blue), url(~/tile.png), radial-gradient(circle, white, black)',
		borderStyle: 'solid',
	}) as any
	api.syncBackgrounds(n)
	const host = n.bgHost
	assert.equal(host.children.length, 3)
	assert.equal(host.children[0].type, 'axial')
	assert.equal(host.children[2].type, 'radial')
	assert.ok(Number(host.children[0].zPosition) > Number(host.children[2].zPosition), 'first layer on top')
})

test('url() layers subscribe to image loads and release on rebuild/teardown', () => {
	const { api, ctx, releases } = harness()
	const n = node({ backgroundImage: 'url(~/tile.png)' }) as any
	let deliver: any
	ctx.delivered = (_url: string, d: any) => { deliver = d }
	api.syncBackgrounds(n)
	assert.ok(deliver)
	const entry = n.bgPainted[0]
	const image = { size: { width: 10, height: 10 }, drawInRect() {} }
	deliver(image)
	assert.equal(entry.image, image)
	n.computedStyle = { backgroundImage: 'linear-gradient(red, blue)' }
	api.syncBackgrounds(n)
	assert.deepEqual(releases, ['~/tile.png'])
})

test('the shorthand routes its color to backgroundColor and warns on junk', () => {
	const { api } = harness()
	const warnings: string[] = []
	const orig = console.warn
	console.warn = (m: string) => warnings.push(m)
	try {
		const n = node({ background: 'url(a.png) center/cover #123456', backgroundBlendMode: 'screen' }) as any
		api.syncBackgrounds(n)
		assert.equal(n.styleBg, '#123456')
		assert.equal(n.view.layer.backgroundColor, '#123456')
		assert.ok(warnings.some((m) => m.includes('backgroundBlendMode')))
	} finally {
		console.warn = orig
	}
})
