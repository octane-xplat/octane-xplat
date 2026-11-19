// Calendar — Android leaf, custom bridge (nativescript-calendar is stale).
// CalendarContract through the content provider.
import { Application, Utils } from '@nativescript/core'
import type { PermissionStatus } from '@octane-xplat/platform'
import { android, java } from '@octane-xplat/platform/android'
import type { Calendar, CalendarEvent, CalendarInfo, NewEvent, PermissionResult } from './types'

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

/** Calendar service — CalendarContract. */
export const calendar: Calendar = {
  supported: true,

  ensure(): Promise<PermissionResult> {
    return androidEnsure()
  },

  async getCalendars(): Promise<CalendarInfo[]> {
    return androidCalendars()
  },

  async getDefaultCalendar(): Promise<CalendarInfo | null> {
    return androidCalendars().find((c) => c.isPrimary) ?? androidCalendars()[0] ?? null
  },

  async getEvents(
    startDate: Date,
    endDate: Date,
    calendarIds?: string[],
  ): Promise<CalendarEvent[]> {
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

    if (patch.location) {
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
    resolver()?.delete(
      (android.net.Uri as any).withAppendedId(EVENTS_URI(), Number(id)),
      null,
      null,
    )
  },
}

// Non-prompting authorization read for the dispatcher's getPermissions.
// Android can't distinguish never-asked from denied without the rationale
// hook — report undetermined and let request resolve it.
function androidStatus(): PermissionStatus {
  const activity = Application.android.foregroundActivity ?? Application.android.startActivity

  return activity?.checkSelfPermission?.('android.permission.READ_CALENDAR') ===
    android.content.pm.PackageManager.PERMISSION_GRANTED
    ? 'granted'
    : 'undetermined'
}

const toResponse = (status: PermissionStatus) => ({
  status,
  granted: status === 'granted',
  canAskAgain: status === 'granted' || status === 'undetermined',
})

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})

permissionOwners.calendar = {
  getPermissions: async () => toResponse(androidStatus()),
  requestPermissions: async () => toResponse(await calendar.ensure()),
}
