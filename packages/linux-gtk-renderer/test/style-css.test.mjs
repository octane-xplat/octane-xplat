// Unit coverage for the GI-free style→GTK-CSS translation in
// src/style-css.ts — the provider plumbing stays in index.ts.
import assert from 'node:assert/strict'
import { it } from 'node:test'
import { gtkStyleCss } from '../src/style-css.ts'

it('emits border-style: solid when a positive borderWidth has no style', () => {
	const css = gtkStyleCss('.n1', { borderWidth: 2, borderColor: 'red' }, 'label')
	assert.match(css, /border-style: solid;/)
	assert.match(css, /border-width: 2px;/)
})

it('does not auto-emit border-style when borderStyle is given', () => {
	const css = gtkStyleCss('.n1', { borderWidth: 2, borderStyle: 'dotted' }, 'label')
	assert.match(css, /border-style: dotted;/)
	assert.equal(css.match(/border-style/g).length, 1)
})

it('does not auto-emit border-style for a zero width', () => {
	const css = gtkStyleCss('.n1', { borderWidth: 0 }, 'label')
	assert.equal(css.includes('border-style'), false)
})

it('rewrites dip to px inside multi-token string values', () => {
	const css = gtkStyleCss('.n1', { boxShadow: '0dip 2dip 4dip rgba(0,0,0,0.4)' }, 'label')
	assert.match(css, /box-shadow: 0px 2px 4px rgba\(0,0,0,0\.4\);/)
})

it('maps numbers to px', () => {
	const css = gtkStyleCss('.n1', { padding: 8, fontSize: 14 }, 'label')
	assert.match(css, /padding: 8px;/)
	assert.match(css, /font-size: 14px;/)
	// fontWeight stays unitless
	const w = gtkStyleCss('.n1', { fontWeight: 700 }, 'label')
	assert.match(w, /font-weight: 700;/)
})

it('passes percent strings through', () => {
	const css = gtkStyleCss('.n1', { borderRadius: '50%' }, 'label')
	assert.match(css, /border-radius: 50%;/)
})

it('quotes font families containing spaces or commas', () => {
	assert.match(
		gtkStyleCss('.n1', { fontFamily: 'Iosevka Term, monospace' }, 'label'),
		/font-family: "Iosevka Term, monospace";/,
	)
	assert.match(gtkStyleCss('.n1', { fontFamily: 'monospace' }, 'label'), /font-family: monospace;/)
})

