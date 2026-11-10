/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import type { ProbeContext } from '../../../../tools/probe/context'
import { View, Pressable, Text, usePanGesture$ } from '@octane-xplat/ui'
import { screenPointOfViewCenter, postToPid, postToHid } from '../../../../tools/probe/appkit-input'

const state = { starts: 0, updates: 0, ends: 0, presses: 0, source: '', x: 0, in: 0, out: 0 }

export default function MacOwner() {
  const host = useRef<NSView | null>(null),
    origin = useRef({ x: 0, y: 0 })

  const [tick, setTick] = useState(0)
  const pan = usePanGesture$({
    axis: 'x',
    onStart() {
      state.starts++
      origin.current = { x: host.current!.frame.origin.x, y: host.current!.frame.origin.y }
    },
    onUpdate(sample) {
      state.updates++
      state.x = sample.translation.x

      const size = host.current!.frame.size

      host.current!.frame = {
        origin: { x: origin.current.x + state.x, y: origin.current.y },
        size: { width: size.width, height: size.height },
      }

      setTick(tick + 1)
    },
    onEnd() {
      state.ends++
    },
  })

  return (
    <View id="mac-panel" ref={host} gestures={pan} style={{ height: 450, width: 350 }}>
      <Pressable
        id="mac-button"
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Owner action"
        onPress={(event) => {
          state.presses++
          state.source = event.source
        }}
        onPressIn={() => {
          state.in++
        }}
        onPressOut={() => {
          state.out++
        }}
        style={{ height: 160, width: 280 }}
      >
        <Text>Owner action</Text>
      </Pressable>
    </View>
  )
}

export async function run(ctx: ProbeContext) {
  const panel = await ctx.waitFor(() => ctx.find('mac-panel'))
  const button = await ctx.waitFor(() => ctx.find('mac-button'))

  await ctx.waitFor(() => button.window && button.bounds.size.width > 100)
  button.window.makeKeyAndOrderFront(null)

  NSApplication.sharedApplication.activateIgnoringOtherApps(true)
  button.window.orderFrontRegardless()

  const activationPoint = screenPointOfViewCenter(button)

  ctx.record('hidCapability', {
    trusted: typeof AXIsProcessTrusted === 'function' ? AXIsProcessTrusted() : null,
  })

  for (const type of [5, 1, 2]) {
    postToHid(CGEventCreateMouseEvent(null, type, activationPoint, 0))
    await new Promise((resolve) => setTimeout(resolve, 80))
  }

  await new Promise((resolve) => setTimeout(resolve, 300))

  const w = button.window,
    app = NSApplication.sharedApplication

  ctx.record('inputPrecondition', {
    window: w.windowNumber,
    key: w.keyWindow,
    canKey: w.canBecomeKeyWindow,
    appActive: app.active,
    keyWindow: app.keyWindow?.windowNumber,
    isKey: typeof w.isKeyWindow === 'function' ? w.isKeyWindow() : w.isKeyWindow,
  })

  const events: {
    type: number
    window: number | undefined
    same: boolean
    equal: boolean | undefined
    x: number
    y: number
  }[] = []

  const monitor = NSEvent.addLocalMonitorForEventsMatchingMaskHandler(
    (1 << 1) | (1 << 2) | (1 << 6),
    (event: NSEvent) => {
      events.push({
        type: event.type,
        window: event.window?.windowNumber,
        same: event.window === w,
        equal: event.window?.isEqual(w),
        x: event.locationInWindow.x,
        y: event.locationInWindow.y,
      })

      return event
    },
  )

  ctx.onCleanup(() => NSEvent.removeMonitor(monitor))
  Object.assign(state, {
    starts: 0,
    updates: 0,
    ends: 0,
    presses: 0,
    source: '',
    x: 0,
    in: 0,
    out: 0,
  })

  const point = screenPointOfViewCenter(button)

  ctx.record('geometry', {
    point,
    window: { key: panel.window.keyWindow, visible: panel.window.visible },
    panel: panel.frame,
    button: button.frame,
  })

  let eventNumber = 0
  const center = button.convertPointToView(
    {
      x: button.bounds.origin.x + button.bounds.size.width / 2,
      y: button.bounds.origin.y + button.bounds.size.height / 2,
    },
    null,
  )

  const post = (type: number, x: number) => {
    const native =
      NSEvent.mouseEventWithTypeLocationModifierFlagsTimestampWindowNumberContextEventNumberClickCountPressure(
        type,
        { x: center.x + x - point.x, y: center.y },
        0,
        NSProcessInfo.processInfo.systemUptime,
        button.window.windowNumber,
        null,
        ++eventNumber,
        1,
        1,
      )

    postToPid(native.CGEvent)
  }

  post(1, point.x)
  await new Promise((resolve) => setTimeout(resolve, 40))
  for (let step = 1; step <= 40; step++) {
    post(6, point.x + step * 2)
    await new Promise((resolve) => setTimeout(resolve, 20))
  }

  post(2, point.x + 80)
  await new Promise((resolve) => setTimeout(resolve, 200))
  ctx.record('nativeEvents', events)
  ctx.record('afterDrag', { ...state })
  await ctx.waitFor(() => state.ends === 1, { timeout: 5000 })
  ctx.assert('moving panel OS drag never activates child', state.presses, 0)

  const fresh = button.convertPointToView(
    {
      x: button.bounds.origin.x + button.bounds.size.width / 2,
      y: button.bounds.origin.y + button.bounds.size.height / 2,
    },
    null,
  )

  for (const type of [1, 2]) {
    const native =
      NSEvent.mouseEventWithTypeLocationModifierFlagsTimestampWindowNumberContextEventNumberClickCountPressure(
        type,
        fresh,
        0,
        NSProcessInfo.processInfo.systemUptime,
        button.window.windowNumber,
        null,
        ++eventNumber,
        1,
        1,
      )

    postToPid(native.CGEvent)
    await new Promise((resolve) => setTimeout(resolve, 40))
  }

  await ctx.waitFor(() => state.presses === 1, { timeout: 5000 })
  ctx.assert('fresh independent pointer activation', state.source, 'pointer')
  ctx.assert('accessibility native method accepts action', button.accessibilityPerformPress(), true)
  ctx.assert('accessibility handler source', state.source, 'accessibility')
  ctx.assert('balanced pointer lifecycle', state.in, state.out)
  ctx.record(
    'evidence',
    'Window-targeted NSEvent.CGEvent mouse input posted with CGEventPostToPid through the OS queue. Native accessibility method dispatch is handler-route evidence only. Keyboard OS input remains unqualified because this host cannot become active/key.',
  )

  ctx.record('state', state)
}
