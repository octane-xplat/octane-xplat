import type { NSColor } from './AppKit'

import type { NSArray, NSCopying, NSDate, NSPredicate, NSURL } from './Foundation'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

export declare const CalDateInvalidError: number

export declare const CalCalendarNotEditableError: number

export declare const CalCalendarStoreErrorDomain: string

export declare const CalAlarmActionProcedure: string

export declare const CalAlarmActionEmail: string

export declare const CalAttendeeStatusDeclined: string

export declare const CalAttendeeStatusAccepted: string

export declare const CalDefaultRecurrenceInterval: number

export declare const CalPriorityMedium: number

export declare const CalPriorityHigh: number

export declare const CalPriorityNone: number

export declare const CalCalendarTypeSubscription: string

export declare const CalCalendarTypeLocal: string

export declare const CalCalendarTypeBirthday: string

export declare const CalInsertedRecordsKey: string

export declare const CalTasksChangedExternallyNotification: string

export declare const CalTasksChangedNotification: string

export declare const CalCalendarsChangedNotification: string

export declare const CalAttendeeStatusTentative: string

export declare const CalEventsChangedExternallyNotification: string

export declare const CalCalendarTypeExchange: string

export declare const CalCalendarNotInRepository: number

export declare const CalUserUIDKey: string

export declare const CalDeletedRecordsKey: string

export declare const CalAlarmActionSound: string

export declare const CalCalendarTypeCalDAV: string

export declare const CalAttendeeStatusNeedsAction: string

export declare const CalSenderProcessIDKey: string

export declare const CalAlarmActionDisplay: string

export declare const CalPriorityLow: number

export declare const CalUpdatedRecordsKey: string

export declare const CalEventsChangedNotification: string

export declare const CalCalendarTypeIMAP: string

export declare const CalCalendarsChangedExternallyNotification: string

export declare const CalCalendarTitleNotUniqueError: number

export declare const CalRecurrenceType: {
	Daily: 0
	Weekly: 1
	Monthly: 2
	Yearly: 3
}

export declare const CalSpan: {
	ThisEvent: 0
	FutureEvents: 1
	AllEvents: 2
}

export declare class CalEvent extends CalCalendarItem {
	static event(): interop.Object

	isAllDay: boolean

	location: string

	recurrenceRule: CalRecurrenceRule

	startDate: NSDate

	endDate: NSDate

	readonly attendees: NSArray

	readonly isDetached: boolean

	readonly occurrence: NSDate
}

export declare class CalCalendarStore extends NSObject {
	static defaultCalendarStore(): CalCalendarStore

	calendars(): NSArray

	calendarWithUID(UID: string): CalCalendar

	saveCalendarError(calendar: CalCalendar, error: interop.PointerConvertible): boolean

	removeCalendarError(calendar: CalCalendar, error: interop.PointerConvertible): boolean

	eventsWithPredicate(predicate: NSPredicate): NSArray

	eventWithUIDOccurrence(uid: string, date: NSDate): CalEvent

	tasksWithPredicate(predicate: NSPredicate): NSArray

	taskWithUID(uid: string): CalTask

	saveEventSpanError(
		event: CalEvent,
		span: interop.Enum<typeof CalSpan>,
		error: interop.PointerConvertible,
	): boolean

	removeEventSpanError(
		event: CalEvent,
		span: interop.Enum<typeof CalSpan>,
		error: interop.PointerConvertible,
	): boolean

	saveTaskError(task: CalTask, error: interop.PointerConvertible): boolean

	removeTaskError(task: CalTask, error: interop.PointerConvertible): boolean

	static eventPredicateWithStartDateEndDateCalendars(
		startDate: NSDate,
		endDate: NSDate,
		calendars: NSArray<interop.Object> | Array<interop.Object>,
	): NSPredicate

	static eventPredicateWithStartDateEndDateUIDCalendars(
		startDate: NSDate,
		endDate: NSDate,
		UID: string,
		calendars: NSArray<interop.Object> | Array<interop.Object>,
	): NSPredicate

	static taskPredicateWithCalendars(
		calendars: NSArray<interop.Object> | Array<interop.Object>,
	): NSPredicate

	static taskPredicateWithUncompletedTasks(
		calendars: NSArray<interop.Object> | Array<interop.Object>,
	): NSPredicate

	static taskPredicateWithUncompletedTasksDueBeforeCalendars(
		dueDate: NSDate,
		calendars: NSArray<interop.Object> | Array<interop.Object>,
	): NSPredicate

