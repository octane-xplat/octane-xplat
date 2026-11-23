/** @jsxImportSource @octane-xplat/jsx */
import '@nativescript/macos-node-api'
import { ActionBar, Application, GridLayout, Label, LiquidGlass, TextField } from '@nativescript/core'
import { createNativeScriptRoot } from '@octane-xplat/nativescript-octane'
import { hmrUniversalComponent, UNIVERSAL_HMR, type UniversalRoot } from 'octane/universal/native'
import { appMenu } from '../../../app-menu/src/index.macos.ts'
import { createTray, getTrayAvailability } from '../../../tray/src/index.macos.ts'
import { createShortcuts } from '../../../shortcuts/src/index.macos.ts'
import { openWindow } from '../../src/host-windowing'
import { runMacOSApp } from '@octane-xplat/macos-appkit/host'
import {
  __installDevelopmentModules,
  __rendererId,
  createMacOSRoot,
  observeLayoutCommits,
  registerStylesheet,
  setLayoutProjectionScale,
} from '@octane-xplat/macos-appkit'
import { postToPid } from '../../../../tools/probe/appkit-input'
import { useInteractionHost } from '../../../ui/src/gestures/host-core.macos'
import { TextArea } from '../../../ui/src/components/forms/TextArea.tsrx'
import './nativescript-provider.css'

let automationButtonPresses = 0
const editorEvents: string[] = []
const notesEvents: string[] = []

function Screen() {
  return (
    <masonview style={{ width: 320, height: 220, flexDirection: 'column' }}>
      <label
        id="title"
        text="NativeScript Core on AppKit"
        accessibilityLabel="Provider status"
        accessibilityHint="Core provider fixture"
        className="provider-title"
      />
      <textfield
        id="editor"
        hint="Provider editor"
        onFocus={() => editorEvents.push('focus')}
        onBlur={() => editorEvents.push('blur')}
        onReturnPress={() => editorEvents.push('submit')}
      />
      <textview
        id="notes"
        hint="Notes"
        style={{ width: 160, height: 40 }}
        onFocus={() => notesEvents.push('focus')}
        onBlur={() => notesEvents.push('blur')}
        onReturnPress={() => notesEvents.push('submit')}
      />
      <button text="Core automation" onTap={() => automationButtonPresses++} />
      <liquidglass id="glass" style={{ width: 160, height: 48 }}>
        <label id="glass-content" text="Glass content" />
      </liquidglass>
      <actionbar id="bar" title="Initial" style={{ width: 220 }} />
      <actionbar id="child-bar" style={{ width: 220 }}>
        <label id="bar-child" text="Custom title" style={{ width: 120, height: 20 }} />
      </actionbar>
      <masonview id="date-control-host" style={{ width: 150, height: 26 }} />
      <masonview id="paint" style={{ width: 40, height: 30 }} />
      <masonview id="flex-shorthand" style={{ flex: 1 }} />
      <scrollview id="viewport" style={{ width: 250, height: 80 }}>
        <masonview style={{ width: 200, height: 380 }}>
          <label text="Scrollable content" />
        </masonview>
      </scrollview>
    </masonview>
  )
}

function stop() {
  Reflect.get(globalThis, '__xplatStopHost')?.()
  const event = NSEvent.otherEventWithTypeLocationModifierFlagsTimestampWindowNumberContextSubtypeData1Data2(
    15, NSMakePoint(0, 0), 0, 0, 0, null, 0, 0, 0,
  )
  NSApplication.sharedApplication.postEventAtStart(event)
}

let host: GridLayout
let root: UniversalRoot
let applicationReady = false
Application.once(Application.readyEvent, () => {
  applicationReady = !Application.macos.window
})
runMacOSApp({
  title: 'Core provider fixture',
  size: { width: 1024, height: 700 },
}, (target) => {
  const applicationRoot = Application.getRootView()
  if (!applicationReady || !(applicationRoot instanceof GridLayout)) {
    throw new Error('Core did not publish its root after the ready event')
  }
  if (target.window !== Application.macos.window || target.window.title !== 'Core provider fixture') {
    throw new Error('Core did not use the desktop host window and root')
  }
  host = applicationRoot
  root = target.root
  root.render(Screen, {})
  return () => console.log('CORE_PROVIDER_CLEANUP')
})

function SecondaryWindow() {
  return <label className="provider-viewport" text="Secondary Core window" />
}

async function checkEmbeddedCoreRoot() {
  const content = NSView.alloc().initWithFrame(NSMakeRect(10, 10, 290, 180))
  const root = createMacOSRoot(content, { fontFamily: 'Menlo' })
  try {
    root.render(SecondaryWindow, {})
    const host = content.subviews.objectAtIndex(0)
    const label = host.subviews.objectAtIndex(0)
    if (host.frame.size.width !== 290 || label.font.familyName !== 'Menlo') {
      throw new Error(`The embedded Core root lost its size or font: ${host.frame.size.width}, ${label.font.familyName}`)
    }
    content.setFrameSize(NSMakeSize(340, 190))
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (host.frame.size.width !== 340 || host.frame.size.height !== 190) {
      throw new Error('The embedded Core root did not follow its AppKit content frame')
    }
  } finally {
    root.unmount()
    root.unmount()
    if (content.subviews.count !== 0) {
      throw new Error('The embedded Core root remained attached after unmount')
    }
  }
}

function SizingArea({ value, maxRows, control }) {
  return (
    <masonview style={{ width: 200, height: 240, flexDirection: 'column' }}>
      <TextArea
        id="sizing-area"
        rows={2}
        autoGrow
        maxRows={maxRows}
        value={value}
        ref={control}
        style={{ width: 160 }}
      />
    </masonview>
  )
}

function BuilderControls() {
  return (
    <masonview style={{ width: 240, height: 200, display: 'flex', flexDirection: 'column' }}>
      <listview
        id="xml-list"
        items={['Native row']}
        itemTemplate={'<MasonView><Label text="{{ $value }}"/></MasonView>'}
        style={{ width: 160, height: 80 }}
      />
      <timepicker id="string-time" time="09:35:10" />
      <segmentedbar id="array-segments" items={[{ title: 'First' }, { title: 'Second' }]} />
      <segmentedbar id="child-segments">
        <segmentedbaritem title="One" />
        <segmentedbaritem title="Two" />
      </segmentedbar>
    </masonview>
  )
}

