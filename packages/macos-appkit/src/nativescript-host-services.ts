import {
  interop,
  NSApplication,
  type NSControl,
  NSEvent,
  NSObject,
  NSView,
} from '@octane-xplat/platform/macos'
import { createActionStore } from './action-store'
import { createAppMenu } from './app-menu'
import { announceAppKit } from './host-announce'
import { createHostBridge } from './host-bridge'
import { appKitGestureSurface } from './gesture-input'
import { createAppKitKeyboardDispatcher } from './keyboard'
import { registerGestureClass } from './gestures'
import { createPickerBridge } from './picker-bridge'
import { buildPopUpControl } from './picker-control'

const keyboard = createAppKitKeyboardDispatcher(() => ({ NSEvent }))

export function retireNativeScriptHostView(view: NSView) {
  keyboard.retireView(view)
}

function appKitView(view: unknown): NSView | undefined {
  if (view instanceof NSView) {
    return view
  }
  if (view && typeof view === 'object' && 'nativeViewProtected' in view) {
    const native = view.nativeViewProtected
    return native instanceof NSView ? native : undefined
  }
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

    class PickerActionTarget extends NSObject {
      static ObjCExposedMethods = {
        'controlChanged:': { params: [NSObject], returns: interop.types.void },
      }
      static {
        registerGestureClass(this)
      }
      ['controlChanged:'](sender: NSControl) {
        actions.dispatch(sender.tag ?? actions.idForView(sender))
      }
    }
    const pickerActions = { buttonActionTarget: PickerActionTarget.new(), allocate: actions.allocate }
    const picker = createPickerBridge({
      actions: pickerActions,
      pickerElements: { makePopUpControl: () => buildPopUpControl(pickerActions) },
    })
    appKitBridge.attachPicker = (host, initial, onSelect) => {
      const view = appKitView(host)
      return view ? picker.attachPicker(view, initial, onSelect) : null
    }
    appKitBridge.attachDatePicker = (host, options, onChange) => {
      const view = appKitView(host)
      return view ? picker.attachDatePicker(view, options, onChange) : null
    }
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
