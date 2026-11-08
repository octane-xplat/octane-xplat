import { TrayError } from './errors.js'
import type {
	AppResidency,
	Tray,
	TrayAvailability,
	TrayOptions,
	TrayUnavailableReason,
} from './types.js'

export interface UnsupportedTray {
	getTrayAvailability(): Promise<TrayAvailability>
	createTray(options: TrayOptions): Promise<Tray>
	showAppWindows(): boolean
	hideAppWindows(): void
	toggleAppWindows(): boolean
	areAppWindowsVisible(): boolean
	keepAppResident(options?: { hideWindowsOnClose?: boolean }): AppResidency
}

/** Stub implementations for hosts that can never create a tray. */
export function unsupportedTray(reason: TrayUnavailableReason, message: string): UnsupportedTray {
	const fail = (): never => {
		throw new TrayError(reason, message)
	}
	return {
		getTrayAvailability: () => Promise.resolve({ available: false, reason, message }),
		createTray: () => Promise.reject(new TrayError(reason, message)),
		showAppWindows: fail,
		hideAppWindows: fail,
		toggleAppWindows: fail,
		areAppWindowsVisible: fail,
		keepAppResident: fail,
	}
}
