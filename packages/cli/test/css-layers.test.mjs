import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { unwrapCssLayers } from '../src/css-layers.mjs'

describe('unwrapCssLayers', () => {
	it('removes layer order statements and keeps rules from named layers', () => {
		const css = '@layer reset, app; @layer reset { .field { display: flex; } } @layer app { .field { color: red; } }'

		assert.equal(unwrapCssLayers(css), '  .field { display: flex; }   .field { color: red; } ')
	})

	it('preserves nested braces, comments, strings, and non-layer at-rules', () => {
		const css = '@layer structure { /* } */ @media screen { .field::before { content: "}"; color: red; } } .note { content: "@layer app {"; } }'

		assert.equal(unwrapCssLayers(css), ' /* } */ @media screen { .field::before { content: "}"; color: red; } } .note { content: "@layer app {"; } ')
	})

	it('leaves layer-like text inside comments and strings untouched', () => {
		const css = '/* @layer ignored { } */ .field { content: "@layer ignored { }"; }'

		assert.equal(unwrapCssLayers(css), css)
	})

	it('reports unclosed layer blocks', () => {
		assert.throws(() => unwrapCssLayers('@layer structure { .field { display:flex; }'), /Unclosed @layer block/)
	})
})
