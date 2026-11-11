import {
  NSView,
  NSScrollView,
  NSEvent,
  NSProcessInfo,
  NSScreen,
  NSTask,
  NSFileHandle,
  NSWindow,
  AXIsProcessTrusted,
  CGEventCreateMouseEvent,
  CGEventCreateScrollWheelEvent2,
  CGEventSetLocation,
} from '@octane-xplat/platform/macos'

import { readScene } from './scene'
import { runMacOSApp, type MacOSAppMount } from '@octane-xplat/macos-appkit/host'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import { Components, scene } from './components.tsrx'
import { postToPid, postToHid, postKey, KVK } from './appkit-input'
import type { UniversalComponent } from 'octane/universal/native'
import { requestAnimationFrame as nativeFrame } from '@nativescript/core/animation-frame'

declare const __xplatStopHost: () => void
let app: MacOSAppMount['app']
let window: MacOSAppMount['window']
let host: MacOSAppMount['contentView']
let root: MacOSAppMount['root']

const events: { kind: string; detail: unknown }[] = []
const report = (kind: string, detail?: unknown) => {
  events.push({ kind, detail })
  console.log('DESKTOP ' + JSON.stringify({ kind, detail }))
}

// The shared JSX facade types component results as unknown. The native
// compiler lowers this scene to the universal renderable ABI before execution.
const compiledScene = Components as unknown as UniversalComponent<Parameters<typeof Components>[0]>

runMacOSApp({ title: 'octane-packed-gestures', size: { width: 640, height: 600 } }, (target) => {
  app = target.app
  window = target.window
  host = target.contentView
  root = target.root
  target.root.render(compiledScene, { report })
})

let frameSeen = false

nativeFrame((time) => {
  frameSeen = true
  report('native-frame', time)
})

const pause = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))
const check = (ok: boolean, name: string) => {
  if (!ok) {
    throw new Error(name)
  }

  report('check', name)
}

function asView(host: unknown): NSView {
  if (!(host instanceof NSView)) {
    throw new Error('Expected an AppKit view')
  }

  return host
}

let sequence = 0
let held: { x: number; y: number } | null = null
let retired = false
const point = (view: NSView) => {
  const bounds = view.bounds
  const layerPoint = view.convertPointToLayer({
    x: bounds.origin.x + Math.min(30, bounds.size.width / 2),
    y: bounds.origin.y + Math.min(30, bounds.size.height / 2),
  })

  const inContent = host.layer!.convertPointFromLayer(layerPoint, view.layer)

  return host.convertPointToView(host.convertPointFromLayer(inContent), null)
}

const post = async (type: number, p: { x: number; y: number }) => {
  const event =
    NSEvent.mouseEventWithTypeLocationModifierFlagsTimestampWindowNumberContextEventNumberClickCountPressure(
      type,
      p,
      0,
      NSProcessInfo.processInfo.systemUptime,
      window.windowNumber,
      null,
      ++sequence,
      1,
      1,
    )

  postToPid(event.CGEvent)
  await pause(40)
}

const drag = async (view: NSView, dx: number, release = true) => {
  const p = point(view)

  await post(1, p)
  held = p
  for (let i = 1; i <= 20; i++) {
    await post(6, { x: p.x + (dx * i) / 20, y: p.y })
  }

  held = { x: p.x + dx, y: p.y }
  if (release) {
    await post(2, held)
    held = null
  }

  await pause(150)
}

function sliderHost(view: NSView): NSView | null {
  const role: unknown = Reflect.get(view, 'accessibilityRole')

  if ((typeof role === 'function' ? role.call(view) : role) === 'AXSlider') {
    return view
  }

  const children = view.subviews

  for (let index = 0; index < children.count; index++) {
    const child = children.objectAtIndex(index)

    if (child instanceof NSView) {
      const slider = sliderHost(child)

      if (slider) {
        return slider
      }
    }
  }

  return null
}

