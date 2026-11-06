/** App-owned reporting policy over the Xplat Sentry wrapper; not an
 *  additional framework export. */
import { sentry } from '@octane-xplat/sentry'
import type { SentryEvent, SentryFrame, SentryInitOptions } from '@octane-xplat/sentry'

export interface ReportingConfig {
  dsn: string
  release: string
  dist: string
  environment: string
}

/** Browser-only data-collection controls — forwarded to @sentry/browser
 *  unchanged; they are not part of the portable wrapper contract. */
type BrowserReportingOptions = SentryInitOptions & {
  dataCollection: {
    userInfo?: boolean
    cookies?: boolean
    httpHeaders?: boolean
    httpBodies?: string[]
    urlQueryParams?: boolean
  }
}

let collecting = false
let initialized = false
const cleanPath = (value: string | undefined) => value?.split(/[?#]/)[0]

/** Keep source locations and build identity; discard free-form application data. */
export function filterError(event: SentryEvent): SentryEvent {
  const frames = (items: SentryFrame[] | undefined) =>
    items?.map((frame) => ({
      filename: cleanPath(frame.filename),
      abs_path: cleanPath(frame.abs_path),
      function: frame.function,
      lineno: frame.lineno,
      colno: frame.colno,
      in_app: frame.in_app,
    }))
  const breadcrumbs = Array.isArray(event.breadcrumbs)
    ? event.breadcrumbs
    : event.breadcrumbs?.values
  return {
    type: event.type,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: 'javascript',
    release: event.release,
    dist: event.dist,
    environment: event.environment,
    level: 'error',
    sdk: event.sdk,
    debug_meta: event.debug_meta,
    message: event.message ? 'Application error' : undefined,
    exception: event.exception
      ? {
          values: event.exception.values?.map((value) => ({
            type: 'Error',
            value: 'Application error',
            stacktrace: value.stacktrace ? { frames: frames(value.stacktrace.frames) } : undefined,
          })),
        }
      : undefined,
    breadcrumbs: breadcrumbs
      ?.filter((b) => b.category === 'app-action' && b.message === 'report-delivery-check')
      .map((b) => ({ category: b.category, message: b.message, timestamp: b.timestamp })),
  }
}

/** Call only after the app's collection preference allows reporting. */
export function startReporting(config: ReportingConfig): void {
  if (initialized) {
    return
  }
  const options: BrowserReportingOptions = {
    ...config,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    sampleRate: 1,
    tracesSampleRate: 0,
    beforeBreadcrumb: (breadcrumb) =>
      collecting &&
      breadcrumb.category === 'app-action' &&
      breadcrumb.message === 'report-delivery-check'
        ? { category: breadcrumb.category, message: breadcrumb.message }
        : null,
    beforeSend: (event) => (collecting ? filterError(event) : null),
  }
  sentry.init(options)
  initialized = true
  collecting = true
}

/** Returns a queued event ID, not a server delivery acknowledgement. */
export function reportDeliveryCheck(): string | null {
  if (!collecting) {
    return null
  }
  sentry.addBreadcrumb({ category: 'app-action', message: 'report-delivery-check' })
  return sentry.captureException(new Error('Xplat reporting check')) ?? null
}

export async function stopReporting(): Promise<boolean> {
  collecting = false
  try {
    return await sentry.close()
  } finally {
    initialized = false
  }
}
