import { notifications } from '@octane-xplat/notifications'

/** Invoke from a press handler; return the outcome for the caller's UI. */
export async function sendReminder() {
  // 1. Request permission from an explicit user action.
  const result = await notifications.requestPermissions()

  // 2. Send only when permission is granted, and return the result for the UI.
  if (result.granted) {
    notifications.notify('Reminder', 'Your break starts now.')
  }

  return result
}
