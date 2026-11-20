import { lookupGlobal } from '@octane-xplat/lib/capability'
import {
  NSApp,
  NSNotificationCenter,
  NSWindowDidMoveNotification,
  type NSWindow,
} from '@octane-xplat/platform/macos'
import { fromAppKitFrame, readAppKitPrimaryFrame, toAppKitFrame } from '../screen/geometry.macos.js'
import {
  createDesktopWindowService,
  type NativeWindowController,
  type NativeWindowOpener,
} from './service.js'
import type { DesktopWindow, DesktopWindowService } from './types.js'

export type * from './types.js'

function requirePrimaryFrame(): NSWindow['frame'] {
  const frame = readAppKitPrimaryFrame()
  if (!frame) throw new Error('Window bounds require a connected primary display')
  return frame
}

// AppKit notification objects may arrive as a different proxy for the same
// NSWindow — the host's sameNativeWindow comparison pattern.
function sameWindow(left: unknown, right: unknown): boolean {
  return (
    left === right ||
    Boolean(
      typeof left === 'object' &&
        left !== null &&
        'isEqual' in left &&
        typeof left.isEqual === 'function' &&
        left.isEqual(right),
    )
  )
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
    maximize: (window) => {
      // zoom toggles — AppKit has no separate maximize request.
      if (!window.isZoomed()) window.zoom(null)
    },
    unmaximize: (window) => {
      if (window.isZoomed()) window.zoom(null)
    },
    isMaximized: (window) => window.isZoomed(),
    isMinimized: (window) => window.isMiniaturized(),
    isFocused: (window) => window.isKeyWindow(),
    observe(window, onChange) {
      const releases: (() => void)[] = []
      const onResize = lookupGlobal(['__xplatAppKit', 'onWindowResize'])
      const onMove = lookupGlobal(['__xplatAppKit', 'onWindowMove'])

      if (typeof onResize === 'function') {
        releases.push(
          onResize((resized: unknown) => {
            if (sameWindow(resized, window)) {
              onChange({ moved: false, resized: true })
            }
          }),
        )
      }

      if (typeof onMove === 'function') {
        releases.push(
          onMove((moved: unknown) => {
            if (sameWindow(moved, window)) {
              onChange({ moved: true, resized: false })
            }
          }),
        )
      }

      return () => {
        for (const release of releases) {
          release()
        }
      }
    },
    bounds: {
      supported: () => true,
      get: (window) => fromAppKitFrame(window.frame, requirePrimaryFrame()),
      set: (window, bounds) => {
        const previous = window.frame
        const frame = toAppKitFrame(bounds, requirePrimaryFrame())
        window.setFrameDisplay(frame, true)

        // AppKit queues and coalesces NSWindowDidMoveNotification, and under
        // this runtime a programmatic setFrame may never deliver it. Repost
        // the same notification so delegate-observed moves stay complete.
        if (frame.origin.x !== previous.origin.x || frame.origin.y !== previous.origin.y) {
          NSNotificationCenter.defaultCenter.postNotificationNameObject(
            NSWindowDidMoveNotification,
            window,
          )
        }
      },
    },
  },
  () => {
    const primary = lookupGlobal(['__xplatAppKitPrimaryWindow'])

    // The AppKit host installs this bridge to its main-window controller.
    if (typeof primary !== 'function') {
      return undefined
    }

    return primary() as NativeWindowController<NSWindow> | undefined
  },
)

/** Open and manage native secondary windows with the AppKit host. */
export const windows: DesktopWindowService = binding.windows
export const getWindowOwner: (parent: DesktopWindow) => NSWindow | undefined = binding.getWindowOwner
