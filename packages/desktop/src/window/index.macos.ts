import { lookupGlobal } from '@octane-xplat/lib/capability'
import { createDesktopWindowService, type NativeWindowOpener } from './service.js'
import type { DesktopWindowService } from './types.js'

export type * from './types.js'

interface AppKitWindow {
  performClose(sender: null): void
}

/** Open and manage native secondary windows with the AppKit host. */
export const windows: DesktopWindowService = createDesktopWindowService(
  () => {
    const open = lookupGlobal(['__xplatAppKitOpenWindow'])

    // This bridge is installed by the AppKit host and returns its window controller.
    return typeof open === 'function' ? (open as NativeWindowOpener<AppKitWindow>) : undefined
  },
  (window) => window.performClose(null),
)
