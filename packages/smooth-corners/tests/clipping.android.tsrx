/** @jsxImportSource @octane-xplat/jsx */
import { Color, Utils } from '@nativescript/core'
import { SmoothCorners } from '../src/index'
import { commandsToD, generateCommands } from '../src/path'
import { disposeSmoothClip } from '../src/apply.android'
import type { ProbeContext } from '../../../tools/probe/context'

declare const android: any

interface ProbeView {
  style: { clipPath?: string; overflow: string; width: string | number; backgroundColor: Color }
  android: any
  isUserInteractionEnabled: boolean
  getChildAt(index: number): ProbeView
  getActualSize(): { width: number; height: number }
  requestLayout(): void
}

const corners = { radius: 24, curve: 'squircle' as const, smoothing: 0.6 }

export default function ClippingProbe() @{
  return (
    <SmoothCorners
      id="smooth-owner"
      corners={corners}
      border={{ width: 2, color: '#0000ff' }}
      android={{ elevation: 8 }}
      style={{ width: 200, height: 120, backgroundColor: '#dbeafe' }}
    >
      <label text="Mason-owned clipping" />
    </SmoothCorners>
  )
}

const panelIndexes = Array.from({ length: 25 }, (_, i) => i)

function ManyPanels() @{
  <masonview style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', width: 220 }}>
    @for (const index of panelIndexes; key index) {
      <SmoothCorners
        id={'stress-' + index}
        corners={{ radius: 8, curve: 'continuous' }}
        border={{ width: 1, color: '#2563eb' }}
        android={{ elevation: 2 }}
        style={{ width: 40, height: 24, backgroundColor: '#dbeafe' }}
      />
    }
  </masonview>
}

function pathOf(view: ProbeView): string {
  const { width, height } = view.getActualSize()

  return `path("${commandsToD(generateCommands(width, height, corners))}")`
}

export async function run(ctx: ProbeContext) {
  const content: ProbeView = await ctx.waitFor(() => ctx.find('smooth-owner'))

  await ctx.waitFor(() => content.getActualSize().width > 0)

  const surface = content.getChildAt(0)

  await ctx.waitFor(() => surface?.style.clipPath === pathOf(surface))
  ctx.record('runtime', {
    api: android.os.Build.VERSION.SDK_INT,
    density: Utils.layout.toDevicePixels(1),
  })

  ctx.assert(
    'visible content has no path',
    Boolean(content.style.clipPath && content.style.clipPath !== 'none'),
    false,
  )

  ctx.assert('surface has exact logical path', surface.style.clipPath, pathOf(surface))
  ctx.assert(
    'border does not replace Mason painting with a native background',
    surface.android.getBackground() === null,
    true,
  )

  ctx.assert('inside border uses foreground', Boolean(surface.android.getForeground()), true)
  ctx.assert('decorative surface has no input', surface.isUserInteractionEnabled, false)

  for (let i = 0; i < 3; i++) {
    surface.style.backgroundColor = new Color(i % 2 ? '#dbeafe' : '#fed7aa')
    surface.requestLayout()
    await ctx.waitFor(() => surface.style.clipPath === pathOf(surface))
    ctx.assert(`path survives background update ${i}`, surface.style.clipPath, pathOf(surface))
  }

  surface.style.width = 220
  surface.requestLayout()
  await ctx.waitFor(
    () => surface.getActualSize().width === 220 && surface.style.clipPath === pathOf(surface),
  )

  ctx.assert('resized surface has exact path', surface.style.clipPath, pathOf(surface))
  surface.style.width = '100%'
  surface.requestLayout()
  await ctx.waitFor(() => surface.getActualSize().width === 200)

  content.style.overflow = 'hidden'
  content.requestLayout()
  await ctx.waitFor(() => content.style.clipPath === pathOf(content))
  ctx.assert('hidden content uses exact path', content.style.clipPath, pathOf(content))
  ctx.assert(
    'content does not depend on outline clipping',
    content.android.getClipToOutline(),
    false,
  )

  // This exercises the native dispatch/clip implementation, not OS input.
  let touches = 0
  const listener = new android.view.View.OnTouchListener({
    onTouch() {
      touches++
      return true
    },
  })

  content.android.setOnTouchListener(listener)
  ctx.onCleanup(() => content.android?.setOnTouchListener(null))

  const dispatch = (x: number, y: number) => {
    const now = android.os.SystemClock.uptimeMillis()
    const event = android.view.MotionEvent.obtain(
      now,
      now,
      android.view.MotionEvent.ACTION_DOWN,
      x,
      y,
      0,
    )

    try {
      content.android.dispatchTouchEvent(event)
    } finally {
      event.recycle()
    }
  }

  dispatch(1, 1)
  ctx.assert('hidden curved corner rejects native down', touches, 0)
  dispatch(Utils.layout.toDevicePixels(100), Utils.layout.toDevicePixels(60))
  ctx.assert('hidden center accepts native down', touches, 1)

  content.style.overflow = 'visible'
  content.requestLayout()
  await ctx.waitFor(() => content.style.clipPath === 'none')
  dispatch(1, 1)
  ctx.assert('visible corner accepts native down', touches, 2)
  ctx.assert('surface remains shaped', surface.style.clipPath, pathOf(surface))
  disposeSmoothClip(surface)
  ctx.assert('owned foreground removed on disposal', surface.android.getForeground() === null, true)
  ctx.assert('owned CSS clip removed on disposal', surface.style.clipPath, 'none')

  const samples: number[] = []
  let previousSurface: any

  for (let cycle = 0; cycle < 5; cycle++) {
    const started = Date.now()

    ctx.mount(ManyPanels)
    if (previousSurface) {
      ctx.assert(
        `unmount clears foreground ${cycle}`,
        previousSurface.getForeground() === null,
        true,
      )
    }

    const last: ProbeView = await ctx.waitFor(() => ctx.find('stress-24'))

    await ctx.waitFor(() => last.getActualSize().width === 40)
    previousSurface = last.getChildAt(0).android
    ctx.assert(`mounted border ${cycle}`, Boolean(previousSurface.getForeground()), true)
    samples.push(Date.now() - started)
  }

  ctx.mount(ClippingProbe)
  ctx.assert('last stress foreground is released', previousSurface.getForeground() === null, true)
  ctx.record('panel churn', { panels: 25, cycles: 5, settleMs: samples })
}
