import { TrayError } from '../tray/errors.js'
import type { AppResidency } from './types.js'

export interface UnsupportedApp {
  showAppWindows(): boolean
  hideAppWindows(): void
  toggleAppWindows(): boolean
  areAppWindowsVisible(): boolean
  keepAppResident(options?: { hideWindowsOnClose?: boolean }): AppResidency
}

export function unsupportedApp(): UnsupportedApp {
  const fail = (): never => {
    throw new TrayError(
      'unsupported-platform',
      'App residency and window visibility need a native desktop runtime; browser and desktop WebView frontends cannot control app windows.',
    )
  }

  return {
    showAppWindows: fail,
    hideAppWindows: fail,
    toggleAppWindows: fail,
    areAppWindowsVisible: fail,
    keepAppResident: fail,
  }
}
