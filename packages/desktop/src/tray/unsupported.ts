import { TrayError } from './errors.js'
import type { Tray, TrayAvailability, TrayOptions, TrayUnavailableReason } from './types.js'

export interface UnsupportedTray {
  getTrayAvailability(): Promise<TrayAvailability>
  createTray(options: TrayOptions): Promise<Tray>
}

/** Stub implementations for hosts that can never create a tray. */
export function unsupportedTray(reason: TrayUnavailableReason, message: string): UnsupportedTray {
  return {
    getTrayAvailability: () => Promise.resolve({ available: false, reason, message }),
    createTray: () => Promise.reject(new TrayError(reason, message)),
  }
}
