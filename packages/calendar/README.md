# `@octane-xplat/calendar`

```sh
pnpm add @octane-xplat/calendar
```

Device calendar — list calendars, query events by range, create/update/
delete. Custom bridge: EventKit `EKEventStore` on iOS, CalendarContract on
Android (the `nativescript-calendar` plugin is stale). Web and desktop
report `supported: false` — `.ics` file generation is userland.

```ts
import { calendar } from '@octane-xplat/calendar'

if ((await calendar.ensure()) === 'granted') {
	const cals = await calendar.getCalendars()
	const thisWeek = await calendar.getEvents(start, end)
	const id = await calendar.createEvent(undefined, {
		title: 'Flight', startDate, endDate, location: 'SFO',
	})
}
```

Reminders, attendees, and recurring-edit modes are out of scope (Expo models
reminders as a separate entity).
