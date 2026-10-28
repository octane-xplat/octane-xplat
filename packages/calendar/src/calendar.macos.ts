import type { Calendar, PermissionResult } from './types'

const unsupported = () =>
	Promise.reject(new Error('unsupported: calendar is not wired on this platform'))

export const calendar: Calendar = {
	supported: false,
	ensure: async (): Promise<PermissionResult> => 'unsupported',
	getCalendars: unsupported,
	getDefaultCalendar: unsupported,
	getEvents: unsupported,
	getEvent: unsupported,
	createEvent: unsupported,
	updateEvent: unsupported,
	deleteEvent: unsupported,
}
