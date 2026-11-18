/** @jsxImportSource @octane-xplat/jsx */
import { RootLayout } from '@nativescript/core'
import { Overlay, Pressable, Screen, Text, View } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ProbeContext } from '../../tools/probe/context'

// Maintained for the Mason-rooted mobile Screen: overlays live in a RootLayout
// attached over the shell, outside the rendered tree. Checks real hit testing
// (UIKit hitTest / Android decor-view touch dispatch), not OS HID input.
let setModal: (open: boolean) => void = () => {}

export default function ScreenOverlays() {
  const [count, setCount] = useState(0)
  const [modal, openModal] = useState(false)

  setModal = openModal
  return (
    <Screen id="overlay-screen">
      <View style={{ flexGrow: 1, justifyContent: 'flex-end', padding: 40 }}>
        <Pressable id="content-button" onPress={() => setCount((value) => value + 1)}>
          <Text id="count">{'count ' + count}</Text>
        </Pressable>
      </View>
      <Overlay open={modal} shadeCover onDismiss={() => openModal(false)}>
        <View id="overlay-panel" style={{ padding: 24, backgroundColor: '#ffffff' }}>
          <Text>Overlay</Text>
        </View>
      </Overlay>
    </Screen>
  )
}

declare const CGPointMake: any
declare const android: any

function frame(view: any) {
  if (globalThis.android) {
    const location = Array.create('int', 2)
    view.nativeViewProtected.getLocationOnScreen(location)
    return {
      x: location[0],
      y: location[1],
      width: view.nativeViewProtected.getWidth(),
      height: view.nativeViewProtected.getHeight(),
    }
  }
  const native = view.nativeViewProtected
  const rect = native.convertRectToView(native.bounds, null)
  return { x: rect.origin.x, y: rect.origin.y, width: rect.size.width, height: rect.size.height }
}

function overlayHost(shell: any): any {
  let host: any
  shell.eachChildView((child: any) => {
    host = child instanceof RootLayout ? child : undefined
    return !host
  })
  return host
}

function isAncestor(ancestor: any, view: any) {
  for (let current = view; current; current = current.parent) {
    if (current === ancestor) {
      return true
    }
  }
  return false
}

export async function run(ctx: ProbeContext) {
  if (ctx.target !== 'ios' && ctx.target !== 'android') {
    throw new Error('This fixture qualifies the native mobile Screen only')
  }
  await ctx.waitFor(() => ctx.inspect('content-button').frame?.height)
  const shell = ctx.find('overlay-screen')
  const button = ctx.find('content-button')
  const host = overlayHost(shell)
  const ios = ctx.target === 'ios'

  ctx.assert('Screen attaches one RootLayout overlay host', host instanceof RootLayout, true)
  ctx.assert('overlay host passes empty-area touches', host.isPassThroughParentEnabled, true)
  await ctx.waitFor(() => frame(host).height > 0)
  const shellBox = frame(shell)
  const hostBox = frame(host)
  ctx.record('shell', shellBox)
  ctx.record('host', hostBox)
  ctx.assert(
    'overlay host covers the Screen shell',
    (['x', 'y', 'width', 'height'] as const).every((key) => Math.abs(shellBox[key] - hostBox[key]) <= 1),
    true,
  )

  const reachesButton = async (label: string, expected: boolean) => {
    if (ios) {
      const window = button.nativeViewProtected.window
      const box = frame(button)
      const hit = window.hitTestWithEvent(CGPointMake(box.x + box.width / 2, box.y + box.height / 2), null)
      ctx.assert(label, !!hit && hit.isDescendantOfView(button.nativeViewProtected), expected)
      return
    }
    const box = frame(button)
    const decor = button.nativeViewProtected.getRootView()
    const origin = Array.create('int', 2)
    decor.getLocationOnScreen(origin)
    const before = ctx.inspect('count').text
    const now = android.os.SystemClock.uptimeMillis()
    for (const action of [android.view.MotionEvent.ACTION_DOWN, android.view.MotionEvent.ACTION_UP]) {
      const event = android.view.MotionEvent.obtain(
        now,
        now + 20,
        action,
        box.x - origin[0] + box.width / 2,
        box.y - origin[1] + box.height / 2,
        0,
      )
      decor.dispatchTouchEvent(event)
      event.recycle()
    }
    await new Promise((done) => setTimeout(done, 300))
    ctx.assert(label, ctx.inspect('count').text !== before, expected)
  }

  await reachesButton('content receives touches through the empty overlay host', true)

  setModal(true)
  const panel = await ctx.waitFor(() => {
    const view = ctx.find('overlay-panel')
    return view && frame(view).height > 0 ? view : null
  })
  ctx.assert('Overlay renders inside the Screen overlay host', isAncestor(host, panel), true)
  await new Promise((done) => setTimeout(done, 400))
  await reachesButton('shade cover blocks content touches', false)

  setModal(false)
  await ctx.waitFor(() => !ctx.find('overlay-panel'))
  await new Promise((done) => setTimeout(done, 400))
  await reachesButton('closing the overlay restores content touches', true)
}
