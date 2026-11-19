import { lookupGlobal } from '@octane-xplat/lib/capability'
import { NSApp, type NSWindow } from '@octane-xplat/platform/macos'
import { fromAppKitFrame, readAppKitPrimaryFrame, toAppKitFrame } from '../screen/geometry.macos.js'
import { createDesktopWindowService, type NativeWindowOpener } from './service.js'
import type { DesktopWindow, DesktopWindowService } from './types.js'

export type * from './types.js'

function requirePrimaryFrame(): NSWindow['frame'] {
  const frame = readAppKitPrimaryFrame()
  if (!frame) throw new Error('Window bounds require a connected primary display')
  return frame
}

const binding = createDesktopWindowService(
  () => {
    const open = lookupGlobal(['__xplatAppKitOpenWindow'])

    // This bridge is installed by the AppKit host and returns its window controller.
    return typeof open === 'function' ? (open as NativeWindowOpener<NSWindow>) : undefined
  },
  {
    requestClose: (window) => window.performClose(null),
    present(window) {
      NSApp.activateIgnoringOtherApps(true)
      window.makeKeyAndOrderFront(null)
    },
    hide: (window) => window.orderOut(null),
    isVisible: (window) => window.isVisible(),
    minimize: (window) => window.miniaturize(null),
    restore: (window) => window.deminiaturize(null),
    bounds: {
      supported: () => true,
      get: (window) => fromAppKitFrame(window.frame, requirePrimaryFrame()),
      set: (window, bounds) => window.setFrameDisplay(toAppKitFrame(bounds, requirePrimaryFrame()), true),
    },
  },
)

/** Open and manage native secondary windows with the AppKit host. */
export const windows: DesktopWindowService = binding.windows
export const getWindowOwner: (parent: DesktopWindow) => NSWindow | undefined = binding.getWindowOwner
