import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { AppResidency } from './types.js'

export interface UnsupportedApp {
  showAppWindows(): boolean
  hideAppWindows(): void
  toggleAppWindows(): boolean
  areAppWindowsVisible(): boolean
  keepAppResident(options?: { hideWindowsOnClose?: boolean }): AppResidency
}

export function unsupportedApp(): UnsupportedApp {
  return {
    showAppWindows() {
      throw new UnavailabilityError('showAppWindows')
    },
    hideAppWindows() {
      throw new UnavailabilityError('hideAppWindows')
    },
    toggleAppWindows() {
      throw new UnavailabilityError('toggleAppWindows')
    },
    areAppWindowsVisible() {
      throw new UnavailabilityError('areAppWindowsVisible')
    },
    keepAppResident() {
      throw new UnavailabilityError('keepAppResident')
    },
  }
}
