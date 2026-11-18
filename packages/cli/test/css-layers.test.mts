import assert from 'node:assert/strict'
import { it } from 'node:test'
// Every native pipeline retains layers, including plain projects.
import { processNativeCss, pxToDip, css } from '../dist/vite.js'

it('retains ordinary cascade layers and native units without compiler opt-in', () => {
  const source = '@layer utilities { .a.b { width: 12px; opacity: .25 } } .b { opacity: .75 }'
  const preserved = processNativeCss(source, 'utility.css', () => {})

  assert.match(preserved, /@layer utilities/)
  assert.match(preserved, /12dip/)
  assert.match(
    processNativeCss(source, 'ordinary.css', () => {}),
    /@layer/,
  )

  const platform = css('ios')

  const pipeline = pxToDip()

  pipeline.configResolved({ command: 'serve', plugins: [platform] })

  const result = pipeline.transform.call({ warn() {} }, source, 'utility.css')

  assert.match(result, /@layer utilities/)
  assert.match(result, /12dip/)
})

it('skips ?raw/?url css wrappers in the native per-file transform', () => {
  const pipeline = pxToDip()

  pipeline.configResolved({ command: 'serve', plugins: [] })

  const wrapper = 'export default ".a { width: 1px }"'

  assert.equal(pipeline.transform.call({ warn() {} }, wrapper, 'x.css?raw'), undefined)
  assert.equal(pipeline.transform.call({ warn() {} }, wrapper, 'x.css?url'), undefined)
  assert.match(
    pipeline.transform.call({ warn() {} }, '.a { width: 1px }', 'x.css'),
    /1dip/,
  )
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
