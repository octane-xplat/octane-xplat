export type PermissionResult = 'granted' | 'denied' | 'unsupported'

export interface CalendarInfo {
	id: string
	title: string
	color?: string
	source?: string
	allowsModifications?: boolean
	isPrimary?: boolean
}

export interface CalendarEvent {
	id: string
	calendarId?: string
	title: string
	startDate: Date
	endDate: Date
	allDay?: boolean
	location?: string
	notes?: string
	timeZone?: string
}

export interface NewEvent {
	title: string
	startDate: Date
	endDate: Date
	allDay?: boolean
	location?: string
	notes?: string
	timeZone?: string
}

export interface Calendar {
	readonly supported: boolean
	ensure(): Promise<PermissionResult>
	getCalendars(): Promise<CalendarInfo[]>
	getDefaultCalendar(): Promise<CalendarInfo | null>
	getEvents(startDate: Date, endDate: Date, calendarIds?: string[]): Promise<CalendarEvent[]>
	getEvent(id: string): Promise<CalendarEvent | null>
	createEvent(calendarId: string | undefined, event: NewEvent): Promise<string>
	updateEvent(id: string, patch: Partial<NewEvent>): Promise<string>
	deleteEvent(id: string): Promise<void>
}

export declare const calendar: Calendar
