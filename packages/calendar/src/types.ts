/** Coarse permission answer; 'unsupported' means the platform has no
 *  calendar/permission path. */
export type PermissionResult = 'granted' | 'denied' | 'unsupported'

/** One calendar account-local store. */
export interface CalendarInfo {
	/** Store-assigned id — pass to getEvents/createEvent. */
	id: string
	/** Display name. */
	title: string
	/** Display color (CSS color where the store exposes one). */
	color?: string
	/** Originating account/source name (iCloud, local, Exchange, …). */
	source?: string
	/** False for read-only stores (subscribed/Birthdays calendars). */
	allowsModifications?: boolean
	/** The store's default calendar. */
	isPrimary?: boolean
}

/** A stored calendar event. */
export interface CalendarEvent {
	/** Store-assigned id — pass to getEvent/updateEvent/deleteEvent. */
	id: string
	/** The owning CalendarInfo.id; absent where the store doesn't report it. */
	calendarId?: string
	/** Display title. */
	title: string
	/** Start instant. */
	startDate: Date
	/** End instant. */
	endDate: Date
	/** All-day flag; all-day dates are date-only values. */
	allDay?: boolean
	/** Free-text location. */
	location?: string
	/** Free-text notes. */
	notes?: string
	/** IANA time-zone name when the store records one. */
	timeZone?: string
}

/** Event fields for createEvent/updateEvent — no store ids. */
export interface NewEvent {
	/** Display title. */
	title: string
	/** Start instant. */
	startDate: Date
	/** End instant. */
	endDate: Date
	/** All-day flag. */
	allDay?: boolean
	/** Free-text location. */
	location?: string
	/** Free-text notes. */
	notes?: string
	/** IANA time-zone name. */
	timeZone?: string
}

/** EventCalendar/EventKit calendar façade; false `supported` off mobile. */
export interface Calendar {
	/** Synchronous fast check — a calendar backend exists. */
	readonly supported: boolean
	/** Ensure calendar permission, prompting if needed. */
	ensure(): Promise<PermissionResult>
	/** Every calendar store visible to the app. */
	getCalendars(): Promise<CalendarInfo[]>
	/** The store's default calendar, or null when none is writable. */
	getDefaultCalendar(): Promise<CalendarInfo | null>
	/** Events overlapping the range, optionally limited to calendar ids. */
	getEvents(startDate: Date, endDate: Date, calendarIds?: string[]): Promise<CalendarEvent[]>
	/** One event by id, or null. */
	getEvent(id: string): Promise<CalendarEvent | null>
	/** Insert an event; resolves the store-assigned event id. Pass
	 *  undefined calendarId for the default calendar. */
	createEvent(calendarId: string | undefined, event: NewEvent): Promise<string>
	/** Patch fields of an existing event; resolves the event id. */
	updateEvent(id: string, patch: Partial<NewEvent>): Promise<string>
	/** Remove an event by id. */
	deleteEvent(id: string): Promise<void>
}

export declare const calendar: Calendar
