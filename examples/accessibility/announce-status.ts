import { announce } from '@octane-xplat/platform'

/** Call after saving succeeds; updateStatus keeps the same message visible. */
export function reportSaved(updateStatus: (text: string) => void): void {
	const message = 'Settings saved' // Use your app's translated message here.
	updateStatus(message)
	announce(message)
}
