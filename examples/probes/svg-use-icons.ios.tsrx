/** @jsxImportSource @octane-xplat/jsx */
import type { ProbeContext } from '../../tools/probe/context'
import '../../packages/ui/src/components/media/svg.mobile'

// Issue #148: SVGKit (3.1.1, Akylas 3.x) resolves <use> references into an
// element-instance tree at parse time, but SVGUseElement.layoutLayer: only
// forwards to the linked element — the use element's own
// fill/stroke/style/transform/x/y never reach the generated CAShapeLayer,
// so use-based icons parse, size, and produce shape geometry yet paint
// nothing. Expanding each <use> into a <g> wrapper plus a clone of the
// referenced element (SVG 1.1 §5.6 model) restores the paint.

// Structured like the reported flip-camera asset: a defs path with no paint
// of its own, one filtered black <use>, one unfiltered white <use>.
const FLIP_USE =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="58" height="66" viewBox="0 0 58 66">' +
  '<defs>' +
  '<path id="path-1" d="M15 20h28a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H15a6 6 0 0 1-6-6V26a6 6 0 0 1 6-6zm14 8a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"/>' +
  '<filter id="filter-2"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.4"/></filter>' +
  '</defs>' +
  '<use fill="#000000" filter="url(#filter-2)" xlink:href="#path-1"/>' +
  '<use fill="#FFFFFF" xlink:href="#path-1"/>' +
  '</svg>'

// Same drawing with each use expanded into a copy of the referenced path —
// the consumer-verified workaround form.
const FLIP_INLINED =
  '<svg xmlns="http://www.w3.org/2000/svg" width="58" height="66" viewBox="0 0 58 66">' +
  '<defs>' +
  '<filter id="filter-2"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.4"/></filter>' +
  '</defs>' +
  '<path fill="#000000" filter="url(#filter-2)" d="M15 20h28a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H15a6 6 0 0 1-6-6V26a6 6 0 0 1 6-6zm14 8a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"/>' +
  '<path fill="#FFFFFF" d="M15 20h28a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H15a6 6 0 0 1-6-6V26a6 6 0 0 1 6-6zm14 8a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"/>' +
  '</svg>'

// The issue's suggested minimal repro: defs path without its own fill, then
// <g fill="none"><use fill="#FFFFFF" xlink:href="#p"/></g>.
const MINIMAL_USE =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24">' +
  '<defs><path id="p" d="M4 4h16v16H4z"/></defs>' +
  '<g fill="none"><use fill="#FFFFFF" xlink:href="#p"/></g>' +
  '</svg>'

// Isolation: a single <use> carrying a presentation attribute plus a filter.
const FILTERED_USE =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24">' +
  '<defs>' +
  '<path id="p" d="M4 4h16v16H4z"/>' +
  '<filter id="f"><feDropShadow dx="0" dy="1" stdDeviation="1"/></filter>' +
  '</defs>' +
  '<use fill="#000000" filter="url(#f)" xlink:href="#p"/>' +
  '</svg>'

// Isolation: SVG 2 bare `href` instead of `xlink:href`. SVGKit asserts on a
// missing xlink:href, so this case is checked last — upstream crashes on it
// and must never see the unexpanded markup.
const HREF_USE =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
  '<defs><path id="p" d="M4 4h16v16H4z"/></defs>' +
  '<use fill="#FFFFFF" href="#p"/>' +
  '</svg>'

interface ShapeStats {
  shapeLayers: number
  withPath: number
  filled: number
  stroked: number
}

function shapeStats(root: unknown): ShapeStats {
  const stats: ShapeStats = { shapeLayers: 0, withPath: 0, filled: 0, stroked: 0 }
  const walk = (layer: any): void => {
    if (!layer) {
      return
    }
    if (layer instanceof CAShapeLayer) {
      stats.shapeLayers += 1
      if (layer.path != null) {
        stats.withPath += 1
      }
      if (layer.fillColor != null) {
        stats.filled += 1
      }
      if (layer.strokeColor != null) {
        stats.stroked += 1
      }
    }
    const subs = layer.sublayers
    if (subs) {
      for (let i = 0; i < subs.count; i++) {
        walk(subs.objectAtIndex(i))
      }
    }
  }
  walk(root)
  return stats
}

export default function SvgUseIcons() {
  return (
    <masonview style={{ flexDirection: 'column', padding: 24 }}>
      <label text="svg use icons" />
      <svgview id="use-flip" src={FLIP_USE} stretch="aspectFit" style={{ width: 58, height: 66 }} />
      <svgview id="use-inlined" src={FLIP_INLINED} stretch="aspectFit" style={{ width: 58, height: 66 }} />
      <svgview id="use-minimal" src={MINIMAL_USE} stretch="aspectFit" style={{ width: 24, height: 24 }} />
      <svgview id="use-filter" src={FILTERED_USE} stretch="aspectFit" style={{ width: 24, height: 24 }} />
      <svgview id="use-href" src={HREF_USE} stretch="aspectFit" style={{ width: 24, height: 24 }} />
    </masonview>
  )
}

export async function run(ctx: ProbeContext) {
  const statsFor = async (id: string) => {
    const svg = ctx.find(id)
    const native = svg?.nativeViewProtected
    if (!native) {
      throw new Error(`${id} has no native view`)
    }
    await ctx.waitFor(() => native.image != null, { timeout: 8000, interval: 25 })
    return { native, stats: shapeStats(native.image.CALayerTree) }
  }

  // Baseline first: the inlined control must paint on every run.
  const inlined = await statsFor('use-inlined')
  ctx.record('inlined layer stats', inlined.stats)
  console.log(`[svg-use] inlined ${JSON.stringify(inlined.stats)}`)
  ctx.assert('inlined control paints at least one shape', inlined.stats.filled >= 1)

  for (const id of ['use-minimal', 'use-filter', 'use-flip']) {
    const { stats } = await statsFor(id)
    ctx.record(`${id} layer stats`, stats)
    console.log(`[svg-use] ${id} ${JSON.stringify(stats)}`)
    ctx.assert(`${id} paints at least one shape`, stats.filled + stats.stroked >= 1)
  }
  const flip = ctx.find('use-flip')?.nativeViewProtected
  ctx.assert(
    'use-flip painted shape count matches inlined control',
    (await statsFor('use-flip')).stats.filled,
    inlined.stats.filled,
  )
  ctx.record('use-flip contents drawn', flip?.layer?.contents != null)

  // Last: bare href variant. Unexpanded it trips SVGKit's xlink:href assert.
  const href = await statsFor('use-href')
  ctx.record('use-href layer stats', href.stats)
  console.log(`[svg-use] use-href ${JSON.stringify(href.stats)}`)
  ctx.assert('use-href paints at least one shape', href.stats.filled + href.stats.stroked >= 1)
}
