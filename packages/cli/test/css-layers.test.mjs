import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { unwrapCssLayers } from '../dist/css-layers.js'

describe('unwrapCssLayers', () => {
  it('removes layer order statements and keeps rules from named layers', () => {
    const css =
      '@layer reset, app; @layer reset { .field { display: flex; } } @layer app { .field { color: red; } }'

    assert.equal(unwrapCssLayers(css), '  .field { display: flex; }   .field { color: red; } ')
  })

  it('preserves nested braces, comments, strings, and non-layer at-rules', () => {
    const css =
      '@layer structure { /* } */ @media screen { .field::before { content: "}"; color: red; } } .note { content: "@layer app {"; } }'

    assert.equal(
      unwrapCssLayers(css),
      ' /* } */ @media screen { .field::before { content: "}"; color: red; } } .note { content: "@layer app {"; } ',
    )
  })

  it('leaves layer-like text inside comments and strings untouched', () => {
    const css = '/* @layer ignored { } */ .field { content: "@layer ignored { }"; }'

    assert.equal(unwrapCssLayers(css), css)
  })

  it('reports unclosed layer blocks', () => {
    assert.throws(
      () => unwrapCssLayers('@layer structure { .field { display:flex; }'),
      /Unclosed @layer block/,
    )
  })
})

// Compilers using the patched native cascade retain layer metadata through
// both serving and asset serialization; ordinary projects keep their path.
import { processNativeCss, pxToDip, xplatCss } from '../dist/vite.js'

it('retains layers and native units when the platform compiler opts in', () => {
  const source = '@layer utilities { .a.b { width: 12px; opacity: .25 } } .b { opacity: .75 }'
  const preserved = processNativeCss(source, 'utility.css', () => {}, { preserveLayers: true })

  assert.match(preserved, /@layer utilities/)
  assert.match(preserved, /12dip/)
  assert.doesNotMatch(
    processNativeCss(source, 'ordinary.css', () => {}),
    /@layer/,
  )

  const platform = xplatCss('ios')

  platform.api.preserveLayers = true

  const pipeline = pxToDip()

  pipeline.configResolved({ command: 'serve', plugins: [platform] })

  const result = pipeline.transform.call({ warn() {} }, source, 'utility.css')

  assert.match(result, /@layer utilities/)
  assert.match(result, /12dip/)
})

it('converts declaration lengths without rewriting utility selectors or text', () => {
  const css = String.raw`@source inline("w-[12px]");
@media (min-width: 640px) {
  .w-\[12px\] { width: 12px; padding: calc(.5px * 2); content: "12px"; background-image: url(12px.png) }
}`

  const result = processNativeCss(css, 'utility.css', () => {})

  assert.match(result, /width: 12dip/)
  assert.match(result, /calc\(\.5dip \* 2\)/)
  assert.ok(result.includes(String.raw`.w-\[12px\]`))
  assert.ok(result.includes('@source inline("w-[12px]")'))
  assert.ok(result.includes('content: "12px"'))
  assert.ok(result.includes('url(12px.png)'))
  assert.ok(result.includes('(min-width: 640px)'))
})