	static taskPredicateWithTasksCompletedSinceCalendars(
		completedSince: NSDate,
		calendars: NSArray<interop.Object> | Array<interop.Object>,
	): NSPredicate
}

export declare class CalCalendarItem extends NSObject implements NSCopying {
	hasAlarm(): boolean

	nextAlarmDate(): NSDate

	calendar: CalCalendar

	notes: string

	url: NSURL

	title: string

	readonly uid: string

	readonly dateStamp: NSDate

	get alarms(): NSArray
	set alarms(value: NSArray<interop.Object> | Array<interop.Object>)

	addAlarm(alarm: CalAlarm): void

	addAlarms(alarms: NSArray<interop.Object> | Array<interop.Object>): void

	removeAlarm(alarm: CalAlarm): void

	removeAlarms(alarms: NSArray<interop.Object> | Array<interop.Object>): void

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class CalCalendar extends NSObject implements NSCopying {
	static calendar(): interop.Object

	color: NSColor

	notes: string

	title: string

	readonly type: string

	readonly uid: string

	readonly isEditable: boolean

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class CalAttendee extends NSObject implements NSCopying {
	readonly address: NSURL

	readonly commonName: string

	readonly status: string

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class CalNthWeekDay extends NSObject implements NSCopying {
	readonly dayOfTheWeek: number

	readonly weekNumber: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class CalAlarm extends NSObject implements NSCopying {
	static alarm(): interop.Object

	setAcknowledged(date: NSDate): void

	acknowledged(): NSDate

	setRelatedTo(relatedTo: string): void

	relatedTo(): string

	action: string

	sound: string

	emailAddress: string

	url: NSURL

	relativeTrigger: number

	absoluteTrigger: NSDate

	triggerDateRelativeTo(date: NSDate): NSDate

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class CalTask extends CalCalendarItem {
	static task(): interop.Object

	dueDate: NSDate

	priority: number

	isCompleted: boolean

	completedDate: NSDate
}

export declare class CalRecurrenceEnd extends NSObject implements NSCopying {
	static recurrenceEndWithEndDate(endDate: NSDate): interop.Object

	static recurrenceEndWithOccurrenceCount(occurrenceCount: number): interop.Object

	readonly usesEndDate: boolean

	readonly endDate: NSDate

	readonly occurrenceCount: number

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}

export declare class CalRecurrenceRule extends NSObject implements NSCopying {
	initDailyRecurrenceWithIntervalEnd(interval: number, end: CalRecurrenceEnd): this

	initWeeklyRecurrenceWithIntervalEnd(interval: number, end: CalRecurrenceEnd): this

	initWeeklyRecurrenceWithIntervalForDaysOfTheWeekEnd(
		interval: number,
		days: NSArray<interop.Object> | Array<interop.Object>,
		end: CalRecurrenceEnd,
	): this

	initMonthlyRecurrenceWithIntervalEnd(interval: number, end: CalRecurrenceEnd): this

	initMonthlyRecurrenceWithIntervalForDaysOfTheMonthEnd(
		interval: number,
		monthDays: NSArray<interop.Object> | Array<interop.Object>,
		end: CalRecurrenceEnd,
	): this

	initMonthlyRecurrenceWithIntervalForDayOfTheWeekForWeekOfTheMonthEnd(
		interval: number,
		weekDay: number,
		monthWeek: number,
		end: CalRecurrenceEnd,
	): this

	initYearlyRecurrenceWithIntervalEnd(interval: number, end: CalRecurrenceEnd): this

	initYearlyRecurrenceWithIntervalForMonthsOfTheYearEnd(
		interval: number,
		months: NSArray<interop.Object> | Array<interop.Object>,
		end: CalRecurrenceEnd,
	): this

	initYearlyRecurrenceWithIntervalForDayOfTheWeekForWeekOfTheMonthForMonthsOfTheYearEnd(
		interval: number,
		weekDay: number,
		monthWeek: number,
		months: NSArray<interop.Object> | Array<interop.Object>,
		end: CalRecurrenceEnd,
	): this

	readonly recurrenceEnd: CalRecurrenceEnd

	readonly recurrenceType: interop.Enum<typeof CalRecurrenceType>

	readonly recurrenceInterval: number

	readonly firstDayOfTheWeek: number

	readonly daysOfTheWeek: NSArray

	readonly daysOfTheMonth: NSArray

	readonly nthWeekDaysOfTheMonth: NSArray

	readonly monthsOfTheYear: NSArray

	copyWithZone(zone: interop.PointerConvertible): interop.Object
}
