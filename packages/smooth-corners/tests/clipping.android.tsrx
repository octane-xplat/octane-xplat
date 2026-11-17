/** @jsxImportSource @octane-xplat/jsx */
import { Utils } from '@nativescript/core'
import { SmoothCorners } from '../src/index'
import type { ProbeContext } from '../../../tools/probe/context'

declare const android: any
interface ProbeView {
  style: { overflow: string; width: string | number; borderWidth: number }
  android: any
  isUserInteractionEnabled: boolean
  getChildAt(index: number): ProbeView
  getActualSize(): { width: number; height: number }
  requestLayout(): void
}

export default function ClippingProbe() @{
  return (
    <SmoothCorners id="smooth-owner" corners={{ radius: 24, curve: 'squircle', smoothing: 0.6 }}
      border={{ width: 2, color: '#0000ff' }} android={{ elevation: 8 }}
      style={{ width: 200, height: 120, backgroundColor: '#dbeafe' }}>
      <label text="Mason-owned clipping" />
    </SmoothCorners>
  )
}

export async function run(ctx: ProbeContext) {
  const content: ProbeView = await ctx.waitFor(() => ctx.find('smooth-owner'))
  await ctx.waitFor(() => content.getActualSize().width === 200)
  const surface = content.getChildAt(0)
  ctx.assert('surface border belongs to Mason style', surface.style.borderWidth, 2)
  ctx.assert('decorative surface has no input', surface.isUserInteractionEnabled, false)
  let touches = 0
  const listener = new android.view.View.OnTouchListener({ onTouch() { touches++; return true } })
  content.android.setOnTouchListener(listener)
  ctx.onCleanup(() => content.android?.setOnTouchListener(null))
  const dispatch = (x: number, y: number) => {
    const now = android.os.SystemClock.uptimeMillis()
    const event = android.view.MotionEvent.obtain(now, now, android.view.MotionEvent.ACTION_DOWN, x, y, 0)
    try { content.android.dispatchTouchEvent(event) } finally { event.recycle() }
  }
  dispatch(1, 1)
  ctx.assert('visible corner accepts native down', touches, 1)
  content.style.overflow = 'hidden'
  content.requestLayout()
  await ctx.waitFor(() => content.style.overflow === 'hidden')
  dispatch(1, 1)
  ctx.assert('hidden corner rejects native down', touches, 1)
  dispatch(Utils.layout.toDevicePixels(100), Utils.layout.toDevicePixels(60))
  ctx.assert('hidden center accepts native down', touches, 2)
  content.style.overflow = 'visible'
  content.requestLayout()
  await ctx.waitFor(() => content.style.overflow === 'visible')
  dispatch(1, 1)
  ctx.assert('restored corner accepts native down', touches, 3)
  surface.style.width = 220
  surface.requestLayout()
  await ctx.waitFor(() => Math.abs(surface.getActualSize().width - 220) <= 1 / Utils.layout.toDevicePixels(1))
  ctx.assert('surface resizes within one physical pixel', Math.abs(surface.getActualSize().width - 220) <= 1 / Utils.layout.toDevicePixels(1), true)
  surface.style.width = '100%'
  surface.requestLayout()
  await ctx.waitFor(() => surface.getActualSize().width === 200)
}
