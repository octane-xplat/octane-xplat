/** @jsxImportSource @octane-xplat/jsx */
// Nonvisual native paint ownership. No screenshots, OS input or pacing claim.
import { Style, type View } from '@octane-xplat/nativescript-mason-core'
import { attachHost } from '../src/host'
import { createDelta } from '../src/projection/geometry'
import type { ProbeContext } from '../../../tools/probe/context'

function PaintHost() @{
  <masonview>
    <masonview
      id="paint"
      style={{
        width: 200,
        height: 100,
        borderRadius: 20,
        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.5)',
        clipPath: 'inset(5%)',
      }}
    />
  </masonview>
}

export async function run(ctx: ProbeContext) {
  await ctx.mount(PaintHost)

  const view: View = await ctx.waitFor(() => ctx.find('paint'))

  await ctx.waitFor(() => view.isLoaded && view.getActualSize().width > 0)

  // A fresh public Style wrapper independently reads the engine paint; it does not write it.
  const paint = () => Style.fromView(view, view.ios ?? view.android)

  ctx.assert(
    'fresh public radius reads authored paint',
    Number.parseFloat(paint().borderRadius),
    20,
  )

  const initial = String(view.style.borderRadius)
  const adapter = attachHost(view)

  ctx.onCleanup(() => adapter.dispose?.())

  const delta = createDelta()

  delta.x.scale = delta.y.scale = 0.5

  const projection = { delta, treeScale: { x: 1, y: 1 }, latest: {} }

  const baseline = view.createPaintPresentation()

  ctx.record('baseline public paint', baseline.read())
  baseline.dispose()
  adapter.project!(projection)
  // Mason coalesces native style commits in a microtask; read after that commit.
  await Promise.resolve()
  ctx.record('corrected native paint', {
    radius: paint().borderRadius,
    shadow: paint().boxShadow,
    coreRadius: String(view.style.borderRadius),
    hasCoreNative: !!view.nativeViewProtected,
    hasPlatformNative: !!(view.ios ?? view.android),
  })

  ctx.assert('native radius is corrected', Number.parseFloat(paint().borderRadius), 40)
  ctx.assert('native shadow is corrected', paint().boxShadow.includes('8px 24px'), true)
  ctx.assert('authored Core radius is untouched', String(view.style.borderRadius), initial)

  let rejected = false

  try {
    view.createPaintPresentation()
  } catch {
    rejected = true
  }

  ctx.assert('second paint owner is rejected', rejected, true)
  view.style.borderRadius = 40
  adapter.project!(null)
  await Promise.resolve()
  ctx.assert(
    'authored write equal to correction survives cleanup',
    Number.parseFloat(paint().borderRadius),
    40,
  )

  adapter.project!(projection)
  view.style.borderRadius = 30
  adapter.project!(projection)
  await Promise.resolve()
  ctx.assert('new authored radius replaces baseline', Number.parseFloat(paint().borderRadius), 60)
  adapter.project!(null)
  await Promise.resolve()
  ctx.assert(
    'projection completion restores latest authored radius',
    Number.parseFloat(paint().borderRadius),
    30,
  )

  adapter.project!(projection)
  adapter.styles!.write({ borderRadius: '16px' })
  await Promise.resolve()
  ctx.assert(
    'animated radius composes with projection',
    Number.parseFloat(paint().borderRadius),
    32,
  )

  adapter.styles!.release()
  adapter.dispose!()
  await Promise.resolve()
  ctx.assert(
    'cleanup restores the preceding authored radius',
    Number.parseFloat(paint().borderRadius),
    30,
  )

  ctx.assert('cleanup restores authored shadow', paint().boxShadow.includes('4px 12px'), true)

  const reacquired = view.createPaintPresentation()

  reacquired.dispose()
  ctx.assert('cleanup releases ownership for the next consumer', true, true)
  ctx.assert('paint writes preserve authored clipping', view.style.clipPath, 'inset(5%)')
}
