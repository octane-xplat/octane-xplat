// Calendar — AppKit leaf over EventKit. EKEventStore is bridgeable through
// the JSC host; the API mirrors the iOS leaf's surface (same store class,
// same entity type). Metadata targets macOS 11, so the deprecated
// requestAccessToEntityTypeCompletion is the bound request entry point —
// on macOS 14+ it still performs the full-access events prompt.
import {
	EKEntityType,
	EKEvent,
	EKEventStore,
	EKSpan,
	NSDate,
} from '@octane-xplat/platform/macos'
import type { Calendar, CalendarEvent, CalendarInfo, NewEvent, PermissionResult } from './types'

let store: any = null
const eventStore = () => {
	if (store) {
		return store
	}

	try {
		if (typeof EKEventStore?.authorizationStatusForEntityType !== 'function') {
			return null
		}
		return (store = EKEventStore.new())
	} catch {
		return null
	}
}

// EKAuthorizationStatus: 0 notDetermined 1 restricted 2 denied
// 3 fullAccess/authorized 4 writeOnly
const rawStatus = () =>
	Number(EKEventStore.authorizationStatusForEntityType(EKEntityType.Event ?? 0))

function ensureAccess(): Promise<PermissionResult> {
	const s = eventStore()
	if (!s) {
		return Promise.resolve('unsupported')
	}

	const status = rawStatus()
	if (status === 3 || status === 4) {
		return Promise.resolve('granted')
	}

	if (status === 1 || status === 2) {
		return Promise.resolve('denied')
	}

	return new Promise((resolve) => {
		s.requestAccessToEntityTypeCompletion(EKEntityType.Event ?? 0, (granted: boolean) =>
			resolve(granted ? 'granted' : 'denied'),
		)
	})
}

const permissionResponse = () => {
	const s = eventStore()
	if (!s) {
		return { status: 'unsupported' as const, granted: false, canAskAgain: false }
	}

	const status = rawStatus()
	return {
		status: status === 3 || status === 4 ? ('granted' as const) : status === 0 ? ('undetermined' as const) : ('denied' as const),
		granted: status === 3 || status === 4,
		canAskAgain: status === 0 || status === 3 || status === 4,
	}
}

function calendars(): CalendarInfo[] {
	const s = eventStore()
	const out: CalendarInfo[] = []
	const list = s?.calendarsForEntityType?.(EKEntityType.Event ?? 0)
	for (let i = 0; i < (list?.count ?? 0); i++) {
		const c = list.objectAtIndex(i)
		out.push({
			id: String(c.calendarIdentifier ?? ''),
			title: String(c.title ?? ''),
			color: c.CGColor ? String(c.CGColor) : undefined,
			source: c.source?.title ? String(c.source.title) : undefined,
			allowsModifications: !!c.allowsContentModifications,
			isPrimary: false,
		})
	}

	return out
}

function asEvent(e: any): CalendarEvent {
	return {
		id: String(e.eventIdentifier ?? ''),
		calendarId: e.calendar?.calendarIdentifier ? String(e.calendar.calendarIdentifier) : undefined,
		title: String(e.title ?? ''),
		startDate: new Date((e.startDate?.timeIntervalSince1970 ?? 0) * 1000),
		endDate: new Date((e.endDate?.timeIntervalSince1970 ?? 0) * 1000),
		allDay: !!e.allDay,
		location: e.location ? String(e.location) : undefined,
		notes: e.notes ? String(e.notes) : undefined,
		timeZone: e.timeZone?.name ? String(e.timeZone.name) : undefined,
	}
}

const toNSDate = (date: Date) => NSDate.dateWithTimeIntervalSince1970(date.getTime() / 1000)