it('emits the placeholder subrule only for textfield', () => {
	const field = gtkStyleCss('.n1', { placeholderColor: '#888' }, 'textfield')
	assert.match(field, /\.n1 placeholder \{ color: #888; \}/)
	const label = gtkStyleCss('.n1', { placeholderColor: '#888' }, 'label')
	assert.equal(label.includes('placeholder'), false)
})

it('excludes keys outside the GTK CSS table', () => {
	const css = gtkStyleCss('.n1', { width: 40, opacity: 0.5, frobnicate: 1, color: 'red' }, 'label')
	assert.equal(css.includes('width'), false)
	assert.equal(css.includes('opacity'), false)
	assert.equal(css.includes('frobnicate'), false)
	assert.match(css, /color: red;/)
})

it('maps per-side border widths, colours and corner radii', () => {
	const css = gtkStyleCss(
		'.n1',
		{
			borderTopWidth: 2,
			borderBottomWidth: '4dip',
			borderLeftColor: 'red',
			borderTopLeftRadius: 6,
			borderBottomRightRadius: '50%',
		},
		'label',
	)
	assert.match(css, /border-top-width: 2px;/)
	assert.match(css, /border-bottom-width: 4px;/)
	assert.match(css, /border-left-color: red;/)
	assert.match(css, /border-top-left-radius: 6px;/)
	assert.match(css, /border-bottom-right-radius: 50%;/)
	// A positive side width still auto-emits border-style: solid.
	assert.match(css, /border-style: solid;/)
})

it('does not collapse per-side borders to the unified keys', () => {
	const css = gtkStyleCss('.n1', { borderTopWidth: 2 }, 'label')
	assert.equal(css.includes('border-width'), false)
	assert.match(css, /border-top-width: 2px;/)
})

it('maps background-image/-position/-repeat/-size', () => {
	const css = gtkStyleCss(
		'.n1',
		{
			backgroundImage: 'url("file:///tmp/a.png")',
			backgroundPosition: 'center',
			backgroundRepeat: 'no-repeat',
			backgroundSize: 'cover',
		},
		'label',
	)
	assert.match(css, /background-image: url\("file:\/\/\/tmp\/a\.png"\);/)
	assert.match(css, /background-position: center;/)
	assert.match(css, /background-repeat: no-repeat;/)
	assert.match(css, /background-size: cover;/)
})

it('resolves ~/ urls through the resolver and warns on other schemes', () => {
	const resolved = gtkStyleCss('.n1', { backgroundImage: 'url("~/img/a.png")' }, 'label', {
		resolveUrl: (rel) => 'file:///bundle/' + rel,
	})
	assert.match(resolved, /background-image: url\("file:\/\/\/bundle\/img\/a\.png"\);/)

	const warnings = []
	const bad = gtkStyleCss('.n1', { backgroundImage: 'url("https://x/a.png")' }, 'label', {
		onWarn: (m) => warnings.push(m),
	})
	assert.equal(warnings.length, 1)
	assert.match(bad, /background-image: none;/)
})

it('maps letterSpacing numbers and strings to em', () => {
	assert.match(gtkStyleCss('.n1', { letterSpacing: 0.1 }, 'label'), /letter-spacing: 0\.1em;/)
	assert.match(gtkStyleCss('.n1', { letterSpacing: '0.2' }, 'label'), /letter-spacing: 0\.2em;/)
})

it('maps textTransform and fontVariationSettings', () => {
	const css = gtkStyleCss(
		'.n1',
		{ textTransform: 'uppercase', fontVariationSettings: '"wght" 700' },
		'label',
	)
	assert.match(css, /text-transform: uppercase;/)
	assert.match(css, /font-variation-settings: "wght" 700;/)
})

it('appends textStroke as 8 zero-blur text-shadows after authored shadows', () => {
	const css = gtkStyleCss(
		'.n1',
		{ textShadow: '0dip 1dip 2dip black', textStroke: '2 red' },
		'label',
	)
	const m = /text-shadow: ([^;]+);/.exec(css)
	assert.ok(m, 'expected a text-shadow declaration')
	const shadows = m[1].split(', ')
	// 1 authored + 8 stroke directions
	assert.equal(shadows.length, 9)
	assert.equal(shadows[0], '0px 1px 2px black')
	assert.equal(shadows[1], '2px 0px 0 red')
	assert.equal(shadows[8], '-2px -2px 0 red')

	const strokeOnly = gtkStyleCss('.n1', { textStroke: '1 blue' }, 'label')
	assert.match(strokeOnly, /text-shadow: 1px 0px 0 blue/)
})

it('routes control color/backgroundColor to subnodes, not the widget node', () => {
	const sw = gtkStyleCss('.n1', { color: 'red', backgroundColor: '#00f' }, 'switch')
	assert.match(sw, /\.n1 slider \{ color: red; \}/)
	assert.match(sw, /\.n1:checked \{ background-color: #00f; \}/)
	assert.equal(/\.n1 \{[^}]*color/.test(sw), false)

	const sl = gtkStyleCss('.n1', { color: 'red', backgroundColor: '#00f' }, 'slider')
	assert.match(sl, /\.n1 slider \{ color: red; \}/)
	assert.match(sl, /\.n1 trough > highlight \{ background-color: #00f; \}/)

	const pr = gtkStyleCss('.n1', { color: 'red', backgroundColor: '#00f' }, 'progress')
	assert.match(pr, /\.n1 trough > progress \{ background-color: red; \}/)
	assert.match(pr, /\.n1 trough \{ background-color: #00f; \}/)

	// activityindicator takes color on its own node (spinner).
	const sp = gtkStyleCss('.n1', { color: 'red' }, 'activityindicator')
	assert.match(sp, /\.n1 \{ color: red; \}/)
})

it('resolves NS transform parts — shorthand, longhands, identity', async () => {
	const { resolveTransform, transformSteps, paintOrder, zIndexOf } =
		await import('../src/transform-style.ts')
	assert.equal(resolveTransform({}), null)
	assert.equal(resolveTransform({ transform: 'none' }), null)
	assert.equal(resolveTransform({ transform: 'bogus(1)' }), null)
	const parts = resolveTransform({
		transform: 'translate(-50%, 10dip) rotate(45deg)',
		scaleX: 2,
		rotatex: 30,
	})
	assert.deepEqual(parts.translateX, { value: -0.5, unit: '%' })
	assert.equal(parts.translateY, 10)
	assert.equal(parts.rotate, 45)
	assert.equal(parts.scaleX, 2)
	assert.equal(parts.rotateX, 30)
	// NS order: perspective (3D only, default 300), translate, rotate z, x, y, scale.
	assert.deepEqual(transformSteps(parts, 100, 40), [
		{ kind: 'perspective', depth: 300 },
		{ kind: 'translate', x: -50, y: 10 },
		{ kind: 'rotate', deg: 45 },
		{ kind: 'rotateX', deg: 30 },
		{ kind: 'scale', x: 2, y: 1 },
	])
	assert.equal(paintOrder([0, 0, 0]), null)
	assert.deepEqual(paintOrder([2, 0, -1, 0]), [2, 1, 3, 0])
	assert.equal(zIndexOf({ zIndex: '3' }), 3)
})

it('emits GTK CSS transform only when given a box', () => {
	const style = { transform: 'translateX(-50%) rotate(90deg)' }
	assert.doesNotMatch(gtkStyleCss('.n1', style, 'label'), /transform/)
	const css = gtkStyleCss('.n1', style, 'label', { transformBox: { width: 80, height: 20 } })
	assert.match(css, /transform: translate\(-40px, 0px\) rotate\(90deg\);/)
	assert.match(css, /transform-origin: center;/)
})
