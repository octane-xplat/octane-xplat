import type {
  NSApplication,
  NSApplicationDelegate,
  NSView,
  NSWindow,
  NSWindowDelegate,
} from '@octane-xplat/platform/macos'
import type { UniversalRoot } from 'octane/universal/native'
import {
  createAppKitWindow,
  externalRunLoopMode,
  onApplicationTerminating,
  type AppKitWindow,
  type MacOSWindowSize,
} from './host-windowing'
import type { MacOSRootOptions } from './runtime'

/** Options for `runMacOSApp`. */
export interface MacOSAppOptions {
  /** Main window title. @default 'Octane App' */
  title?: string
  /** Main window content size in points. @default { width: 640, height: 420 } */
  size?: MacOSWindowSize
  /** End the application when its last window closes. @default true */
  terminateAfterLastWindowClosed?: boolean
  /** Options for every root this host creates (main window and `openWindow`
   *  windows), e.g. `{ fontFamily: 'Acme Sans' }`. */
  rootOptions?: MacOSRootOptions
}

/** The mount target `runMacOSApp` hands to its `mount` callback. */
export interface MacOSAppMount {
  /** The shared `NSApplication`. */
  app: NSApplication
  /** The main window. */
  window: NSWindow
  /** The pinned content view `root` renders into. */
  contentView: NSView
  /** The universal root the host mounted in `contentView`. */
  root: UniversalRoot
}

/** Own the AppKit window and the mount callback's lifetime for either host root. */
export function runWindowedApp(
  options: MacOSAppOptions,
  mount: (target: MacOSAppMount) => void | (() => void),
  prepare: (createWindow: () => AppKitWindow) => { appKit: AppKitWindow; root: UniversalRoot },
): void {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('runMacOSApp options must be an object')
  }

  if (typeof mount !== 'function') {
    throw new TypeError('runMacOSApp mount must be a function')
  }

  const { appKit, root } = prepare(() =>
    createAppKitWindow({
      title: options.title,
      size: options.size,
      terminateAfterLastWindowClosed: options.terminateAfterLastWindowClosed ?? true,
      rootOptions: options.rootOptions,
    }),
  )

  const { app, window, contentView, applicationClosed, windowClosed } = appKit
  const cleanup = mount({ app, window, contentView, root })

  let rootUnmounted = false
  let tornDown = false

  const unmountMainRoot = () => {
    if (rootUnmounted) {
      return
    }

    rootUnmounted = true
    try {
      root.unmount()
    } catch (error) {
      console.error('[macos] main window root unmount failed', error)
    }
  }

  const teardown = () => {
    if (tornDown) {
      return
    }

    tornDown = true
    if (typeof cleanup === 'function') {
      try {
        cleanup()
      } catch (error) {
        console.error('[macos] mount cleanup failed', error)
      }
    }

    unmountMainRoot()
    window.delegate = null as unknown as NSWindowDelegate
    window.close()
    app.delegate = null as unknown as NSApplicationDelegate
    appKit.delegate = null
  }

  // The host installs `__xplatStopHost` on globalThis before running the
  // bundle; no ambient declaration covers it, so the contract is named here.
  const globals = globalThis as typeof globalThis & { __xplatStopHost?: () => void }
  const installedStop = globals.__xplatStopHost
  let stopped = false

  const requestHostStop = () => {
    if (stopped) {
      return
    }

    stopped = true
    installedStop?.()
  }

  // Wrap the host stop so a direct __xplatStopHost() call still runs the
  // mount cleanup and root unmount once, synchronously, before stopping.
  if (typeof installedStop === 'function') {
    globals.__xplatStopHost = () => {
      teardown()
      requestHostStop()
    }
  }

  // Runs synchronously inside applicationWillTerminate, so the mount cleanup
  // lands before the root unmount queued by windowClosed.
  onApplicationTerminating(teardown)
  void windowClosed.then(unmountMainRoot)
  void applicationClosed.then(() => {
    teardown()
    requestHostStop()
  })

  if (externalRunLoopMode()) {
    app.finishLaunching()
    app.activateIgnoringOtherApps(true)
  } else {
    app.run()
  }
}