async function checkBuilderControls() {
  const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
    NSMakeRect(0, 0, 260, 180), 1, 2, false,
  )
  const root = createMacOSRoot(window.contentView)
  try {
    let rejected = false
    try {
      createMacOSRoot(window.contentView)
    } catch (error) {
      rejected = /already hosts a Core root/.test(String(error))
    }
    if (!rejected) {
      throw new Error('Core admitted a duplicate AppKit layout host')
    }
    root.render(BuilderControls, {})
    await new Promise((resolve) => setTimeout(resolve, 30))
    const debug = Reflect.get(root, '__macosDebug')
    const table = debug.findId('xml-list').documentView
    const row = table.viewAtColumnRowMakeIfNecessary(0, 0, true)
    const label = row?.subviews.firstObject?.subviews.firstObject
    if (label?.stringValue !== 'Native row') {
      throw new Error('The ListView XML template did not bind its Mason row: ' + label?.stringValue)
    }
    const dateValue = debug.findId('string-time').dateValue
    const time = new Date(dateValue.timeIntervalSince1970 * 1000)
    if (time.getHours() !== 9 || time.getMinutes() !== 35) {
      throw new Error('The AppKit time picker did not display the authored time')
    }
    const array = debug.findId('array-segments')
    const children = debug.findId('child-segments')
    if (array.segmentCount !== 2 || array.labelForSegment(1) !== 'Second' ||
      children.segmentCount !== 2 || children.labelForSegment(1) !== 'Two') {
      throw new Error('The AppKit segmented controls lost their item order')
    }
  } finally {
    root.unmount()
    window.close()
  }
}

function KeyedLayout(props: { row: boolean }) {
  return (
    <masonview
      style={{ display: 'flex', flexDirection: props.row ? 'row' : 'column', width: 240, height: 80 }}
    >
      {(props.row ? ['c', 'a', 'b'] : ['a', 'b', 'c']).map((id) => (
        <label key={id} id={id} text={id} style={{ width: 40, height: 16 }} />
      ))}
    </masonview>
  )
}

async function checkKeyedLayout() {
  const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
    NSMakeRect(0, 0, 260, 180), 1, 2, false,
  )
  const root = createMacOSRoot(window.contentView)
  try {
    root.render(KeyedLayout, { row: false })
    await new Promise((resolve) => setTimeout(resolve, 30))
    const debug = Reflect.get(root, '__macosDebug')
    const a = debug.findId('a')
    const b = debug.findId('b')
    const c = debug.findId('c')
    root.render(KeyedLayout, { row: true })
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (debug.findId('c') !== c || c.superview !== a.superview ||
      c.frame.origin.y !== b.frame.origin.y ||
      !(c.frame.origin.x < a.frame.origin.x && a.frame.origin.x < b.frame.origin.x)) {
      throw new Error('Core keyed layout move lost its native child or row position')
    }
  } finally {
    root.unmount()
    window.close()
  }
}

function ProjectedLeaves(props: { width: number }) {
  return (
    <masonview id="projection-layout" style={{ width: 200, height: 55, display: 'flex' }}>
      <proxyviewcontainer>
        <proxyviewcontainer>
          <label id="projected-leaf" text="A" style={{ width: props.width, height: 20 }} />
        </proxyviewcontainer>
      </proxyviewcontainer>
    </masonview>
  )
}

async function checkProjectedLeaves() {
  const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
    NSMakeRect(0, 0, 260, 180), 1, 2, false,
  )
  const root = createMacOSRoot(window.contentView)
  try {
    root.render(ProjectedLeaves, { width: 40 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    const debug = Reflect.get(root, '__macosDebug')
    const parent = debug.findId('projection-layout')
    const label = debug.findId('projected-leaf')
    const width = () => label.alignmentRectForFrame(label.frame).size.width
    if (label.superview !== parent || width() !== 40) {
      throw new Error('Core omitted initial geometry on an AppKit view projected through proxies')
    }
    root.render(ProjectedLeaves, { width: 75 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (debug.findId('projected-leaf') !== label || width() !== 75) {
      throw new Error('Core lost reactive geometry on an AppKit view projected through proxies')
    }
  } finally {
    root.unmount()
    window.close()
  }
}

function ProjectedGrid(props: { row: string; explicitRow?: string }) {
  return (
    <masonview
      style={{ display: 'grid', width: 100, height: 60, gridTemplateRows: '30px 30px' }}
    >
      <proxyviewcontainer style={{ gridRow: props.row }}>
        <contentview id="projected-grid-item" style={{ gridRow: props.explicitRow }} />
      </proxyviewcontainer>
    </masonview>
  )
}

async function checkProjectedGrid() {
  const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
    NSMakeRect(0, 0, 260, 180), 1, 2, false,
  )
  const root = createMacOSRoot(window.contentView)
  try {
    root.render(ProjectedGrid, { row: '1' })
    await new Promise((resolve) => setTimeout(resolve, 30))
    const debug = Reflect.get(root, '__macosDebug')
    const item = debug.findId('projected-grid-item')
    const initialY = item.frame.origin.y
    root.render(ProjectedGrid, { row: '2' })
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (initialY - item.frame.origin.y !== 30) {
      throw new Error('Core did not forward a changed grid row from the proxy')
    }
    root.render(ProjectedGrid, { row: '2', explicitRow: '1' })
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (item.frame.origin.y !== initialY || debug.findId('projected-grid-item') !== item) {
      throw new Error('Core did not honor the projected child’s authored grid row')
    }
  } finally {
    root.unmount()
    window.close()
  }
}

function AbsoluteLeaf(props: { bottom: boolean }) {
  return (
    <masonview style={{ width: 120, height: 100, position: 'relative' }}>
      <label
        id="absolute-leaf"
        text="Inset"
        style={{
          position: 'absolute',
          left: 0,
          top: props.bottom ? undefined : 0,
          bottom: props.bottom ? 0 : undefined,
          width: 60,
          height: 20,
        }}
      />
    </masonview>
  )
}

async function checkInsetReset() {
  const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
    NSMakeRect(0, 0, 260, 180), 1, 2, false,
  )
  const root = createMacOSRoot(window.contentView)
  try {
    root.render(AbsoluteLeaf, { bottom: false })
    await new Promise((resolve) => setTimeout(resolve, 30))
    const debug = Reflect.get(root, '__macosDebug')
    const label = debug.findId('absolute-leaf')
    const y = () => label.alignmentRectForFrame(label.frame).origin.y
    const initialY = y()
    root.render(AbsoluteLeaf, { bottom: true })
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (debug.findId('absolute-leaf') !== label || initialY - y() !== 80) {
      throw new Error('Core retained a cleared absolute inset on a Mason leaf')
    }
  } finally {
    root.unmount()
    window.close()
  }
}

function NestedContent() {
  return (
    <masonview style={{ display: 'flex', flexDirection: 'column' }}>
      <contentview id="fixed-content" style={{ width: 200, height: 80 }}>
        <masonview id="nested-grid" style={{ display: 'grid', width: 200, height: 80 }}>
          <label
            id="centered-label"
            text="Centered"
            style={{ width: 60, height: 20, justifySelf: 'center', alignSelf: 'center' }}
          />
        </masonview>
      </contentview>
      <contentview id="natural-content">
        <label text="Natural" style={{ width: 52, height: 18 }} />
      </contentview>
    </masonview>
  )
}

async function checkNestedContent() {
  const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
    NSMakeRect(0, 0, 260, 180), 1, 2, false,
  )
  const root = createMacOSRoot(window.contentView)
  try {
    root.render(NestedContent, {})
    await new Promise((resolve) => setTimeout(resolve, 30))
    const debug = Reflect.get(root, '__macosDebug')
    const grid = debug.findId('nested-grid')
    const label = debug.findId('centered-label')
    const origin = label.alignmentRectForFrame(label.frame).origin
    const natural = debug.findId('natural-content')
    if (grid.frame.size.width !== 200 || grid.frame.size.height !== 80 ||
      Math.abs(origin.x - 70) >= 1 || Math.abs(origin.y - 30) >= 1 ||
      natural.frame.size.height !== 18 || natural.intrinsicContentSize.height !== 18) {
      throw new Error('Core ContentView did not measure and lay out its content inside Mason')
    }
  } finally {
    root.unmount()
    window.close()
  }
}

