import { notifications } from '@octane-xplat/notifications'

/** Invoke from a press handler; return the outcome for the caller's UI. */
export async function sendReminder() {
	const result = await notifications.requestPermissions()
	if (result.granted) {
		notifications.notify('Reminder', 'Your break starts now.')
	}

	return result
}
