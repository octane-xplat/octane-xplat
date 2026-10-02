import { notifications } from '@octane-xplat/notifications'

/** Invoke from a press handler; return the outcome for the caller's UI. */
export async function sendReminder() {
	const result = await notifications.ensure()
	if (result === 'granted') {
		notifications.impl?.notify('Reminder', 'Your break starts now.')
	}

	return result
}
