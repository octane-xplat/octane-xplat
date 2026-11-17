import { NSApp, NSProcessInfo, type NSArray, type NSWindow } from '@octane-xplat/platform/macos'
import { TrayError } from '../tray/errors.js'

import { createAppLifecycle } from './lifecycle.js'
import type { AppResidency, DesktopApp } from './types.js'

export type * from './types.js'

function appWindows(): NSWindow[] {
  const windows: NSWindow[] = []
  const all: NSArray | null = NSApp.windows ?? null

  if (!all) {
    return windows
  }

  for (let i = 0; i < all.count; i++) {
    const window = all.objectAtIndex(i) as NSWindow

    try {
      // Status-bar windows and panels cannot become main; only real app windows qualify.
      if (window && window.canBecomeMainWindow) {
        windows.push(window)
      }
    } catch {
      // Skip windows that no longer answer.
    }
  }

  return windows
}

let hiddenWindows: NSWindow[] = []

/** Reveal and focus the app's windows; `false` when no app window exists to show. */
export function showAppWindows(): boolean {
  const windows = hiddenWindows.length ? hiddenWindows : appWindows()

  hiddenWindows = []
  if (!windows.length) {
    return false
  }

  try {
    NSApp.activateIgnoringOtherApps(true)
  } catch {
    // Activation is best-effort headless.
  }

  for (const window of windows) {
    try {
      if (window.isMiniaturized()) {
        window.deminiaturize(null)
      }

      window.makeKeyAndOrderFront(null)
    } catch (error) {
      console.error('[desktop] showing an app window failed', error)
    }
  }

  return true
}

/** Hide the app's visible windows. */
export function hideAppWindows(): void {
  const visible = appWindows().filter((window) => {
    try {
      return window.isVisible() && !window.isMiniaturized()
    } catch {
      return false
    }
  })

  hiddenWindows = visible
  for (const window of visible) {
    try {
      window.orderOut(null)
    } catch (error) {
      console.error('[desktop] hiding an app window failed', error)
    }
  }
}

/** Whether any app window is currently visible. */
export function areAppWindowsVisible(): boolean {
  return appWindows().some((window) => {
    try {
      return window.isVisible() && !window.isMiniaturized()
    } catch {
      return false
    }
  })
}

/** Toggle window visibility; returns the visibility after toggling. */
export function toggleAppWindows(): boolean {
  if (areAppWindowsVisible() && Boolean(NSApp.isActive())) {
    hideAppWindows()
    return false
  }

  return showAppWindows()
}

/** Keep the app running without visible windows until the returned residency releases. */
export function keepAppResident(options?: { hideWindowsOnClose?: boolean }): AppResidency {
  const delegate = NSApp.delegate

  if (delegate) {
    try {
      if (
        typeof delegate.respondsToSelector === 'function' &&
        delegate.respondsToSelector('applicationShouldTerminateAfterLastWindowClosed:') &&
        delegate.applicationShouldTerminateAfterLastWindowClosed?.(NSApp)
      ) {
        throw new TrayError(
          'resident-conflict',
          'keepAppResident cannot hold the app open: the application delegate still returns true from applicationShouldTerminateAfterLastWindowClosed. Return false while the app stays resident in the tray.',
        )
      }
    } catch (error) {
      if (error instanceof TrayError) {
        throw error
      }
      // A delegate without the optional method leaves residency allowed.
    }
  }

  const reason = 'octane-xplat tray residency'
  const processInfo = NSProcessInfo.processInfo

  processInfo.disableAutomaticTermination(reason)

  const hideOnClose = options?.hideWindowsOnClose === true
  const restored: { window: NSWindow; releasedWhenClosed: boolean }[] = []

  if (hideOnClose) {
    for (const window of appWindows()) {
      try {
        restored.push({ window, releasedWhenClosed: window.releasedWhenClosed })
        window.releasedWhenClosed = false
      } catch {
        // Ignore windows that reject the flag.
      }
    }
  }

  let released = false

  return {
    release() {
      if (released) {
        return
      }

      released = true
      try {
        processInfo.enableAutomaticTermination(reason)
      } catch {
        // Balancing the hold is best-effort on teardown.
      }

      for (const entry of restored) {
        try {
          entry.window.releasedWhenClosed = entry.releasedWhenClosed
        } catch {
          // A closed window may already be gone.
        }
      }

      restored.length = 0
    },
  }
}

/** Native application readiness and quit. */
export const app: DesktopApp = createAppLifecycle('__xplatAppKitLifecycle')
