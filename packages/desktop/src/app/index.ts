import { unsupportedApp } from './unsupported.js'

import { createAppLifecycle } from './lifecycle.js'
import type { AppResidency, DesktopApp } from './types.js'

export type * from './types.js'

const stub = unsupportedApp()

/** Reveal and focus the app's windows; `false` when no app window exists to show. */
export function showAppWindows(): boolean {
  return stub.showAppWindows()
}

/** Hide the app's visible windows. */
export function hideAppWindows(): void {
  return stub.hideAppWindows()
}

/** Toggle window visibility; returns the visibility after toggling. */
export function toggleAppWindows(): boolean {
  return stub.toggleAppWindows()
}

/** Whether any app window is currently visible. */
export function areAppWindowsVisible(): boolean {
  return stub.areAppWindowsVisible()
}

/** Keep the app running without visible windows until the returned residency releases. */
export function keepAppResident(options?: { hideWindowsOnClose?: boolean }): AppResidency {
  return stub.keepAppResident(options)
}

/**
 * Native application readiness and quit. Requires the framework's AppKit or GTK host.
 * @example
 * ```ts
 * import { app } from '@octane-xplat/desktop'
 * if (app.supported) {
 *   void app.whenReady().then(() => console.log('App is ready'))
 * }
 * ```
 */
export const app: DesktopApp = createAppLifecycle()
