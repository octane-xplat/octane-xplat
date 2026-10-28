# @octane-xplat/calendar

Read and edit the device calendar on iOS and Android. Web and desktop report
`supported: false`; this package does not generate calendar invitation files.

## Read upcoming events

Install in an existing Xplat app:

```sh
pnpm add @octane-xplat/calendar
```

Configure the app's calendar privacy declarations before requesting access.
Call the following from an action such as **Show my upcoming events**. The
example uses actual dates and performs no writes:

```ts
import { calendar } from '@octane-xplat/calendar'

export async function upcomingEvents() {
	if (!calendar.supported || (await calendar.ensure()) !== 'granted') return []
	const start = new Date()
	const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
	return calendar.getEvents(start, end)
}
```

With access granted, the result contains events in the requested range.
An empty result may mean no events or, in this example, no access; use a
separate permission message in your screen when that distinction matters.
Event dates are JavaScript `Date` values. Catch and display operation failures
at the action boundary.

The package uses EventKit on iOS and CalendarContract on Android. Reminders,
attendees, and recurring-event edit modes are outside this API. Review the
[public calendar contract](https://github.com/octane-xplat/octane-xplat/blob/main/packages/calendar/src/types.ts)
before adding writes, and [permission handling](https://octane-xplat.goddardai.org/platform-services#the-shared-service-shape)
for the app's unavailable and denied states. Calendar privacy configuration
and device behavior still need verification in the app you ship.
