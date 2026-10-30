import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'

// The macOS leaf runs in a vm with stub EventKit globals — the platform
// import (which dlopens the SDK) is stripped like barcode-scanner does.
const SOURCE = readFileSync(new URL('../src/calendar.macos.ts', import.meta.url), 'utf8')
	.replace(/import\s*\{[\s\S]*?\}\s*from '@octane-xplat\/platform\/macos'/, '')
	.replace(/import type.*\n/, '')
	.replace('export const', 'const')

// vm-realm objects trip strict prototype checks — compare plain copies.
const plain = (value: unknown) => JSON.parse(JSON.stringify(value))

function fixture({ status = 3 }: { status?: number } = {}) {
	const calls: Record<string, any[]> = {}
	const record = (name: string, args: any[]) => (calls[name] ??= []).push(args)
	const calendars = [
		{ calendarIdentifier: 'cal-1', title: 'Home', allowsContentModifications: true },
		{ calendarIdentifier: 'cal-2', title: 'Work', allowsContentModifications: false },
	]
	const events: any[] = []
	const store = {
		defaultCalendarForNewEvents: calendars[0],
		calendarsForEntityType: (type: number) => {
			record('calendarsForEntityType', [type])
			return { count: calendars.length, objectAtIndex: (i: number) => calendars[i] }
		},
		calendarWithIdentifier: (id: string) => {
			record('calendarWithIdentifier', [id])
			return calendars.find((c) => c.calendarIdentifier === id) ?? null
		},
		predicateForEventsWithStartDateEndDateCalendars: (begin: any, end: any, cals: any) => {
			record('predicateForEvents', [begin, end, cals])
			return { predicate: true }
		},
		eventsMatchingPredicate: () => ({ count: events.length, objectAtIndex: (i: number) => events[i] }),
		eventWithIdentifier: (id: string) => {
			record('eventWithIdentifier', [id])
			return events.find((e) => e.eventIdentifier === id) ?? null
		},
		saveEventSpanError: (event: any, span: number, error: any) => {
			record('saveEvent', [event, span, error])
			event.eventIdentifier ??= 'new-id'
			return true
		},
		removeEventSpanError: (event: any, span: number, error: any) => {
			record('removeEvent', [event, span, error])
			return true
		},
		requestAccessToEntityTypeCompletion: (type: number, completion: (granted: boolean) => void) => {
			record('requestAccess', [type])
			completion(true)
		},
	}
	const context = vm.createContext({
		EKEntityType: { Event: 0, Reminder: 1 },
		EKSpan: { ThisEvent: 0, FutureEvents: 1 },
		EKEvent: { eventWithEventStore: (s: any) => ({ store: s }) },
		EKEventStore: {
			new: () => store,
			authorizationStatusForEntityType: (type: number) => {
				record('authorizationStatus', [type])
				return status
			},
		},
		NSDate: { dateWithTimeIntervalSince1970: (seconds: number) => ({ seconds }) },
	})
	const leaf = vm.runInContext(stripTypeScriptTypes(SOURCE) + '\ncalendar', context)
	return { leaf, store, calls, events, context }
}

test('supported and ensure map EventKit authorization states', async () => {
	for (const [status, result] of [
		[0, 'granted'],
		[1, 'denied'],
		[2, 'denied'],
		[3, 'granted'],
		[4, 'granted'],
	] as const) {
		const f = fixture({ status })
		assert.equal(f.leaf.supported, true)
		assert.equal(await f.leaf.ensure(), result)
		if (status === 0) {
			assert.deepEqual(f.calls.requestAccess, [[0]])
		}
	}
})

test('missing store reports unsupported and ensures resolve unsupported', async () => {
	const context = vm.createContext({ EKEventStore: undefined })
	const leaf = vm.runInContext(stripTypeScriptTypes(SOURCE) + '\ncalendar', context)
	assert.equal(leaf.supported, false)
	assert.equal(await leaf.ensure(), 'unsupported')
})

test('calendars and the default calendar map store values', async () => {
	const f = fixture()
	assert.deepEqual(plain(await f.leaf.getCalendars()), [
		{ id: 'cal-1', title: 'Home', allowsModifications: true, isPrimary: false },
		{ id: 'cal-2', title: 'Work', allowsModifications: false, isPrimary: false },
	])
	assert.deepEqual(plain(await f.leaf.getDefaultCalendar()), {
		id: 'cal-1',
		title: 'Home',
		allowsModifications: true,
	})
	assert.deepEqual(f.calls.calendarsForEntityType, [[0]])
})

test('getEvents passes resolved calendar objects into the store predicate', async () => {
	const f = fixture()
	f.events.push({
		eventIdentifier: 'e1',
		title: 'Lunch',
		calendar: { calendarIdentifier: 'cal-1' },
		startDate: { timeIntervalSince1970: 1700000000 },
		endDate: { timeIntervalSince1970: 1700003600 },
	})
	const found = await f.leaf.getEvents(new Date(1699999000 * 1000), new Date(1700009000 * 1000), [
		'cal-1',
	])
	assert.equal(found.length, 1)
	assert.equal(found[0].id, 'e1')
	// The predicate received the resolved EKCalendar, not the raw id.
	const [, , cals] = f.calls.predicateForEvents[0]
	assert.equal(cals[0].calendarIdentifier, 'cal-1')
	// A calendar id that cannot resolve still filters matches by id.
	const none = await f.leaf.getEvents(new Date(0), new Date(0), ['missing'])
	assert.equal(none.length, 0)
})

test('create/update/delete drive saveEvent and removeEvent with ThisEvent span', async () => {
	const f = fixture()
	const id = await f.leaf.createEvent('cal-2', {
		title: 'Review',
		startDate: new Date(1700000000 * 1000),
		endDate: new Date(1700003600 * 1000),
	})
	assert.equal(id, 'new-id')
	const [created, span] = f.calls.saveEvent[0]
	assert.equal(created.title, 'Review')
	assert.equal(created.startDate.seconds, 1700000000)
	assert.equal(created.calendar.calendarIdentifier, 'cal-2')
	assert.equal(span, 0)

	created.eventIdentifier = 'e1'
	created.startDate = { timeIntervalSince1970: 1700000000 }
	created.endDate = { timeIntervalSince1970: 1700003600 }
	f.events.push(created)
	assert.equal(await f.leaf.updateEvent('e1', { title: 'Retro' }), 'e1')
	assert.equal(created.title, 'Retro')
	await f.leaf.deleteEvent('e1')
	assert.equal(f.calls.removeEvent.length, 1)
	await assert.rejects(f.leaf.updateEvent('missing', { title: 'x' }), /no event/)
})
