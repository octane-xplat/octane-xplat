import { announce } from '@octane-xplat/platform'

/** Call after saving succeeds; updateStatus keeps the same message visible. */
export function reportSaved(updateStatus: (text: string) => void): void {
  // 1. Choose the same translated message for sighted and screen-reader users.
  const message = 'Settings saved' // Use your app's translated message here.

  // 2. Show the result, then announce it after the save succeeds.
  updateStatus(message)
  announce(message)
}
