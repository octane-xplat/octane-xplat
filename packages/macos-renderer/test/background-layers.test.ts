// Pure background parsing + paint-geometry cases (GI-free model).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	collectBackground,
	parseBackgroundShorthand,
	parseBgImageTerm,
	positioningBox,
	resolveImageSize,
	resolveStops,
	tileRects,
} from '../src/background-layers.ts'

const gradient = (term: string) => (parseBgImageTerm(term) as any).gradient

test('url(), gradients, none and unknown terms parse per layer', () => {
	assert.deepEqual(parseBgImageTerm('url("~/bg.png")'), { kind: 'url', url: '~/bg.png' })
	assert.deepEqual(parseBgImageTerm('url(~/bg.png)'), { kind: 'url', url: '~/bg.png' })
	assert.equal(parseBgImageTerm('none'), null)
	assert.equal(parseBgImageTerm('url()'), null)
	assert.equal(parseBgImageTerm('image-set("a" 1x)'), undefined)
	assert.equal(gradient('linear-gradient(to right, red, blue)').type, 'linear')
	assert.equal(gradient('radial-gradient(circle, red, blue)').shape, 'circle')
	assert.equal(gradient('conic-gradient(from 45deg at 30% 40%, red, blue)').angle, 45)
	assert.equal(gradient('repeating-linear-gradient(red 0, blue 10px)').repeating, true)
})

test('linear direction, angle units and double-position stops', () => {
	assert.equal(gradient('linear-gradient(0.25turn, red, blue)').angle, 90)
	assert.equal(gradient('linear-gradient(to bottom left, red, blue)').angle, 225)
	const stops = gradient('linear-gradient(red 10% 40%, blue 60%)').stops
	assert.deepEqual(
		stops.map((s: any) => s.at),
		[{ frac: 0.1 }, { frac: 0.4 }, { frac: 0.6 }],
	)
	assert.equal(gradient('linear-gradient(red, blue, green)').stops.length, 3)
})

test('radial shape/size/center prelude', () => {
	const g = gradient('radial-gradient(ellipse closest-side at 25% 75%, red, blue)')
	assert.equal(g.shape, 'ellipse')
	assert.equal(g.size, 'closest-side')
	assert.equal(g.center.x.fraction, 0.25)
	assert.equal(g.center.y.fraction, 0.75)
	const circle = gradient('radial-gradient(circle 30px at center, red, blue)')
	assert.equal(circle.size, 'explicit')
	assert.deepEqual(circle.rx, { len: 30 })
})

test('collectBackground: shorthand resets slots; longhands override', () => {
	const warnings: string[] = []
	const spec = collectBackground(
		{ background: 'url(a.png) center/cover no-repeat padding-box red', backgroundPosition: '10px 20%' },
		warnings,
	)!
	assert.equal(spec.color, 'red')
	assert.equal(spec.layers.length, 1)
	const layer = spec.layers[0]
	assert.equal(layer.image.kind, 'url')
	assert.equal(layer.size, 'cover')
	assert.deepEqual(layer.repeat, { x: 'no-repeat', y: 'no-repeat' })
	assert.equal(layer.origin, 'padding-box')
	assert.equal(layer.position.x.offset, 10)
	assert.equal(layer.position.y.fraction, 0.2)
	assert.equal(warnings.length, 0)
})

test('multi-layer shorthand coordinates per-layer lists', () => {
	const spec = collectBackground({
		backgroundImage: 'url(a.png), linear-gradient(red, blue), url(b.png)',
		backgroundRepeat: 'no-repeat',
		backgroundSize: '10px, cover',
	})!
	assert.equal(spec.layers.length, 3)
	assert.deepEqual(spec.layers[0].repeat, { x: 'no-repeat', y: 'no-repeat' })
	assert.deepEqual(spec.layers[1].repeat, { x: 'no-repeat', y: 'no-repeat' }, 'repeat list cycles')
	assert.equal((spec.layers[0].size as any).w.kind, 'len')
	assert.equal((spec.layers[0].size as any).w.v, 10)
	assert.equal(spec.layers[1].size, 'cover')
	assert.equal((spec.layers[2].size as any).w.v, 10, 'size list cycles')
})

