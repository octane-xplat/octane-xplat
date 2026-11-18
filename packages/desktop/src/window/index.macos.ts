import { lookupGlobal } from '@octane-xplat/lib/capability'
import { NSApp } from '@octane-xplat/platform/macos'
import { createDesktopWindowService, type NativeWindowOpener } from './service.js'
import type { DesktopWindowService } from './types.js'

export type * from './types.js'

interface AppKitWindow {
  performClose(sender: null): void
  makeKeyAndOrderFront(sender: null): void
  orderOut(sender: null): void
  isVisible(): boolean
}

/** Open and manage native secondary windows with the AppKit host. */
export const windows: DesktopWindowService = createDesktopWindowService(
  () => {
    const open = lookupGlobal(['__xplatAppKitOpenWindow'])

    // This bridge is installed by the AppKit host and returns its window controller.
    return typeof open === 'function' ? (open as NativeWindowOpener<AppKitWindow>) : undefined
  },
  {
    requestClose: (window) => window.performClose(null),
    present(window) {
      NSApp.activateIgnoringOtherApps(true)
      window.makeKeyAndOrderFront(null)
    },
    hide: (window) => window.orderOut(null),
    isVisible: (window) => window.isVisible(),
  },
)
