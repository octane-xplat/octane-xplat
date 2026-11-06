/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import type { ProbeContext } from '../../tools/probe/context'
import '../../packages/ui/src/components/media/svg.mobile'

// Issue #149: an SVG mounted under a parent that stays collapsed through the
// first layout is never drawn — UIKit skipped SVGKFastImageView.drawRect while
// the ancestor was hidden and nothing re-requests display on reveal, leaving
// layer.contents nil (blank glyph) even though bounds/paths are valid.
const MARKUP =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M6 15h12M6 9h12M6 12h12"/></svg>'

let reveal: (value: boolean) => void

export default function SvgCollapseReveal() {
  const [revealed, setRevealed] = useState(false)
  reveal = setRevealed
  return (
    <masonview style={{ flexDirection: 'column', padding: 24 }}>
      <label text="svg collapse reveal" />
      <masonview style={{ visibility: revealed ? 'visible' : 'collapse' }}>
        <svgview id="probe-svg" src={MARKUP} stretch="aspectFit" style={{ width: 24, height: 24 }} />
      </masonview>
    </masonview>
  )
}

export async function run(ctx: ProbeContext) {
  const svg = ctx.find('probe-svg')
  const native = svg?.nativeViewProtected
  if (!native) {
    throw new Error('probe-svg has no native view')
  }

  // Give the hidden tree a beat; the bug is that no draw ever happens.
  await new Promise((resolve) => setTimeout(resolve, 500))
  ctx.record('collapsed bounds', {
    width: native.bounds.size.width,
    height: native.bounds.size.height,
  })
  ctx.record('collapsed layer.contents nil', native.layer.contents == null)

  reveal(true)

  await ctx.waitFor(() => native.bounds.size.width > 0 && native.bounds.size.height > 0, {
    timeout: 8000,
    interval: 25,
  })
  // Let the next display passes commit before reading backing contents.
  await new Promise((resolve) => setTimeout(resolve, 700))

  ctx.record('revealed bounds', {
    width: native.bounds.size.width,
    height: native.bounds.size.height,
  })
  ctx.record('revealed hidden', Boolean(native.hidden))
  ctx.record('revealed image size', {
    width: native.image?.size?.width ?? null,
    height: native.image?.size?.height ?? null,
  })
  ctx.record('revealed layer.contents nil', native.layer.contents == null)
  ctx.assert(
    'svg layer.contents is non-nil after collapse→visible',
    native.layer.contents != null,
  )
}