function ForeignView(props: { width: number; onCreatingView: (event: { object?: unknown; view?: unknown }) => void }) {
  return (
    <placeholder
      id="foreign-view"
      style={{ width: props.width, height: 30 }}
      onCreatingView={props.onCreatingView}
    />
  )
}

async function checkForeignView() {
  const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
    NSMakeRect(0, 0, 260, 180), 1, 2, false,
  )
  const root = createMacOSRoot(window.contentView)
  const content = NSTextField.labelWithString('Native plug-in content')
  const contentWidth = () => content.alignmentRectForFrame(content.frame).size.width
  let creates = 0
  let eventHost: unknown
  const onCreatingView = (event: { object?: unknown; view?: unknown }) => {
    creates++
    eventHost = event.object
    event.view = content
  }
  try {
    root.render(ForeignView, { width: 80, onCreatingView })
    await new Promise((resolve) => setTimeout(resolve, 30))
    const debug = Reflect.get(root, '__macosDebug')
    const native = debug.findId('foreign-view')
    if (native !== eventHost || content.superview !== native || contentWidth() !== 80) {
      throw new Error(
        'Core Placeholder assignment failed: ' +
          JSON.stringify({ creates, sameHost: native === eventHost, attached: content.superview === native,
            width: contentWidth(), hostWidth: native?.frame.size.width }),
      )
    }
    root.render(ForeignView, { width: 120, onCreatingView })
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (creates !== 1 || content.superview !== native || contentWidth() !== 120) {
      throw new Error('Core Placeholder replaced its assigned view on resize')
    }
  } finally {
    root.unmount()
    window.close()
  }
  if (content.superview) {
    throw new Error('Core Placeholder retained plug-in content after unmount')
  }
}

function HtmlText(props: { changed: boolean }) {
  return (
    <htmlview
      id="provider-html"
      html={props.changed ? '<i>Updated &amp; 世界</i>' : '<b>Hello</b> &amp; <a href="https://example.com">link</a>'}
      style={{ width: 200, fontSize: props.changed ? 24 : 20 }}
    />
  )
}

async function checkHtmlText() {
  const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
    NSMakeRect(0, 0, 260, 180), 1, 2, false,
  )
  const root = createMacOSRoot(window.contentView)
  try {
    root.render(HtmlText, { changed: false })
    await new Promise((resolve) => setTimeout(resolve, 30))
    const debug = Reflect.get(root, '__macosDebug')
    const first = debug.findId('provider-html')
    if (first.editable || !first.selectable || first.stringValue.trim() !== 'Hello & link' ||
      !first.attributedStringValue.attributeAtIndexEffectiveRange(NSLinkAttributeName, 8, null)) {
      throw new Error('Core HtmlView lost its selectable markup and link')
    }
    root.render(HtmlText, { changed: true })
    await new Promise((resolve) => setTimeout(resolve, 30))
    const font = first.attributedStringValue.attributeAtIndexEffectiveRange(NSFontAttributeName, 0, null)
    if (debug.findId('provider-html') !== first || first.stringValue.trim() !== 'Updated & 世界' ||
      font.pointSize !== 24) {
      throw new Error('Core HtmlView did not update its Unicode markup and style in place')
    }
  } finally {
    root.unmount()
    window.close()
  }
}

