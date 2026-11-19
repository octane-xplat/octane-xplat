// Calendar — no web calendar API exists; .ics generation is userland/library
// territory. Honest unsupported leaf.
import type { Calendar, PermissionResult } from './types'

const unsupported = () => Promise.reject(new Error('unsupported: no calendar API on web'))

/** Calendar service — EventKit/CalendarContract. */
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

const toResponse = (status: PermissionResult) => ({
  status,
  granted: status === 'granted',
  canAskAgain: status === 'granted',
})

permissionOwners.calendar = {
  getPermissions: async () => toResponse(await calendar.ensure()),
  requestPermissions: async () => toResponse(await calendar.ensure()),
}
