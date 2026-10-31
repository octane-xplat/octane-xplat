import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'

const source = sourceWithoutImports(new URL('../src/index.ts', import.meta.url))
const SLICE =
	source.slice(source.indexOf('function outsetShadowOnSelf'), source.indexOf('// ---- transforms')) +
	'\n({ syncBoxShadow, outsetShadowOnSelf, siblingShadowSuperlayer })'

const R = { topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 }

function harness() {
	const created: any[] = []
	const mk = () => { const l: any = {
		removeFromSuperlayer() { this.removed = true },
		addSublayer(c: any) { c.superlayer = this },
		insertSublayerAtIndex(c: any, _i: number) { c.superlayer = this },
	}; created.push(l); return l }
	const ctx = {
		BorderCorner: undefined,
		ZERO_RADII: R,
		CALayer: { alloc: () => ({ init: mk }) },
		CAShapeLayer: { alloc: () => ({ init: mk }) },
		CGPathCreateMutable: () => ({ rect: true }),
		roundedBoxCGPath: (w: number, h: number, _r: any, dx = 0, dy = 0, existing?: any) => {
			if (existing) { existing.inner = { w, h, dx, dy }; return existing }
			return { w, h }
		},
		correctProjectionShadows: (_v: any, s: any) => s,
		resolveBorderRadii: () => R,
		scaleBorderRadii: (r: any) => r,
		correctProjectionRadii: (_v: any, r: any) => r,
		borderNSColor: (_n: any, c: any) => ({ CGColor: 'cg:' + c }),
		console,
	}
	return { api: runSlice(SLICE, ctx), created }
}

const makeView = (withSuperlayer = true) => {
	const layer: any = {
		superlayer: null,
		sublayers: [] as any[],
		insertSublayerAtIndex(l: any, i: number) { this.sublayers.splice(i, 0, l); l.superlayer = this },
	}
	if (withSuperlayer) {
		layer.superlayer = {
			sublayers: [layer] as any[],
			insertSublayerBelow(l: any, below: any) { this.sublayers.splice(this.sublayers.indexOf(below), 0, l); l.superlayer = this },
			insertSublayerAtIndex(l: any, i: number) { this.sublayers.splice(i, 0, l); l.superlayer = this },
		}
	}
	return { frame: { size: { width: 100, height: 40 } }, bounds: { size: { width: 100, height: 40 } }, layer, flipped: false }
}

test('multiple outset shadows paint one sibling host each below the view layer', () => {
	const { api } = harness()
	const view = makeView()
	const node: any = { view, borderSpec: null, boxShadowSpec: [
		{ inset: false, dx: 0, dy: 4, blur: 8, spread: 0, color: 'red' },
		{ inset: false, dx: 2, dy: 0, blur: 3, spread: 1, color: 'blue' },
	] }
	api.syncBoxShadow(node)
	const hosts = node.outsetShadowHosts
	assert.equal(hosts.length, 2)
	const order = view.layer.superlayer.sublayers
	assert.equal(order.indexOf(hosts[1]) < order.indexOf(hosts[0]) && order.indexOf(hosts[0]) < order.indexOf(view.layer), true,
		'first shadow closest to the view')
	assert.equal(hosts[0].shadowRadius, 8)
	assert.equal(hosts[0].shadowColor, 'cg:red')
	assert.equal(hosts[1].shadowColor, 'cg:blue')
	assert.equal(hosts[0].shadowOffset.width, 0)
	assert.equal(hosts[0].shadowOffset.height, -4)
	assert.equal(node.shadowApplied ?? false, false, 'self-layer shadow stays off')
})

test('a superview without a layer is upgraded to host sibling shadows', () => {
	const { api } = harness()
	const view = makeView(false)
	const superview: any = { wantsLayer: false, layer: { insertSublayerBelow(l: any, _b: any) { l.superlayer = this } } }
	view.superview = superview
	const node: any = { view, borderSpec: null, boxShadowSpec: [{ inset: false, dx: 0, dy: 1, blur: 2, spread: 0, color: 'red' }] }
	assert.equal(api.outsetShadowOnSelf(node, view), false)
	api.syncBoxShadow(node)
	assert.equal(superview.wantsLayer, true)
	assert.equal(node.outsetShadowHosts.length, 1)
})

test('root view fallback paints the shadow on its own layer and keeps clip off', () => {
	const { api } = harness()
	const view = makeView(false)
	const node: any = { view, borderSpec: null, boxShadowSpec: [
		{ inset: false, dx: 0, dy: 4, blur: 8, spread: 0, color: 'red' },
		{ inset: false, dx: 1, dy: 0, blur: 2, spread: 0, color: 'blue' },
	] }
	assert.equal(api.outsetShadowOnSelf(node, view), true)
	api.syncBoxShadow(node)
	assert.equal(view.layer.shadowColor, 'cg:red')
	assert.equal(view.layer.shadowRadius, 8)
	assert.equal(node.shadowApplied, true)
	node.boxShadowSpec = []
	api.syncBoxShadow(node)
	assert.equal(view.layer.shadowOpacity, 0)
})

test('inset shadows paint wall-hole shapes carrying their own shadow params', () => {
	const { api } = harness()
	const view = makeView()
	const node: any = { view, borderSpec: null, boxShadowSpec: [
		{ inset: true, dx: 0, dy: 2, blur: 6, spread: 1, color: 'red' },
		{ inset: true, dx: 0, dy: -2, blur: 4, spread: 0, color: 'blue' },
	] }
	api.syncBoxShadow(node)
	const host = node.insetShadowHost
	assert.ok(host)
	assert.equal(host.superlayer, view.layer)
	const shapes = node.insetShadowShapes
	assert.equal(shapes.length, 2)
	assert.ok(Number(shapes[0].zPosition) > Number(shapes[1].zPosition), 'first inset on top')
	assert.equal(shapes[0].fillRule, 'even-odd')
	assert.equal(shapes[0].fillColor, 'cg:red')
	assert.equal(shapes[0].shadowColor, 'cg:red')
	assert.equal(shapes[0].shadowRadius, 6)
	assert.equal(shapes[0].masksToBounds, true)
	assert.ok(shapes[0].path.rect, 'huge outer rect present')
	assert.ok(shapes[0].path.inner, 'hole path present')
	assert.equal(shapes[0].path.inner.w, 98, 'hole = box inset by spread')
	node.boxShadowSpec = []
	api.syncBoxShadow(node)
	assert.equal(node.insetShadowHost, null)
})
