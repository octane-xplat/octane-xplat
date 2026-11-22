import { NSApplication, NSEvent, type NSView } from '@octane-xplat/platform/macos'
import { createActionStore } from './action-store'
import { createAppMenu } from './app-menu'
import { announceAppKit } from './host-announce'
import { createHostBridge } from './host-bridge'
import { appKitGestureSurface } from './gesture-input'
import { createAppKitKeyboardDispatcher } from './keyboard'

const keyboard = createAppKitKeyboardDispatcher(() => ({ NSEvent }))

export function retireNativeScriptHostView(view: NSView) {
  keyboard.retireView(view)
}

/** Install window-independent AppKit services for a NativeScript application. */
export function installNativeScriptHostServices() {
  const { appKitBridge } = createHostBridge()
  if (!appKitBridge.installApplicationMenu) {
    const actions = createActionStore()
    const menu = createAppMenu({
      actions: { allocate: actions.allocate, invokeAction: actions.dispatch },
    })
    appKitBridge.installApplicationMenu = menu.installApplicationMenu
  }

  appKitBridge.announce ??= (text) => announceAppKit(text, NSApplication.sharedApplication)
  appKitBridge.gestureSurface ??= appKitGestureSurface
  if (!appKitBridge.observeViewKeys) {
    Object.defineProperty(appKitBridge, 'keyboardEventsSupported', {
      configurable: true,
      enumerable: true,
      get: keyboard.available,
    })
    appKitBridge.observeViewKeys = keyboard.subscribe
    appKitBridge.dispatchKeyboardEvent = keyboard.dispatch
    appKitBridge.observeHardwareKeys = keyboard.observe
  }
}