async function checkSharedTextAreaSizing() {
  const window = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
    NSMakeRect(0, 0, 250, 250), 1, 2, false,
  )
  const root = createMacOSRoot(window.contentView)
  const control = { current: null }
  try {
    root.render(SizingArea, { control, value: 'short', maxRows: 3 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    const editor = Reflect.get(root, '__macosDebug').findId('sizing-area')
    const viewport = editor.enclosingScrollView
    const initial = viewport.frame.size.height
    if (initial <= 0 || control.current?.native !== editor) {
      throw new Error(`The shared TextArea did not mount a sized AppKit editor: height ${initial}`)
    }

    const value = 'first\nsecond\nthird\nfourth\nfifth\nsixth'
    root.render(SizingArea, { control, value, maxRows: 3 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    const capped = viewport.frame.size.height
    if (capped <= initial || capped > initial * 1.5 + 1 || viewport.documentView.frame.size.height <= capped) {
      throw new Error(`The shared TextArea did not grow to a scrollable cap: ${initial} → ${capped}, document ${viewport.documentView.frame.size.height}`)
    }

    root.render(SizingArea, { control, value })
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (viewport.frame.size.height <= capped) {
      throw new Error(`Removing the shared TextArea cap did not grow its viewport: ${capped} → ${viewport.frame.size.height}`)
    }
  } finally {
    root.unmount()
    window.close()
  }
}

function checkDesktopDatePicker() {
  const target = host.getViewById('date-control-host')
  const nativeHost = target.nativeViewProtected
  const initial = Date.UTC(2026, 10, 20, 12)
  const updated = Date.UTC(2026, 10, 25, 12)
  let selection
  const bridge = Reflect.get(globalThis, '__xplatAppKit')
  const control = bridge.attachDatePicker(target, { selectionMillis: initial }, (date) => {
    selection = date
  })
  if (!control) {
    throw new Error('AppKit could not attach a date picker to a Core view')
  }
  const picker = nativeHost.subviews.objectAtIndex(0)
  try {
    if (!(picker instanceof NSDatePicker) || picker.dateValue.timeIntervalSince1970 * 1000 !== initial) {
      throw new Error('The AppKit date control did not receive its initial value')
    }
    picker.dateValue = NSDate.dateWithTimeIntervalSince1970(updated / 1000)
    NSApplication.sharedApplication.sendActionToFrom(picker.action, picker.target, picker)
    if (selection !== updated) {
      throw new Error('The Core-backed date picker did not dispatch its native action')
    }
  } finally {
    control.detach()
    if (picker.superview || picker.target) {
      throw new Error('The native date picker stayed attached to the Core host')
    }
  }
}

function OverlayContent() {
  return <label text="Core overlay" style={{ width: 160, height: 22 }} />
}

let pointerPresses = 0
let virtualPresses = 0

function PointerTarget() {
  const bind = useInteractionHost({
    press: {
      slop: 8,
      onPress(event) {
        if (event.source === 'pointer') {
          pointerPresses++
        } else if (event.source === 'virtual') {
          virtualPresses++
        }
      },
    },
  })
  return <masonview id="pointer-target" ref={bind} style={{ width: 180, height: 120 }} />
}

async function checkPointerInput() {
  const primaryDebug = Reflect.get(globalThis, '__xplatMacOSDebug')
  const handle = openWindow({
    title: 'Core pointer input',
    size: { width: 320, height: 220 },
    component: PointerTarget,
  })
  try {
    const nativeRoot = handle.window.contentView.subviews.objectAtIndex(0)
    const target = nativeRoot.subviews.objectAtIndex(0)
    if (target.window !== handle.window || target.bounds.size.width < 100) {
      throw new Error('The Core pointer target did not lay out before dispatch')
    }
    handle.window.makeKeyAndOrderFront(null)
    NSApplication.sharedApplication.activateIgnoringOtherApps(true)
    await new Promise((resolve) => setTimeout(resolve, 80))
    const center = target.convertPointToView(
      { x: target.bounds.size.width / 2, y: target.bounds.size.height / 2 },
      null,
    )
    let events = 0
    const monitor = NSEvent.addLocalMonitorForEventsMatchingMaskHandler(
      (1 << 1) | (1 << 2),
      (event) => {
        if (event.window === handle.window) {
          events++
        }
        return event
      },
    )
    try {
      for (const type of [1, 2]) {
        const event =
          NSEvent.mouseEventWithTypeLocationModifierFlagsTimestampWindowNumberContextEventNumberClickCountPressure(
            type,
            center,
            0,
            NSProcessInfo.processInfo.systemUptime,
            handle.window.windowNumber,
            null,
            type,
            1,
            1,
          )
        postToPid(event.CGEvent)
        await new Promise((resolve) => setTimeout(resolve, 40))
      }
    } finally {
      NSEvent.removeMonitor(monitor)
    }
    if (events !== 2 || pointerPresses !== 1) {
      throw new Error(`The AppKit event queue did not dispatch one Core press: ${pointerPresses} from ${events} window events`)
    }
    const debug = Reflect.get(globalThis, '__xplatMacOSDebug')
    if (debug === primaryDebug || debug.findId('pointer-target') !== target) {
      throw new Error('Core automation did not find the secondary window target')
    }
    debug.pressId('pointer-target')
    if (virtualPresses !== 1) {
      throw new Error('Core automation did not dispatch one virtual press')
    }
  } finally {
    handle.close()
    await handle.closed
  }
  if (Reflect.get(globalThis, '__xplatMacOSDebug') !== primaryDebug) {
    throw new Error('Secondary window teardown did not restore the primary automation root')
  }
}

function checkDesktopSurfaces() {
  const target = host.getViewById('date-control-host')
  const nativeHost = target.nativeViewProtected
  const bridge = Reflect.get(globalThis, '__xplatAppKit')
  const previousMenu = nativeHost.menu
  let selection
  const detach = bridge.attachContextMenu(target, {
    items: [{ id: 'core-item', title: 'Core menu item' }],
  }, (next) => {
    selection = next
  })
  if (!detach) {
    throw new Error('AppKit could not create a context menu for the Core view')
  }
  try {
    const item = nativeHost.menu.itemAtIndex(0)
    NSApplication.sharedApplication.sendActionToFrom(item.action, item.target, item)
    if (selection !== 'core-item') {
      throw new Error('The Core context menu did not dispatch its AppKit action')
    }
  } finally {
    detach()
  }
  if (nativeHost.menu !== previousMenu) {
    throw new Error('Removing the Core context menu did not restore the previous AppKit menu')
  }

  const popup = bridge.showAnchoredPopup({
    anchor: target, component: OverlayContent, placement: 'right', animates: false,
  })
  if (!popup) {
    throw new Error('AppKit could not show a popover from the Core view')
  }
  try {
    if (popup.popover.contentSize.width < 100) {
      throw new Error('The AppKit popover did not size itself to the Core content')
    }
  } finally {
    popup.close()
  }

  const layer = bridge.showLayer({
    anchor: target,
    component: OverlayContent,
    position: (anchor) => ({ left: anchor.left, top: anchor.top + anchor.height }),
    lightDismiss: false,
  })
  if (!layer) {
    throw new Error('AppKit could not open an anchored Core overlay')
  }
  try {
    if (layer.contentView.frame.size.width < 100 || layer.closed) {
      throw new Error('The anchored AppKit overlay did not lay out the Core content')
    }
  } finally {
    layer.close()
  }

  const surface = bridge.presentSurface({ owner: target, kind: 'dialog', component: OverlayContent })
  try {
    if (!surface.panel.superview || surface.closed) {
      throw new Error('The AppKit dialog did not mount inside the Core window')
    }
  } finally {
    surface.close()
  }

  const sheet = bridge.presentSheet(target, {})
  if (!sheet) {
    throw new Error('AppKit could not prepare a sheet from the Core view')
  }
  const sheetRoot = createMacOSRoot(sheet.target)
  try {
    sheetRoot.render(OverlayContent, {})
    if (!sheet.present() || !sheet.presented || !Application.macos.window.attachedSheet) {
      throw new Error('AppKit did not present the Core sheet on the parent window')
    }
  } finally {
    sheetRoot.unmount()
    sheet.close()
  }
}

function checkCorePaint() {
  const coreView = host.getViewById('paint')
  const view = coreView.nativeViewProtected
  registerStylesheet('paint', '#paint { background-color: #ff0000; border-width: 2px; border-color: #0000ff; border-radius: 8px; }')
  const color = NSColor.colorWithCGColor(view.layer.backgroundColor)
  if (color.redComponent < 0.9 || view.layer.cornerRadius !== 8 || view.layer.borderWidth !== 2) {
    throw new Error(`Core styles did not paint the AppKit layer: ${view.layer.cornerRadius}, ${view.layer.borderWidth}`)
  }
  setLayoutProjectionScale(view, { x: 2, y: 2 })
  if (view.layer.cornerRadius !== 4) {
    throw new Error('AppKit did not compensate the Core view radius during projection')
  }
  setLayoutProjectionScale(view, null)
  if (view.layer.cornerRadius !== 8) {
    throw new Error('AppKit did not restore the Core view radius after projection')
  }
  registerStylesheet('paint',
    '#paint { background-image: linear-gradient(90deg, #ff0000 25%, #0000ff 75%); }',
  )
  const backgroundLayer = view.layer.sublayers?.objectAtIndex(0)
  const gradient = backgroundLayer?.sublayers?.objectAtIndex(0)
  if (!(gradient instanceof CAGradientLayer) || gradient.colors.count !== 2) {
    throw new Error('The Core gradient did not reach the shared AppKit background painter')
  }
  coreView.translateX = 12
  coreView.translateY = 7
  coreView.opacity = 0.5
  if (view.layer.transform.m41 !== 12 || view.layer.transform.m42 !== -7 || view.alphaValue !== 0.5) {
    throw new Error('Core transform and opacity did not reach the AppKit layer')
  }
  coreView.translateX = 0
  coreView.translateY = 0
  coreView.opacity = 1
  if (view.layer.transform.m41 || view.layer.transform.m42 || view.alphaValue !== 1) {
    throw new Error('Resetting Core transform and opacity did not clear the AppKit layer')
  }
  registerStylesheet('paint', '')
  if (view.layer.backgroundColor || view.layer.cornerRadius || view.layer.borderWidth || backgroundLayer.superlayer) {
    throw new Error('Removing CSS left old Core paint on the AppKit view')
  }
}

async function checkLayoutNotifications() {
  const target = host.getViewById('title')
  const contentView = Application.macos.window.contentView
  const widths: number[] = []
  const unobserve = observeLayoutCommits(({ hostView }) => {
    if (hostView === contentView) {
      widths.push(target.nativeViewProtected.frame.size.width)
    }
  })
  try {
    if (widths.length !== 1) {
      throw new Error('Layout observation did not visit the existing Core root')
    }
    target.style.width = 160
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (widths.length < 2 || widths[0] === widths.at(-1)) {
      throw new Error('Core did not report the completed layout after a width change')
    }
  } finally {
    unobserve()
  }
}

async function checkWindowLifecycle() {
  const main = Application.macos.window
  const title = host.getViewById('title').nativeViewProtected
  const replaceStylesheets = Reflect.get(globalThis, '__xplatReplaceCoreStylesheets')
  const setStyles = (wide: number, narrow: number) =>
    replaceStylesheets([[
      'viewport.css',
      `.provider-title, .provider-viewport { font-size: ${wide}px; }
       @media (max-width: 600px) {
         .provider-title, .provider-viewport { font-size: ${narrow}px; }
       }`,
    ]])
  setStyles(22, 17)
  const handle = openWindow({
    title: 'Core window',
    size: { width: 480, height: 300 },
    component: SecondaryWindow,
  })
  const content = handle.window.contentView.subviews.objectAtIndex(0)
  try {
    const label = content.subviews.objectAtIndex(0)
    if (label.stringValue !== 'Secondary Core window' || label.frame.size.width < 100) {
      throw new Error('The secondary window did not lay out its NativeScript root')
    }
    if (title.font.pointSize !== 22 || label.font.pointSize !== 17) {
      throw new Error(`Core did not use each window's width for CSS: main ${title.font.pointSize}, secondary ${label.font.pointSize}`)
    }
    handle.setSize({ width: 660, height: 300 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (Math.abs(content.frame.size.width - 660) > 1 || label.font.pointSize !== 22) {
      throw new Error('The NativeScript window content did not follow the AppKit resize')
    }
    main.setContentSize(NSMakeSize(500, 300))
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (title.font.pointSize !== 17 || label.font.pointSize !== 22) {
      throw new Error('Main window resize applied CSS at the wrong window width')
    }
    setStyles(26, 19)
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (title.font.pointSize !== 19 || label.font.pointSize !== 26) {
      throw new Error('Replacing CSS left an open Core window using stale rules')
    }
  } finally {
    main.setContentSize(NSMakeSize(1024, 700))
    handle.close()
    await handle.closed
  }
  if (content.superview || !handle.isClosed) {
    throw new Error('Closing the secondary window did not retire its NativeScript root')
  }
}

function checkShortcuts() {
  const editor = host.getViewById('editor')
  if (!(editor instanceof TextField)) {
    throw new Error('The keyboard fixture did not mount a text field')
  }
  const view = editor.nativeViewProtected
  if (!view.window.makeFirstResponder(view)) {
    throw new Error('The keyboard fixture could not focus the text field')
  }
  let matches = 0
  const shortcuts = createShortcuts({ target: editor })
  try {
    shortcuts.bind({
      combo: 'Mod+KeyK',
      editablePolicy: 'allow-in-editable',
      preventDefault: true,
      handler: () => matches++,
    })
    const event = NSEvent.keyEventWithTypeLocationModifierFlagsTimestampWindowNumberContextCharactersCharactersIgnoringModifiersIsARepeatKeyCode(
      10, NSMakePoint(0, 0), 1 << 20, 0, view.window.windowNumber, null, 'k', 'k', false, 40,
    )
    const bridge = Reflect.get(globalThis, '__xplatAppKit')
    if (!bridge.dispatchKeyboardEvent(event).defaultPrevented || matches !== 1) {
      throw new Error('The AppKit keyboard dispatcher did not deliver the shortcut')
    }
  } finally {
    shortcuts.dispose()
  }
}

async function checkDesktopServices() {
  const app = NSApplication.sharedApplication
  const previous = app.mainMenu
  let selections = 0
  const menu = appMenu.install([{
    type: 'submenu',
    key: 'fixture',
    label: 'Provider',
    items: [{ type: 'action', key: 'select', label: 'Select', onSelect: () => selections++ }],
  }])
  try {
    const submenu = app.mainMenu.itemAtIndex(1).submenu
    submenu.performActionForItemAtIndex(0)
    if (selections !== 1) {
      throw new Error('The AppKit menu action did not reach its handler')
    }
  } finally {
    menu.dispose()
  }
  if (app.mainMenu !== previous) {
    throw new Error('Disposing the application menu did not restore the previous menu')
  }

  const availability = await getTrayAvailability()
  if (!availability.available) {
    throw new Error('The AppKit status bar is unavailable')
  }
  const tray = await createTray({
    id: 'octane-core-provider',
    icon: { type: 'named', name: 'circle' },
    title: 'Provider',
  })
  try {
    if (tray.isDestroyed) {
      throw new Error('The AppKit tray item did not remain live')
    }
  } finally {
    tray.destroy()
  }
}

function checkLiquidGlass() {
  const glass = host.getViewById('glass')
  const child = host.getViewById('glass-content')
  if (!(glass instanceof LiquidGlass) || !(child instanceof Label)) {
    throw new Error('The NativeScript render did not mount Liquid Glass with its child')
  }
  const native = glass.nativeViewProtected
  const backdrop = native.subviews.objectAtIndex(0)
  if (
    !(backdrop instanceof NSVisualEffectView) ||
    native.subviews.objectAtIndex(1) !== child.nativeViewProtected ||
    child.nativeViewProtected.frame.size.height <= 0
  ) {
    throw new Error('AppKit did not lay out the Liquid Glass child above its backdrop')
  }
  return backdrop
}

function checkActionBar() {
  const bar = host.getViewById('bar')
  const childBar = host.getViewById('child-bar')
  const child = host.getViewById('bar-child')
  if (!(bar instanceof ActionBar) || !(childBar instanceof ActionBar) || !(child instanceof Label)) {
    throw new Error('Core did not mount both ActionBar title forms')
  }

  const native = bar.nativeViewProtected
  const label = native.subviews.objectAtIndex(0)
  if (
    label.stringValue !== 'Initial' ||
    native.frame.size.height !== 44 ||
    native.layer.shadowOpacity <= 0
  ) {
    throw new Error(`ActionBar default title: ${label.stringValue}, height ${native.frame.size.height}, shadow ${native.layer.shadowOpacity}`)
  }
  bar.title = 'Updated'
  bar.flat = true
  if (label.stringValue !== 'Updated' || native.layer.shadowOpacity !== 0) {
    throw new Error('ActionBar did not update its title and shadow in place')
  }

  const nativeChild = child.nativeViewProtected
  const childAlignment = nativeChild.alignmentRectForFrame(nativeChild.frame)
  if (
    nativeChild.superview !== childBar.nativeViewProtected ||
    Math.abs(childAlignment.origin.x - 50) > 1 ||
    Math.abs(childAlignment.origin.y - 12) > 1
  ) {
    throw new Error(
      `ActionBar JSX title location: ${childAlignment.origin.x},${childAlignment.origin.y}; ` +
        `bar height ${childBar.nativeViewProtected.bounds.size.height}, title height ${childAlignment.size.height}`,
    )
  }

  const external = NSTextField.labelWithString('External')
  bar.titleView = external
  if (external.superview !== native || label.superview || native.subviews.count !== 1) {
    throw new Error('ActionBar did not replace its plain title with an AppKit view')
  }
  bar.titleView = null
  if (external.superview || label.superview !== native || native.subviews.count !== 1) {
    throw new Error('ActionBar did not retire the AppKit title and restore the label')
  }
  const box = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 80, 24))
  bar.titleView = box
  if (
    box.superview !== native ||
    native.intrinsicContentSize.width !== 80 ||
    native.intrinsicContentSize.height !== 44
  ) {
    throw new Error('ActionBar did not measure an AppKit title with an explicit frame')
  }
  let rejected = false
  try {
    bar.titleView = child.nativeViewProtected
  } catch {
    rejected = true
  }
  if (
    !rejected ||
    box.superview !== native ||
    child.nativeViewProtected.superview !== childBar.nativeViewProtected
  ) {
    throw new Error('ActionBar allowed a title replacement to steal another host’s view')
  }
  return native
}

interface MasonScrollMetrics {
  readonly clientHeight: number
  readonly scrollHeight: number
  readonly scrollTop: number
  scrollTo(options: { top: number; behavior?: 'instant' | 'smooth' }): void
  on(event: 'scroll', callback: (data: { scrollX: number; scrollY: number }) => void): void
}

async function checkMasonScroll() {
  const scroll: MasonScrollMetrics = host.getViewById('viewport')
  if (scroll.clientHeight === 0 || scroll.scrollHeight <= scroll.clientHeight) {
    throw new Error(`Mason viewport has no scroll range: ${scroll.scrollHeight} / ${scroll.clientHeight}`)
  }
  let reported = Number.NaN
  scroll.on('scroll', (data) => {
    reported = data.scrollY
  })
  scroll.scrollTo({ top: 90, behavior: 'instant' })
  await new Promise((resolve) => setTimeout(resolve, 30))
  if (Math.abs(scroll.scrollTop - 90) > 1) {
    throw new Error(`Mason scrollTo did not move the AppKit viewport: ${scroll.scrollTop}`)
  }
  if (!Number.isFinite(reported) || Math.abs(reported - 90) > 1) {
    throw new Error(`Mason scroll did not report the AppKit viewport offset: ${reported}`)
  }
  scroll.scrollTo({ top: Number.MAX_SAFE_INTEGER })
  if (Math.abs(scroll.scrollTop - (scroll.scrollHeight - scroll.clientHeight)) > 1) {
    throw new Error('Mason scrollTo did not clamp to the scroll range')
  }
}

async function checkDevelopmentReload() {
  const shellImport = { stored: true }
  __installDevelopmentModules({
    'provider-fixture-shell': shellImport,
    '@octane-xplat/macos-appkit': { __rendererId },
  })
  if (Reflect.get(globalThis, '__xplatDevModules')['provider-fixture-shell'] !== shellImport) {
    throw new Error('Core did not retain the shared shell modules')
  }
  const load = Reflect.get(globalThis, '__hostRunFile')
  const before = load(process.env.OCTANE_MACOS_DEV_BUNDLE)
  const component = hmrUniversalComponent(__rendererId, before.default)
  const devRoot = createNativeScriptRoot(host)
  const label = () => host.getViewById('provider-dev-count')
  const settle = () => new Promise((resolve) => setTimeout(resolve, 30))

  try {
    devRoot.render(component, {})
    const first = label()
    if (
      before.Label !== Label ||
      before.__rendererId !== __rendererId ||
      !(first instanceof Label) ||
      first.nativeViewProtected.stringValue !== 'before:0'
    ) {
      throw new Error('The development bundle did not use the shell’s Core instance')
    }
    before.increment()
    await settle()
    if (first.nativeViewProtected.stringValue !== 'before:1') {
      throw new Error('The development bundle did not update the native counter')
    }

    const after = load(process.env.XPLAT_CORE_DEV_AFTER)
    component[UNIVERSAL_HMR].update(after.default)
    await settle()
    if (
      after.Label !== Label ||
      label() !== first ||
      first.nativeViewProtected.stringValue !== 'after:1'
    ) {
      throw new Error('The development rebuild lost Core identity, the native view, or signal state')
    }
  } finally {
    devRoot.unmount()
  }
}

function checkMainWindowRootReplacement() {
  const window = Application.macos.window
  const content = window.contentView
  const previous = host.nativeViewProtected
  if (previous.superview !== content) {
    throw new Error('Core did not mount inside the AppKit main window content view')
  }

  const replacement = new GridLayout()
  Application.resetRootView({ create: () => replacement })
  if (
    previous.superview ||
    window.contentView !== content ||
    replacement.nativeViewProtected.superview !== content ||
    replacement.nativeViewProtected.frame.size.width !== content.bounds.size.width
  ) {
    throw new Error('Replacing the Core root changed the AppKit window or left the old root attached')
  }
}

setTimeout(async () => {
  try {
    if (host.getViewById('flex-shorthand').style.flexGrow !== 1) {
      throw new Error('Core did not apply the numeric flex shorthand')
    }
    const title = host.getViewById('title')
    if (!(title instanceof Label)) {
      throw new Error('The NativeScript render did not mount the label')
    }
    const native = title.nativeViewProtected
    if (native.stringValue !== 'NativeScript Core on AppKit' || native.frame.size.width < 100) {
      throw new Error('The AppKit label did not receive text and a measured width')
    }
    if (native.font.pointSize !== 23) {
      throw new Error(`The bundled stylesheet did not reach the NativeScript title (class ${title.className}, Core font size ${title.style.fontSize}, native ${native.font.pointSize})`)
    }
    const replaceStylesheets = Reflect.get(globalThis, '__xplatReplaceCoreStylesheets')
    replaceStylesheets([
      ['replacement.css', '.provider-title { font-size: 19; }'],
    ])
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (native.font.pointSize !== 19) {
      throw new Error(`Replacing bundled styles left an obsolete rule on the NativeScript title (Core ${title.style.fontSize}, native ${native.font.pointSize})`)
    }
    registerStylesheet('app-rule', '#editor { font-size: 24; }')
    const editor = host.getViewById('editor').nativeViewProtected
    const debug = Reflect.get(root, '__macosDebug')
    if (debug.findId('editor') !== editor || !debug.snapshot().labels.includes('NativeScript Core on AppKit')) {
      throw new Error('Core automation did not expose the primary AppKit view tree')
    }
    if (editor.placeholderString !== 'Provider editor') {
      throw new Error('Core did not deliver the text field hint to AppKit')
    }
    debug.setText('Provider editor', 'Typed by automation')
    if (editor.stringValue !== 'Typed by automation' || host.getViewById('editor').text !== 'Typed by automation') {
      throw new Error('Core automation did not update the native editor and its Core model')
    }
    const field = host.getViewById('editor')
    if (!field.focus() || !editor.currentEditor()) {
      throw new Error('The Core field did not begin native editing')
    }
    editor.currentEditor().selectedRange = { location: 2, length: 3 }
    field.secure = true
    if (
      field.nativeViewProtected !== editor ||
      !(editor.cell instanceof NSSecureTextFieldCell) ||
      editor.placeholderString !== 'Provider editor' ||
      editor.stringValue !== 'Typed by automation' ||
      editor.currentEditor()?.selectedRange.location !== 2 ||
      editor.currentEditor()?.selectedRange.length !== 3
    ) {
      throw new Error('Secure entry changed the Core field, value, hint, focus, or selection')
    }
    field.secure = false
    if (editor.cell instanceof NSSecureTextFieldCell || !editor.currentEditor()) {
      throw new Error('Disabling secure entry did not restore an ordinary editing cell')
    }
    if (!editor.target.respondsToSelector(editor.action)) {
      throw new Error('The native Core field submit selector was not installed')
    }
    NSApplication.sharedApplication.sendActionToFrom(editor.action, editor.target, editor)
    field.dismissSoftInput()
    if (editorEvents.join(',') !== 'focus,submit,blur') {
      throw new Error('Unexpected native field lifecycle: ' + editorEvents.join(','))
    }
    field.editable = false
    field.isEnabled = false
    if (editor.enabled || editor.editable || field.focus()) {
      throw new Error('The Core field stayed editable or focusable after being disabled')
    }
    field.isEnabled = true
    field.editable = true
    debug.setText('Notes', 'Automated notes')
    const notes = host.getViewById('notes')
    if (notes.nativeViewProtected.documentView.string !== 'Automated notes' || notes.text !== 'Automated notes') {
      throw new Error('Core automation did not update the multiline editor by placeholder')
    }
    const notesEditor = notes.nativeViewProtected.documentView
    if (!notes.focus() || notesEditor.window.firstResponder !== notesEditor) {
      throw new Error('The Core multiline field did not focus its AppKit editor')
    }
    notes.returnKeyType = 'done'
    if (!notesEditor.delegate.textViewDoCommandBySelector(notesEditor, 'insertNewline:')) {
      throw new Error('Done did not consume the native multiline Return command')
    }
    notes.returnKeyType = 'next'
    if (notesEditor.delegate.textViewDoCommandBySelector(notesEditor, 'insertNewline:')) {
      throw new Error('The ordinary multiline Return command was consumed')
    }
    notes.dismissSoftInput()
    if (notesEvents.join(',') !== 'focus,submit,blur') {
      throw new Error('Unexpected multiline field lifecycle: ' + notesEvents.join(','))
    }
    notes.text = 'first\nsecond\nthird\nfourth\nfifth\nsixth'
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (notesEditor.frame.size.height <= notes.nativeViewProtected.contentView.bounds.size.height) {
      throw new Error('The Core multiline document did not extend beyond its capped viewport')
    }
    debug.pressButton('Core automation')
    if (automationButtonPresses !== 1) {
      throw new Error('Core automation did not dispatch the native button action')
    }
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (editor.font.pointSize !== 24) {
      throw new Error('The registered stylesheet did not reach the mounted editor')
    }
    registerStylesheet('app-rule', '#editor { color: red; }')
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (editor.font.pointSize === 24) {
      throw new Error('Replacing a registered stylesheet left the previous rules active')
    }
    registerStylesheet('app-rule', '#editor { font-size: 25; }')
    replaceStylesheets([])
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (editor.font.pointSize !== 25) {
      throw new Error('The registered stylesheet was lost when the bundle reloaded')
    }
    registerStylesheet('later-app-rule', '#editor { font-size: 27; }')
    registerStylesheet('app-rule', '#editor { font-size: 29; }')
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (editor.font.pointSize !== 27) {
      throw new Error('Replacing a registered stylesheet changed its cascade order')
    }
    if (native.font.pointSize === 19 || native.font.pointSize === 23) {
      throw new Error('Removing bundled styles left their rules on the NativeScript title')
    }
    if (
      native.accessibilityLabel !== 'Provider status' ||
      native.accessibilityHelp !== 'Core provider fixture'
    ) {
      throw new Error('The NativeScript accessibility properties did not reach AppKit')
    }
    await checkDesktopServices()
    checkShortcuts()
    checkDesktopDatePicker()
    checkDesktopSurfaces()
    await checkPointerInput()
    checkCorePaint()
    await checkLayoutNotifications()
    await checkEmbeddedCoreRoot()
    await checkSharedTextAreaSizing()
    await checkBuilderControls()
    await checkHtmlText()
    await checkForeignView()
    await checkKeyedLayout()
    await checkNestedContent()
    await checkInsetReset()
    await checkProjectedLeaves()
    await checkProjectedGrid()
    await checkWindowLifecycle()
    registerStylesheet('logical-align', '#title { direction: rtl; text-align: start; }')
    if (native.alignment !== 1) {
      throw new Error('RTL start alignment did not resolve to the right edge')
    }
    registerStylesheet('logical-align', '#title { direction: ltr; text-align: start; }')
    if (native.alignment !== 0) {
      throw new Error('Changing text direction did not update start alignment')
    }
    registerStylesheet('logical-align', '#title { direction: ltr; text-align: end; }')
    if (native.alignment !== 1) {
      throw new Error('LTR end alignment did not resolve to the right edge')
    }
    await checkMasonScroll()
    const backdrop = checkLiquidGlass()
    const bar = checkActionBar()
    root.unmount()
    if (Reflect.has(root, '__macosDebug') || Reflect.has(globalThis, '__xplatMacOSDebug')) {
      throw new Error('Core automation remained installed after the primary root unmounted')
    }
    if (native.superview || backdrop.superview || bar.subviews.count || host.getViewById('title')) {
      throw new Error('Unmount left a native view attached')
    }
    await checkDevelopmentReload()
    checkMainWindowRootReplacement()
    console.log('CORE_PROVIDER_OK')
  } catch (error) {
    console.error('CORE_PROVIDER_FAIL', String(error), error)
  } finally {
    stop()
  }
}, 100)
