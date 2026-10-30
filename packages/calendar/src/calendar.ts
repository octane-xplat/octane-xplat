// Calendar — native leaf, custom bridge (nativescript-calendar is stale).
// iOS: EventKit EKEventStore via declare-const bridging (auth-session
// pattern). Android: CalendarContract through the content provider.
import { Application, Utils, isIOS } from '@nativescript/core'
import { android } from '@octane-xplat/platform/android'
import type { Calendar, CalendarEvent, CalendarInfo, NewEvent, PermissionResult } from './types'

declare const EKEventStore: any
declare const EKEntityTypeEvent: number | undefined
declare const EKAuthorizationStatus: any
declare const EKEvent: any
declare const NSPredicate: any
declare const NSDate: any

let store: any = null
const eventStore = () => {
	if (!store && typeof EKEventStore !== 'undefined') {
		store = EKEventStore.new()
	}
	return store
}

function iosEnsure(): Promise<PermissionResult> {
	const s = eventStore()
	if (!s || typeof EKEntityTypeEvent === 'undefined') {
		return Promise.resolve('unsupported')
	}
	const status = EKEventStore.authorizationStatusForEntityType(EKEntityTypeEvent)
	// 0 notDetermined 1 restricted 2 denied 3 fullAccess/authorized 4 writeOnly
	if (status === 3 || status === 4) {
		return Promise.resolve('granted')
	}
	if (status === 1 || status === 2) {
		return Promise.resolve('denied')
	}
	return new Promise((resolve) => {
		if (typeof s.requestFullAccessToEventsWithCompletion === 'function') {
			s.requestFullAccessToEventsWithCompletion((granted: boolean) =>
				resolve(granted ? 'granted' : 'denied'),
			)
		} else {
			s.requestAccessToEntityTypeCompletion(EKEntityTypeEvent, (granted: boolean) =>
				resolve(granted ? 'granted' : 'denied'),
			)
		}
	})
}

let calRequestCode = 7731

function androidEnsure(): Promise<PermissionResult> {
	const perm = 'android.permission.READ_CALENDAR'
	const activity = Application.android.foregroundActivity ?? Application.android.startActivity
	try {
		if (
			activity?.checkSelfPermission?.(perm) === android.content.pm.PackageManager.PERMISSION_GRANTED
		) {
			return Promise.resolve('granted')
		}

		if (!activity) {
			return Promise.resolve('denied')
		}

		return new Promise<PermissionResult>((resolve) => {
			const requestCode = calRequestCode++
			const event = Application.android.activityRequestPermissionsEvent
			const onResult = (args: any) => {
				if (args.requestCode !== requestCode) {
					return
				}
				Application.android.off(event, onResult)
				resolve(
					args.grantResults?.[0] === android.content.pm.PackageManager.PERMISSION_GRANTED
						? 'granted'
						: 'denied',
				)
			}
			Application.android.on(event, onResult)
			try {
				activity.requestPermissions([perm, 'android.permission.WRITE_CALENDAR'], requestCode)
			} catch {
				Application.android.off(event, onResult)
				resolve('denied')
			}
		})
	} catch {
		return Promise.resolve('denied')
	}
}

