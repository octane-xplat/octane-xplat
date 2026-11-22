/** @jsxImportSource @octane-xplat/jsx */
import '@nativescript/macos-node-api'
import { Application, GridLayout, Label, TextField } from '@nativescript/core'
import { renderNativeScriptApp } from '@octane-xplat/nativescript-octane'
import { appMenu } from '../../../app-menu/src/index.macos.ts'
import { createTray, getTrayAvailability } from '../../../tray/src/index.macos.ts'
import { createShortcuts } from '../../../shortcuts/src/index.macos.ts'
import { openWindow } from '../../src/host-windowing'
import { installNativeScriptWindowRoots } from '../../src/nativescript-window.macos'

function Screen() {
  return (
    <masonview style={{ width: 320, height: 160, flexDirection: 'column' }}>
      <label
        id="title"
        text="NativeScript Core on AppKit"
        accessibilityLabel="Provider status"
        accessibilityHint="Core provider fixture"
        style={{ fontSize: 20 }}
      />
      <textfield id="editor" />
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
  return <label text="Secondary Core window" />
}

async function checkWindowLifecycle() {
  const handle = openWindow({ title: 'Core window', component: SecondaryWindow })
  const content = handle.window.contentView.subviews.objectAtIndex(0)
  try {
    const label = content.subviews.objectAtIndex(0)
    if (label.stringValue !== 'Secondary Core window' || label.frame.size.width < 100) {
      throw new Error('The secondary window did not lay out its NativeScript root')
    }
    handle.setSize({ width: 520, height: 300 })
    await new Promise((resolve) => setTimeout(resolve, 30))
    if (Math.abs(content.frame.size.width - 520) > 1) {
      throw new Error('The NativeScript window content did not follow the AppKit resize')
    }
  } finally {
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
    if (
      native.accessibilityLabel !== 'Provider status' ||
      native.accessibilityHelp !== 'Core provider fixture'
    ) {
      throw new Error('The NativeScript accessibility properties did not reach AppKit')
    }
    await checkDesktopServices()
    checkShortcuts()
    await checkWindowLifecycle()
    root.unmount()
    if (native.superview || host.getViewById('title')) {
      throw new Error('Unmount left a native view attached')
    }
    console.log('CORE_PROVIDER_OK')
  } catch (error) {
    console.error('CORE_PROVIDER_FAIL', error)
  } finally {
    stop()
  }
}, 100)
