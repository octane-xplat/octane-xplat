// Calendar — no web calendar API exists; .ics generation is userland/library
// territory. Honest unsupported leaf.
import type { Calendar, PermissionResult } from './types'

const unsupported = () => Promise.reject(new Error('unsupported: no calendar API on web'))

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

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.calendar = () => calendar.ensure()