function iosCalendars(): CalendarInfo[] {
	const s = eventStore()
	const out: CalendarInfo[] = []
	const list = s?.calendarsForEntityType?.(EKEntityTypeEvent ?? 0)
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

function iosEvent(e: any): CalendarEvent {
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

const androidUtils = Utils.android as any
const resolver = () => androidUtils?.getApplicationContext?.()?.getContentResolver()

function androidQuery(
	uri: any,
	projection: string[],
	selection: string,
	args: string[],
	sort: string,
): any[] {
	const cursor = resolver()?.query(uri, projection, selection, args, sort)
	const out: any[] = []
	if (!cursor) {
		return out
	}
	while (cursor.moveToNext()) {
		const row: Record<string, any> = {}
		for (let i = 0; i < cursor.getColumnCount(); i++) {
			row[cursor.getColumnName(i)] = cursor.getString(i)
		}

		out.push(row)
	}
	cursor.close()
	return out
}

const CAL_URI = () => android.provider.CalendarContract.Calendars.CONTENT_URI
const EVENTS_URI = () => android.provider.CalendarContract.Events.CONTENT_URI
const INSTANCES_URI = () => android.provider.CalendarContract.Instances.CONTENT_URI

function androidCalendars(): CalendarInfo[] {
	return androidQuery(
		CAL_URI(),
		[
			'_id',
			'calendar_displayName',
			'calendar_color',
			'account_name',
			'calendar_access_level',
			'isPrimary',
		],
		'',
		[],
		'calendar_displayName ASC',
	).map((row) => ({
		id: String(row._id),
		title: String(row.calendar_displayName ?? ''),
		color: row.calendar_color,
		source: row.account_name,
		allowsModifications: Number(row.calendar_access_level) >= 500,
		isPrimary: row.isPrimary === '1' || row.isPrimary === 'true',
	}))
}

function androidEvent(row: any): CalendarEvent {
	return {
		id: String(row._id ?? row.event_id ?? ''),
		calendarId: row.calendar_id ? String(row.calendar_id) : undefined,
		title: String(row.title ?? ''),
		startDate: new Date(Number(row.dtstart ?? row.begin ?? 0)),
		endDate: new Date(Number(row.dtend ?? row.end ?? 0)),
		allDay: row.allDay === '1' || row.allDay === 1,
		location: row.eventLocation,
		notes: row.description,
	}
}

/** Calendar service — EventKit/CalendarContract. */
export const calendar: Calendar = {
	supported: isIOS ? typeof EKEventStore !== 'undefined' : true,

	ensure(): Promise<PermissionResult> {
		return isIOS ? iosEnsure() : androidEnsure()
	},

	async getCalendars(): Promise<CalendarInfo[]> {
		return isIOS ? iosCalendars() : androidCalendars()
	},

	async getDefaultCalendar(): Promise<CalendarInfo | null> {
		if (isIOS) {
			const s = eventStore()
			const def = s?.defaultCalendarForNewEvents
			return def
				? {
						id: String(def.calendarIdentifier),
						title: String(def.title ?? ''),
						allowsModifications: !!def.allowsContentModifications,
					}
				: null
		}
		return androidCalendars().find((c) => c.isPrimary) ?? androidCalendars()[0] ?? null
	},

	async getEvents(
		startDate: Date,
		endDate: Date,
		calendarIds?: string[],
	): Promise<CalendarEvent[]> {
		if (isIOS) {
			const s = eventStore()
			const begin = NSDate.dateWithTimeIntervalSince1970(startDate.getTime() / 1000)
			const end = NSDate.dateWithTimeIntervalSince1970(endDate.getTime() / 1000)
			const predicate = s.predicateForEventsWithStartDateEndDateCalendars(begin, end, null)
			const list = s.eventsMatchingPredicate(predicate)
			const out: CalendarEvent[] = []
			for (let i = 0; i < (list?.count ?? 0); i++) {
				const e = iosEvent(list.objectAtIndex(i))
				if (!calendarIds?.length || calendarIds.includes(e.calendarId ?? '')) {
					out.push(e)
				}
			}

			return out
		}
		const selection = calendarIds?.length
			? `calendar_id IN (${calendarIds.map(() => '?').join(',')})`
			: ''
		const args = calendarIds ?? []
		return androidQuery(
			INSTANCES_URI(),
			[
				'event_id',
				'calendar_id',
				'title',
				'begin',
				'end',
				'allDay',
				'eventLocation',
				'description',
			],
			selection,
			args,
			'begin ASC',
		)
			.map((row) => androidEvent(row))
			.filter((e) => e.startDate <= endDate && e.endDate >= startDate)
	},

	async getEvent(id: string): Promise<CalendarEvent | null> {
		if (isIOS) {
			const e = eventStore()?.eventWithIdentifier?.(id)
			return e ? iosEvent(e) : null
		}
		const rows = androidQuery(
			(android.net.Uri as any).withAppendedId(EVENTS_URI(), Number(id)),
			['_id', 'calendar_id', 'title', 'dtstart', 'dtend', 'allDay', 'eventLocation', 'description'],
			'',
			[],
			'',
		)
		return rows.length ? androidEvent(rows[0]) : null
	},

	async createEvent(calendarId: string | undefined, event: NewEvent): Promise<string> {
		if (isIOS) {
			const s = eventStore()
			const e = EKEvent.eventWithEventStore(s)
			e.title = event.title
			e.startDate = NSDate.dateWithTimeIntervalSince1970(event.startDate.getTime() / 1000)
			e.endDate = NSDate.dateWithTimeIntervalSince1970(event.endDate.getTime() / 1000)
			e.allDay = !!event.allDay
			e.location = event.location
			e.notes = event.notes
			e.calendar = calendarId
				? (s.calendarWithIdentifier?.(calendarId) ?? s.defaultCalendarForNewEvents)
				: s.defaultCalendarForNewEvents

			if (!s.saveEventSpanError(e, 0, null)) {
				throw new Error('calendar.createEvent: EKEventStore.saveEvent failed')
			}

			return String(e.eventIdentifier ?? '')
		}
		const values = new android.content.ContentValues()
		const def = await calendar.getDefaultCalendar()
		values.put('calendar_id', java.lang.Long.valueOf(calendarId ?? def?.id ?? '0'))
		values.put('title', event.title)
		values.put('dtstart', java.lang.Long.valueOf(event.startDate.getTime()))
		values.put('dtend', java.lang.Long.valueOf(event.endDate.getTime()))
		values.put('allDay', java.lang.Integer.valueOf(event.allDay ? 1 : 0))
		if (event.location) {
			values.put('eventLocation', event.location)
		}
		if (event.notes) {
			values.put('description', event.notes)
		}
		values.put('eventTimezone', event.timeZone ?? 'UTC')
		const uri = resolver()?.insert(EVENTS_URI(), values)
		return uri ? String(uri.getLastPathSegment()) : ''
	},

	async updateEvent(id: string, patch: Partial<NewEvent>): Promise<string> {
		if (isIOS) {
			const s = eventStore()
			const e = s.eventWithIdentifier?.(id)
			if (!e) {
				throw new Error(`calendar.updateEvent: no event ${id}`)
			}

			if (patch.title !== undefined) {
				e.title = patch.title
			}

			if (patch.startDate) {
				e.startDate = NSDate.dateWithTimeIntervalSince1970(patch.startDate.getTime() / 1000)
			}

			if (patch.endDate) {
				e.endDate = NSDate.dateWithTimeIntervalSince1970(patch.endDate.getTime() / 1000)
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

			s.saveEventSpanError(e, 0, null)
			return id
		}
		const values = new android.content.ContentValues()
		if (patch.title !== undefined) {
			values.put('title', patch.title)
		}
		if (patch.startDate) {
			values.put('dtstart', java.lang.Long.valueOf(patch.startDate.getTime()))
		}
		if (patch.endDate) {
			values.put('dtend', java.lang.Long.valueOf(patch.endDate.getTime()))
		}
		if (patch.location !== undefined) {
			values.put('eventLocation', patch.location)
		}
		if (patch.notes !== undefined) {
			values.put('description', patch.notes)
		}
		resolver()?.update(
			(android.net.Uri as any).withAppendedId(EVENTS_URI(), Number(id)),
			values,
			null,
			null,
		)
		return id
	},

	async deleteEvent(id: string): Promise<void> {
		if (isIOS) {
			const s = eventStore()
			const e = s.eventWithIdentifier?.(id)
			if (e) {
				s.removeEventSpanError(e, 0, null)
			}

			return
		}
		resolver()?.delete(
			(android.net.Uri as any).withAppendedId(EVENTS_URI(), Number(id)),
			null,
			null,
		)
	},
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.calendar = () => calendar.ensure()
