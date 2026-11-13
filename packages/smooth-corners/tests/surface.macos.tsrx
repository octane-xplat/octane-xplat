/** @jsxImportSource @octane-xplat/jsx */
import { SmoothCorners } from '../src/index.macos'
import { applySmoothClip, applySmoothShadow } from '../src/apply.macos'
import type { ProbeContext } from '../../../tools/probe/context'

declare const NSView: any

export default function SurfaceProbe() @{
  <SmoothCorners
    id="smooth-owner"
    corners={24}
    border={{ width: 2, color: '#00f8' }}
    shadow={{ blur: 8, spread: 3 }}
    style={{ width: 200, height: 120, backgroundColor: '#dbeafe' }}
  >
    <label text="Smooth surface" />
  </SmoothCorners>
}

export async function run(ctx: ProbeContext) {
  const content = await ctx.waitFor(() => ctx.find('smooth-owner'))

  await ctx.waitFor(() => content.frame?.size.width > 0)
  ctx.assert('visible component content is unmasked', Boolean(content.layer?.mask), false)
  ctx.record('component geometry', ctx.inspect('smooth-owner'))

  const view = NSView.alloc().initWithFrame({
    origin: { x: 0, y: 0 },
    size: { width: 200, height: 120 },
  })

  const props = {
    corners: { radius: 24, curve: 'squircle' as const },
    border: { width: 2, color: '#00f8' },
    shadow: { blur: 8, spread: 3 },
  }

  applySmoothClip(view, 200, 120, props)
  ctx.assert('native mask contains a CGPath', Boolean(view.layer.mask?.path), true)

  const first = view.layer.mask.path

  applySmoothClip(view, 240, 120, props)
  ctx.assert('resize replaces mask path', view.layer.mask.path !== first, true)
  applySmoothShadow(view, 240, 120, props)
  ctx.assert('native shadow has a CGPath', Boolean(view.layer.shadowPath), true)
  applySmoothClip(view, 240, 120, props, false)
  ctx.assert('visible removes owned mask', Boolean(view.layer.mask), false)
  applySmoothShadow(view, 240, 120, { corners: 24 })
  ctx.assert('shadow removal clears path', Boolean(view.layer.shadowPath), false)
  ctx.assert('shadow removal clears opacity', view.layer.shadowOpacity, 0)
}
