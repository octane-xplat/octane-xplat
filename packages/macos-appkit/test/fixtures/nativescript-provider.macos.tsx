/** @jsxImportSource @octane-xplat/jsx */
import '@nativescript/macos-node-api'
import { ActionBar, Application, GridLayout, Label, LiquidGlass, TextField } from '@nativescript/core'
import { createNativeScriptRoot, renderNativeScriptApp } from '@octane-xplat/nativescript-octane'
import { hmrUniversalComponent, UNIVERSAL_HMR } from 'octane/universal/native'
import { appMenu } from '../../../app-menu/src/index.macos.ts'
import { createTray, getTrayAvailability } from '../../../tray/src/index.macos.ts'
import { createShortcuts } from '../../../shortcuts/src/index.macos.ts'
import { openWindow } from '../../src/host-windowing'
import {
  createNativeScriptWindowRoot,
  installNativeScriptWindowRoots,
} from '../../src/nativescript-window.macos'
import { installNativeScriptDevModules } from '../../src/nativescript-dev.macos'
import { registerNativeScriptStylesheet } from '../../src/nativescript-css.macos'
import './nativescript-provider.css'

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
      <textfield id="editor" />
      <liquidglass id="glass" style={{ width: 160, height: 48 }}>
        <label id="glass-content" text="Glass content" />
      </liquidglass>
      <actionbar id="bar" title="Initial" style={{ width: 220 }} />
      <actionbar id="child-bar" style={{ width: 220 }}>
        <label id="bar-child" text="Custom title" style={{ width: 120, height: 20 }} />
      </actionbar>
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

const host = new GridLayout()
const root = renderNativeScriptApp(host, Screen)
installNativeScriptWindowRoots()
Application.run({ create: () => host })

function SecondaryWindow() {
  return <label className="provider-viewport" text="Secondary Core window" />
}

function checkEmbeddedCoreRoot() {
  const window = Application.macos.window
  const content = NSView.alloc().initWithFrame(NSMakeRect(10, 10, 290, 180))
  window.contentView.addSubview(content)
  const root = createNativeScriptWindowRoot(content, { fontFamily: 'Menlo' })
  try {
    root.render(SecondaryWindow, {})
    const host = content.subviews.objectAtIndex(0)
    const label = host.subviews.objectAtIndex(0)
    if (host.frame.size.width !== 290 || label.font.familyName !== 'Menlo') {
      throw new Error(`The embedded Core root lost its size or font: ${host.frame.size.width}, ${label.font.familyName}`)
    }
  } finally {
    root.unmount()
    root.unmount()
    if (content.subviews.count !== 0) {
      throw new Error('The embedded Core root remained attached after unmount')
    }
    content.removeFromSuperview()
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

  if (
    child.nativeViewProtected.superview !== childBar.nativeViewProtected ||
    Math.abs(child.nativeViewProtected.frame.origin.x - 50) > 1
  ) {
    throw new Error(`ActionBar JSX title location: ${JSON.stringify(child.nativeViewProtected.frame)}`)
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
  if (box.superview !== native || bar.getMasonIntrinsicSize().width !== 80) {
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
  installNativeScriptDevModules()
  const load = Reflect.get(globalThis, '__hostRunFile')
  const before = load(process.env.OCTANE_MACOS_DEV_BUNDLE)
  const component = hmrUniversalComponent('nativescript', before.default)
  const devRoot = createNativeScriptRoot(host)
  const label = () => host.getViewById('provider-dev-count')
  const settle = () => new Promise((resolve) => setTimeout(resolve, 30))

  try {
    devRoot.render(component, {})
    const first = label()
    if (
      before.Label !== Label ||
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
    registerNativeScriptStylesheet('app-rule', '#editor { font-size: 24; }')
    const editor = host.getViewById('editor').nativeViewProtected
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (editor.font.pointSize !== 24) {
      throw new Error('The registered stylesheet did not reach the mounted editor')
    }
    registerNativeScriptStylesheet('app-rule', '#editor { color: red; }')
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (editor.font.pointSize === 24) {
      throw new Error('Replacing a registered stylesheet left the previous rules active')
    }
    registerNativeScriptStylesheet('app-rule', '#editor { font-size: 25; }')
    replaceStylesheets([])
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (editor.font.pointSize !== 25) {
      throw new Error('The registered stylesheet was lost when the bundle reloaded')
    }
    registerNativeScriptStylesheet('later-app-rule', '#editor { font-size: 27; }')
    registerNativeScriptStylesheet('app-rule', '#editor { font-size: 29; }')
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
    checkEmbeddedCoreRoot()
    await checkWindowLifecycle()
    registerNativeScriptStylesheet('logical-align', '#title { direction: rtl; text-align: start; }')
    if (native.alignment !== 1) {
      throw new Error('RTL start alignment did not resolve to the right edge')
    }
    registerNativeScriptStylesheet('logical-align', '#title { direction: ltr; text-align: start; }')
    if (native.alignment !== 0) {
      throw new Error('Changing text direction did not update start alignment')
    }
    registerNativeScriptStylesheet('logical-align', '#title { direction: ltr; text-align: end; }')
    if (native.alignment !== 1) {
      throw new Error('LTR end alignment did not resolve to the right edge')
    }
    await checkMasonScroll()
    const backdrop = checkLiquidGlass()
    const bar = checkActionBar()
    root.unmount()
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
