/** @jsxImportSource @octane-xplat/jsx */
import { File, Utils } from '@nativescript/core'
import { SmoothCorners } from '../src/index'
import type { ProbeContext } from '../../../tools/probe/context'

declare const android: any
let clicks = 0

export default function InputProbe() @{
  <masonview style={{ width: 400, height: 500, display: 'grid' }}>
    <SmoothCorners
      id="input-panel"
      corners={32}
      left={40}
      top={80}
      style={{ width: 200, height: 120, backgroundColor: '#dbeafe' }}
    >
      <label
        id="input-child"
        text="Tap target"
        style={{ width: '100%', height: '100%', backgroundColor: '#dbeafe' }}
      />
    </SmoothCorners>
  </masonview>
}

export async function run(ctx: ProbeContext) {
  clicks = 0

  const content = await ctx.waitFor(() => ctx.find('input-panel'))

  ctx.record('mounted size', content.getActualSize())
  await ctx.waitFor(() => content.android.getWidth() > 0)

  ctx.record('initial placement', {
    location: content.getLocationOnScreen(),
    focus: content.android.hasWindowFocus(),
  })

  await ctx.waitFor(() => content.getLocationOnScreen().y > 40 && content.android.hasWindowFocus())

  const child = ctx.find('input-child')

  child.android.setClickable(true)
  child.android.setOnTouchListener(
    new android.view.View.OnTouchListener({
      onTouch(_view, event) {
        if (event.getActionMasked() === android.view.MotionEvent.ACTION_UP) {
          clicks++
        }

        return true
      },
    }),
  )

  ctx.onCleanup(() => child.android.setOnTouchListener(null))
  ctx.record('geometry', {
    content: ctx.inspect('input-panel'),
    child: ctx.inspect('input-child'),
    shown: child.android.isShown(),
  })

  const files = String(Utils.android.getApplicationContext().getFilesDir().getAbsolutePath())
  const token = String(Date.now())
  const state = File.fromPath(`${files}/smooth-input.json`)
  const ackPath = `${files}/smooth-input-${token}.ack`
  // Coordinates below are physical screen pixels.
  const location = Array.create('int', 2)

  content.android.getLocationOnScreen(location)

  const position = {
    corner: [location[0] + 1, location[1] + 1],
    center: [
      location[0] + Utils.layout.toDevicePixels(100),
      location[1] + Utils.layout.toDevicePixels(60),
    ],
  }

  const publish = (phase: string) =>
    state.writeTextSync(JSON.stringify({ token, phase, createdAt: Date.now(), ...position }))

  ctx.onCleanup(() => {
    if (File.exists(ackPath)) {
      File.fromPath(ackPath).removeSync()
    }

    state.removeSync()
  })

  publish('visible-corner')
  await ctx.waitFor(() => clicks === 1, { timeout: 15000 })
  ctx.assert('OS input reaches visible corner', clicks, 1)
  content.style.overflow = 'hidden'
  await ctx.waitFor(() => String(content.style.clipPath).startsWith('path('))
  publish('hidden-corner')
  await ctx.waitFor(() => File.exists(ackPath), { timeout: 15000 })
  ctx.assert('OS input excludes hidden curved corner', clicks, 1)
  publish('hidden-center')
  await ctx.waitFor(() => clicks === 2, { timeout: 15000 })
  ctx.assert('OS input reaches hidden center', clicks, 2)
  content.style.overflow = 'visible'
  await ctx.waitFor(() => content.style.clipPath === 'none')
  publish('visible-again')
  await ctx.waitFor(() => clicks === 3, { timeout: 15000 })
  ctx.assert('OS input reaches corner after removing clip', clicks, 3)
  ctx.record('input', { mechanism: 'adb shell input tap', ...position })
}
