import type { AppResidency, Tray, TrayAvailability, TrayOptions } from './types.js'
import { unsupportedTray } from './unsupported.js'

export type * from './types.js'
export { TrayError } from './errors.js'

const stub = unsupportedTray(
  'unsupported-platform',
  'System tray needs a native desktop runtime (macOS AppKit or Linux GTK); browser and desktop WebView frontends cannot create a tray icon.',
)

/** Report whether this host can create a tray item. */
export function getTrayAvailability(): Promise<TrayAvailability> {
  return stub.getTrayAvailability()
}

/** Create a tray item; rejects with `TrayError` on unsupported hosts or invalid options. */
export function createTray(options: TrayOptions): Promise<Tray> {
  return stub.createTray(options)
}

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