/** Calendar service — EventKit/CalendarContract. */
export const calendar: Calendar = {
	get supported() {
		return eventStore() !== null
	},

	ensure(): Promise<PermissionResult> {
		return ensureAccess()
	},

	async getCalendars(): Promise<CalendarInfo[]> {
		return calendars()
	},

	async getDefaultCalendar(): Promise<CalendarInfo | null> {
		const def = eventStore()?.defaultCalendarForNewEvents
		return def
			? {
					id: String(def.calendarIdentifier),
					title: String(def.title ?? ''),
					allowsModifications: !!def.allowsContentModifications,
				}
			: null
	},

	async getEvents(
		startDate: Date,
		endDate: Date,
		calendarIds?: string[],
	): Promise<CalendarEvent[]> {
		const s = eventStore()
		const wanted =
			calendarIds?.length
				? calendarIds
						.map((id) => s?.calendarWithIdentifier?.(id))
						.filter((c: any) => c != null)
				: null
		const predicate = s?.predicateForEventsWithStartDateEndDateCalendars(
			toNSDate(startDate),
			toNSDate(endDate),
			wanted?.length ? wanted : null,
		)
		const list = s?.eventsMatchingPredicate?.(predicate)
		const out: CalendarEvent[] = []
		for (let i = 0; i < (list?.count ?? 0); i++) {
			const e = asEvent(list.objectAtIndex(i))
			if (!calendarIds?.length || calendarIds.includes(e.calendarId ?? '')) {
				out.push(e)
			}
		}

		return out
	},

	async getEvent(id: string): Promise<CalendarEvent | null> {
		const e = eventStore()?.eventWithIdentifier?.(id)
		return e ? asEvent(e) : null
	},

	async createEvent(calendarId: string | undefined, event: NewEvent): Promise<string> {
		const s = eventStore()
		if (!s) {
			throw new Error('calendar.createEvent: EventKit is unavailable on this host')
		}

		const e = EKEvent.eventWithEventStore(s)
		e.title = event.title
		e.startDate = toNSDate(event.startDate)
		e.endDate = toNSDate(event.endDate)
		e.allDay = !!event.allDay
		e.location = (event.location ?? null) as string
		e.notes = (event.notes ?? null) as string
		e.calendar = calendarId
			? (s.calendarWithIdentifier?.(calendarId) ?? s.defaultCalendarForNewEvents)
			: s.defaultCalendarForNewEvents

		if (!s.saveEventSpanError(e, EKSpan.ThisEvent ?? 0, null)) {
			throw new Error('calendar.createEvent: EKEventStore.saveEvent failed')
		}

		return String(e.eventIdentifier ?? '')
	},

	async updateEvent(id: string, patch: Partial<NewEvent>): Promise<string> {
		const s = eventStore()
		const e = s?.eventWithIdentifier?.(id)
		if (!e) {
			throw new Error(`calendar.updateEvent: no event ${id}`)
		}

		if (patch.title !== undefined) {
			e.title = patch.title
		}

		if (patch.startDate) {
			e.startDate = toNSDate(patch.startDate)
		}

		if (patch.endDate) {
			e.endDate = toNSDate(patch.endDate)
		}

		if (patch.allDay !== undefined) {
			e.allDay = patch.allDay
		}

		if (patch.location !== undefined) {
			e.location = patch.location
		}

		if (patch.notes !== undefined) {
			e.notes = patch.notes
		}

		if (!s.saveEventSpanError(e, EKSpan.ThisEvent ?? 0, null)) {
			throw new Error('calendar.updateEvent: EKEventStore.saveEvent failed')
		}

		return id
	},

	async deleteEvent(id: string): Promise<void> {
		const s = eventStore()
		const e = s?.eventWithIdentifier?.(id)
		if (e && !s.removeEventSpanError(e, EKSpan.ThisEvent ?? 0, null)) {
			throw new Error('calendar.deleteEvent: EKEventStore.removeEvent failed')
		}
	},
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.calendar = {
	getPermissions: async () => permissionResponse(),
	requestPermissions: async () => {
		const result = await calendar.ensure()
		return { status: result, granted: result === 'granted', canAskAgain: result === 'granted' }
	},
}
