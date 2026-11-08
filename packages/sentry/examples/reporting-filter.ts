/** Shared event filter for the reporting examples — portable TypeScript, so
 *  the same allowlist policy applies on every platform the app ships. */
import type { SentryEvent, SentryFrame } from '@octane-xplat/sentry'

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
