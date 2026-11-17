/** @jsxImportSource @octane-xplat/jsx */
import { SmoothCorners } from '../src/index'
import type { ProbeContext } from '../../../tools/probe/context'

interface ProbeView {
  style: { overflow: string; width: string | number; borderWidth: number }
  ios: { layer: { mask: unknown }; setNeedsLayout(): void; layoutIfNeeded(): void }
  getChildAt(index: number): ProbeView
  getActualSize(): { width: number; height: number }
  requestLayout(): void
}

export default function ClippingProbe() @{
  return (
    <SmoothCorners id="smooth-owner" corners={{ radius: 24, curve: 'squircle', smoothing: 0.6 }}
      border={{ width: 2, color: '#0000ff' }} shadow={{ blur: 8 }}
      style={{ width: 200, height: 120, backgroundColor: '#dbeafe' }}>
      <label text="Mason-owned clipping" />
    </SmoothCorners>
  )
}

function layout(view: ProbeView): void {
  view.requestLayout()
  view.ios.setNeedsLayout()
  view.ios.layoutIfNeeded()
}

export async function run(ctx: ProbeContext) {
  const content: ProbeView = await ctx.waitFor(() => ctx.find('smooth-owner'))
  await ctx.waitFor(() => content.getActualSize().width === 200)
  const surface = content.getChildAt(0)
  ctx.assert('visible content is unmasked', Boolean(content.ios.layer.mask), false)
  ctx.assert('surface border belongs to Mason style', surface.style.borderWidth, 2)
  surface.style.width = 220
  layout(surface)
  await ctx.waitFor(() => surface.getActualSize().width === 220)
  surface.style.width = '100%'
  layout(surface)
  await ctx.waitFor(() => surface.getActualSize().width === 200)
  content.style.overflow = 'hidden'
  layout(content)
  await ctx.waitFor(() => Boolean(content.ios.layer.mask))
  layout(content)
  ctx.assert('hidden clip survives layout', Boolean(content.ios.layer.mask), true)
  content.style.overflow = 'visible'
  layout(content)
  await ctx.waitFor(() => !content.ios.layer.mask)
  ctx.assert('visible content is unmasked again', Boolean(content.ios.layer.mask), false)
}