async function run() {
  await pause(700)

  const hosts = readScene((host): host is NSView => host instanceof NSView)

  check(true, 'public hosts mounted')

  report('precondition', {
    key: window.keyWindow,
    active: app.active,
    axTrusted: AXIsProcessTrusted?.() ?? null,
    parentScale: hosts.parent.layer!.valueForKeyPath('transform.scale.x'),
    immediateParentScale: hosts.motion.superview!.layer!.valueForKeyPath('transform.scale.x'),
    parentType: String(hosts.parent.class()),
    parentFrame: hosts.parent.frame,
    sameHost: hosts.parent === hosts.motion,
    x: hosts.motion.layer!.valueForKeyPath('transform.translation.x'),
  })

  check(frameSeen, 'native display-link frame delivered')
  check(window.keyWindow && app.active, 'owned window is active before OS input')
  check(
    Math.abs(Number(hosts.parent.layer!.valueForKeyPath('transform.scale.x')) - 1.25) < 0.001,
    'scaled parent rendered before input',
  )

  const x = () => Number(hosts.motion.layer!.valueForKeyPath('transform.translation.x'))

  await drag(hosts.button, 100)
  check(events.filter((e) => e.kind === 'drag-finish').length === 1, 'one Motion terminal')
  check(!events.some((e) => e.kind === 'press'), 'drag suppresses nested press')
  check(Math.abs(x() - 80) < 2, '100 window points becomes 80 in scaled parent')

  const p = point(hosts.button)

  await post(1, p)
  await post(2, p)
  await pause(150)
  check(
    events.filter((e) => e.kind === 'press' && e.detail === 'pointer').length === 1,
    'fresh independent pointer activation',
  )

  const count = () => events.filter((e) => e.kind === 'reveal-start').length
  const before = count()

  await drag(asView(hosts.field.native), 60)
  check(count() === before, 'native editing wins over ancestor reveal')

  const slider = sliderHost(hosts.slider)

  check(Boolean(slider), 'public slider exposes its native adjustable host')
  if (!slider) {
    throw new Error('Missing slider host')
  }

  await drag(slider, 50)
  check(
    events.some((event) => event.kind === 'slider-change' && event.detail !== 50),
    'OS drag updates public slider',
  )

  check(count() === before, 'slider manipulation wins over ancestor reveal')

  const scrollView = hosts.scroll.native

  if (!(scrollView instanceof NSScrollView)) {
    throw new Error('Expected a native NSScrollView')
  }

  const offset = () => Number(scrollView.contentView.bounds.origin.y)

  hosts.scroll!.scrollToOffset({ block: 140 })
  await pause(200)

  const viewport = scrollView.bounds
  const localWheelPoint = { x: viewport.size.width / 2, y: viewport.size.height - 30 }
  const wheelWindow = scrollView.convertPointToView(localWheelPoint, null)
  const screen = window.convertPointToScreen(wheelWindow)
  const quartz = {
    x: screen.x,
    y: NSScreen.screens.objectAtIndex(0).frame.size.height - screen.y,
  }

  const wheel = async (delta: number) => {
    check(window.keyWindow && app.active, 'owned window is active before HID wheel')
    postToHid(CGEventCreateMouseEvent(null, 5, quartz, 0))
    await pause(80)

    const event = CGEventCreateScrollWheelEvent2(null, 0, 1, delta, 0, 0)

    CGEventSetLocation(event, quartz)
    postToHid(event)
    await pause(250)
  }

  const initialOffset = offset()

  await wheel(-120)

  const scrolled = offset()

  report('wheel-observed', { initialOffset, scrolled, flipped: scrollView.documentView!.flipped })

  const wheelOK = Math.abs(scrolled - initialOffset) > 1

  await drag(hosts.panel, 80)
  check(count() > before, 'horizontal reveal over scroll viewport')
  check(Math.abs(offset() - scrolled) < 1, 'horizontal claim preserves vertical offset')
  await wheel(60)

  const resumedWheelOK = (offset() - scrolled) * (scrolled - initialOffset) < 0

  const keyboardBefore = events.filter((e) => e.kind === 'press').length

  const accepted = window.makeFirstResponder(hosts.button)

  report('keyboard-focus', { accepted, expected: window.firstResponder === hosts.button })
  check(
    accepted && window.firstResponder === hosts.button && window.keyWindow && app.active,
    'public button owns keyboard focus before HID Space',
  )

  const keyMonitor = NSEvent.addLocalMonitorForEventsMatchingMaskHandler(
    (1 << 10) | (1 << 11),
    (event) => {
      report('key-observed', {
        type: event.type,
        code: event.keyCode,
        window: event.window === window,
      })

      return event
    },
  )

  postKey(KVK.Space, 0, 'hid')
  await pause(200)
  NSEvent.removeMonitor(keyMonitor)
  report('keyboard', {
    key: window.keyWindow,
    delivered: events.filter((e) => e.kind === 'press').length - keyboardBefore,
  })

  const keyboardOK =
    events.filter((e) => e.kind === 'press' && e.detail === 'keyboard').length === 1

  const ax = NSTask.new()

  const axClient = process.env.XPLAT_DESKTOP_AX_CLIENT

  if (!axClient) {
    throw new Error('Independent AX client path is required')
  }

  ax.launchPath = axClient
  ax.standardOutput = NSFileHandle.fileHandleWithStandardOutput
  ax.standardError = NSFileHandle.fileHandleWithStandardError
  ax.launch()
  for (let attempt = 0; ax.running && attempt < 50; attempt++) {
    await pause(100)
  }

  report('ax-client', { running: ax.running, status: ax.running ? null : ax.terminationStatus })
  check(
    !ax.running && ax.terminationStatus === 0,
    'independent AX service client invokes public button',
  )

  await pause(100)
  check(
    events.filter((e) => e.kind === 'press' && e.detail === 'accessibility').length === 1,
    'AX service activation arrives exactly once',
  )

  check(keyboardOK, 'OS Space activates exactly once with keyboard provenance')
  check(wheelOK, 'OS wheel scrolls native viewport')
  check(resumedWheelOK, 'OS wheel resumes after horizontal reveal')

  await drag(hosts.button, 30, false)

  const other = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
    { origin: { x: 30, y: 30 }, size: { width: 100, height: 100 } },
    15,
    2,
    false,
  )

  try {
    other.makeKeyAndOrderFront(null)
    await pause(200)
    check(!window.keyWindow && other.keyWindow, 'native window focus changes during held drag')

    const terminals = events.filter((event) => event.kind === 'drag-finish')
    const terminal = terminals.at(-1)?.detail

    check(
      terminals.length === 2 &&
        terminal !== null &&
        typeof terminal === 'object' &&
        'cancelled' in terminal &&
        terminal.cancelled === true,
      'window interruption cancels Motion exactly once',
    )

    await post(2, held!)
    held = null
  } finally {
    other.close()
  }

  window.makeKeyAndOrderFront(null)
  await pause(100)

  const finalX = x(),
    finalOffset = offset()

  await drag(hosts.button, 20, false)

  const beforeRetirement = events.length

  root.unmount()
  retired = true
  await pause(100)
  await post(2, held!)
  held = null
  await pause(100)
  check(
    events.length === beforeRetirement,
    'active Motion retirement silences callbacks through OS release',
  )

  report('complete', {
    x: finalX,
    scroll: finalOffset,
    input: 'CGEventPostToPid mouse; HID wheel/Space; independent AX service client',
  })
}

void run()
  .catch((error) => report('failure', { message: error.message, stack: error.stack }))
  .finally(async () => {
    if (held) {
      await post(2, held)
    }

    if (!retired) {
      root.unmount()
    }

    report('retired', {
      motion: scene.motion,
      button: scene.button,
      scroll: scene.scroll,
      field: scene.field,
    })

    window.close()
    __xplatStopHost()
  })
