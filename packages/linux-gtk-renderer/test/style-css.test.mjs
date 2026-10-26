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