test('shorthand color only counts on the last layer', () => {
	const slots = parseBackgroundShorthand('linear-gradient(red, blue), url(x.png) #123456')
	assert.equal(slots.color, '#123456')
	const early = parseBackgroundShorthand('red, url(x.png)')
	assert.equal(early.color, undefined)
})

test('background-clip text and attachment warn and stay unsupported', () => {
	const warnings: string[] = []
	collectBackground({ backgroundImage: 'url(a.png)', backgroundClip: 'text', backgroundAttachment: 'fixed' }, warnings)
	assert.ok(warnings.some((m) => m.includes('text')))
	assert.ok(warnings.some((m) => m.includes('backgroundAttachment')))
})

test('positioningBox resolves border/padding/content boxes', () => {
	const border = { top: 2, right: 4, bottom: 2, left: 4 }
	const padding = { top: 1, right: 1, bottom: 1, left: 1 }
	assert.deepEqual(positioningBox('border-box', 100, 40, border, padding), { x: 0, y: 0, width: 100, height: 40 })
	assert.deepEqual(positioningBox('padding-box', 100, 40, border, padding), { x: 4, y: 2, width: 92, height: 36 })
	assert.deepEqual(positioningBox('content-box', 100, 40, border, padding), { x: 5, y: 3, width: 90, height: 34 })
})

test('resolveImageSize covers auto, cover, contain and explicit axes', () => {
	const box = { width: 200, height: 100 }
	assert.deepEqual(resolveImageSize('auto', 40, 20, box), { w: 40, h: 20 })
	assert.deepEqual(resolveImageSize('cover', 40, 20, { width: 100, height: 100 }), { w: 200, h: 100 })
	assert.deepEqual(resolveImageSize('contain', 40, 20, { width: 100, height: 100 }), { w: 100, h: 50 })
	const explicit = resolveImageSize({ w: { kind: 'frac', v: 0.5 }, h: { kind: 'auto' } } as any, 40, 20, box)
	assert.deepEqual(explicit, { w: 100, h: 50 })
})

test('tileRects repeat anchors bidirectionally; space and round keep edges', () => {
	const box = { x: 0, y: 0, width: 100, height: 40 }
	const layer: any = { repeat: { x: 'repeat', y: 'no-repeat' }, position: { x: { fraction: 0, offset: 10 }, y: { fraction: 0, offset: 0 } } }
	const rects = tileRects(layer, { w: 30, h: 10 }, box)
	assert.equal(rects.length, 4, 'tiles at -20,10,40,70')
	assert.equal(rects[0].x, -20)
	const spaced = tileRects(
		{ repeat: { x: 'space', y: 'no-repeat' }, position: layer.position },
		{ w: 30, h: 10 },
		box,
	)
	assert.equal(spaced.length, 3)
	assert.equal(spaced[0].x, 0)
	assert.equal(spaced[2].x + spaced[2].width, 100)
	const round = tileRects(
		{ repeat: { x: 'round', y: 'no-repeat' }, position: layer.position },
		{ w: 30, h: 10 },
		box,
	)
	assert.equal(round.length, 3)
	assert.equal(round[0].width, 100 / 3)
})

test('resolveStops distributes, clamps monotonic, and tiles repeating patterns', () => {
	const even = resolveStops([{ color: 'a', at: null }, { color: 'b', at: null }, { color: 'c', at: null }], 100, false)
	assert.deepEqual(even.map((s) => s.at), [0, 0.5, 1])
	const clamped = resolveStops([{ color: 'a', at: { frac: 0.8 } }, { color: 'b', at: { frac: 0.2 } }], 100, false)
	assert.deepEqual(clamped.map((s) => s.at), [0.8, 0.8])
	const repeated = resolveStops(
		[{ color: 'a', at: { len: 0 } }, { color: 'b', at: { len: 20 } }, { color: 'a', at: { len: 40 } }],
		100,
		true,
	)
	assert.ok(repeated.length > 3, 'pattern tiles to cover the extent')
	assert.equal(repeated[0].at, 0)
	assert.equal(repeated[repeated.length - 1].at, 1)
})
