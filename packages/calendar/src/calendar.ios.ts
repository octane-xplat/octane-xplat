// Calendar — iOS leaf, custom bridge (nativescript-calendar is stale).
// EventKit EKEventStore via declare-const bridging (auth-session pattern).
import type { PermissionStatus } from '@octane-xplat/platform'
import type { Calendar, CalendarEvent, CalendarInfo, NewEvent, PermissionResult } from './types'

declare const EKEventStore: any
declare const EKEntityTypeEvent: number | undefined
declare const EKEvent: any
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

/** Calendar service — EventKit. */
export const calendar: Calendar = {
  supported: typeof EKEventStore !== 'undefined',

  ensure(): Promise<PermissionResult> {
    return iosEnsure()
  },

  async getCalendars(): Promise<CalendarInfo[]> {
    return iosCalendars()
  },

  async getDefaultCalendar(): Promise<CalendarInfo | null> {
    const s = eventStore()
    const def = s?.defaultCalendarForNewEvents

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
  },

  async getEvent(id: string): Promise<CalendarEvent | null> {
    const e = eventStore()?.eventWithIdentifier?.(id)

    return e ? iosEvent(e) : null
  },

  async createEvent(calendarId: string | undefined, event: NewEvent): Promise<string> {
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
  },

  async updateEvent(id: string, patch: Partial<NewEvent>): Promise<string> {
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
  },

  async deleteEvent(id: string): Promise<void> {
    const s = eventStore()
    const e = s.eventWithIdentifier?.(id)

    if (e) {
      s.removeEventSpanError(e, 0, null)
    }
  },
}

// Non-prompting authorization read for the dispatcher's getPermissions.
function iosStatus(): PermissionStatus {
  const s = eventStore()

  if (!s || typeof EKEntityTypeEvent === 'undefined') {
    return 'unsupported'
  }

  // EKAuthorizationStatus: 0 notDetermined, 1 restricted, 2 denied,
  // 3 fullAccess/authorized, 4 writeOnly
  const status = EKEventStore.authorizationStatusForEntityType(EKEntityTypeEvent)

  return status === 3 || status === 4 ? 'granted' : status === 0 ? 'undetermined' : 'denied'
}

const toResponse = (status: PermissionStatus) => ({
  status,
  granted: status === 'granted',
  canAskAgain: status === 'granted' || status === 'undetermined',
})

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})

permissionOwners.calendar = {
  getPermissions: async () => toResponse(iosStatus()),
  requestPermissions: async () => toResponse(await calendar.ensure()),
}
