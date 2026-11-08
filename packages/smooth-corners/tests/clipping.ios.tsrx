/** @jsxImportSource @octane-xplat/jsx */
import { Color } from '@nativescript/core'
import { SmoothCorners } from '../src/index'
import { commandsToD, generateCommands } from '../src/path'
import type { ProbeContext } from '../../../tools/probe/context'

interface ProbeView {
  style: {
    clipPath?: string
    overflow: string
    width: string | number
    backgroundColor: Color
    backgroundInternal: unknown
  }
  ios: {
    layer: { mask: unknown; shadowPath: unknown }
    setNeedsLayout(): void
    layoutIfNeeded(): void
  }
  getChildAt(index: number): ProbeView
  getActualSize(): { width: number; height: number }
  requestLayout(): void
  _redrawNativeBackground(background: unknown): void
}

const corners = { radius: 24, curve: 'squircle' as const, smoothing: 0.6 }

export default function ClippingProbe() @{
  return (
    <SmoothCorners
      id="smooth-owner"
      corners={corners}
      border={{ width: 2, color: '#0000ff' }}
      shadow={{ blur: 8 }}
      style={{ width: 200, height: 120, backgroundColor: '#dbeafe' }}
    >
      <label text="Mason-owned clipping" />
    </SmoothCorners>
  )
}

function layout(view: ProbeView): void {
  view.requestLayout()
  view.ios.setNeedsLayout()
  view.ios.layoutIfNeeded()
}

function pathOf(view: ProbeView): string {
  const { width, height } = view.getActualSize()

  return `path("${commandsToD(generateCommands(width, height, corners))}")`
}

export async function run(ctx: ProbeContext) {
  const content: ProbeView = await ctx.waitFor(() => ctx.find('smooth-owner'))

  await ctx.waitFor(() => content.getActualSize().width > 0)

  const surface = content.getChildAt(0)

  await ctx.waitFor(() => Boolean(surface?.ios.layer.mask))
  ctx.assert('visible content is unmasked', Boolean(content.ios.layer.mask), false)
  ctx.assert('surface uses exact generated path', surface.style.clipPath, pathOf(surface))
  ctx.record('surface mask class', String(surface.ios.layer.mask))

  for (let i = 0; i < 3; i++) {
    surface.style.backgroundColor = new Color(i % 2 ? '#dbeafe' : '#fed7aa')
    surface._redrawNativeBackground(surface.style.backgroundInternal)
    layout(surface)
    await ctx.waitFor(() => Boolean(surface.ios.layer.mask))
    ctx.assert(
      `surface clip survives background/layout ${i}`,
      surface.style.clipPath,
      pathOf(surface),
    )
  }

  surface.style.width = 220
  layout(surface)
  await ctx.waitFor(
    () => surface.getActualSize().width === 220 && surface.style.clipPath === pathOf(surface),
  )

  ctx.assert('resized surface remains masked', Boolean(surface.ios.layer.mask), true)
  surface.style.width = '100%'
  layout(surface)
  await ctx.waitFor(
    () => surface.getActualSize().width === 200 && surface.style.clipPath === pathOf(surface),
  )

  content.style.overflow = 'hidden'
  layout(content)
  await ctx.waitFor(
    () => content.style.clipPath === pathOf(content) && Boolean(content.ios.layer.mask),
  )

  ctx.assert('hidden content uses exact generated path', content.style.clipPath, pathOf(content))
  ctx.record('content mask class', String(content.ios.layer.mask))
  content._redrawNativeBackground(content.style.backgroundInternal)
  layout(content)
  await ctx.waitFor(() => Boolean(content.ios.layer.mask))
  ctx.assert('hidden content clip survives layout', content.style.clipPath, pathOf(content))

  content.style.overflow = 'visible'
  layout(content)
  await ctx.waitFor(() => !content.ios.layer.mask)
  ctx.assert('visible removes the owned content CSS clip', content.style.clipPath, 'none')
  ctx.assert('surface stays masked in visible mode', Boolean(surface.ios.layer.mask), true)
  ctx.record('final geometry', content.getActualSize())
}
