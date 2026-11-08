/** App-owned iOS/Android reporting init over the Xplat Sentry wrapper; not an
 *  additional framework export. Pairs with reporting.web.ts — the shared
 *  filter in reporting-filter.ts keeps one collection policy across the
 *  platforms the app ships. */
import { sentry } from '@octane-xplat/sentry'
import type { SentryInitOptions } from '@octane-xplat/sentry'
import { filterError } from './reporting-filter'

export interface NativeReportingConfig {
  dsn: string
  /** Release identifier — use the same value as the source-map upload. */
  release: string
  /** Build identifier within the release (e.g. 'ios-7'); also the upload's
   *  `--dist` value, so events and artifacts join on one identity. */
  dist: string
  environment: string
}

let collecting = false
let initialized = false

/** Call once at native startup, after the app's collection preference allows
 *  reporting. `release`/`dist` must match the values given to
 *  `sentry-cli sourcemaps upload` for the exact installed bundle. */
export function startNativeReporting(config: NativeReportingConfig): void {
  if (initialized || !sentry.supported) {
    return
  }

  const options: SentryInitOptions = {
    ...config,
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
export function reportNativeDeliveryCheck(): string | null {
  if (!collecting) {
    return null
  }

  sentry.addBreadcrumb({ category: 'app-action', message: 'report-delivery-check' })
  return sentry.captureException(new Error('Xplat native reporting check')) ?? null
}

/** Drains queued JavaScript reports, then closes the SDK — on iOS/Android
 *  this also closes the wrapped native SDK, stopping crash capture. */
export async function stopNativeReporting(): Promise<boolean> {
  collecting = false
  try {
    return await sentry.close()
  } finally {
    initialized = false
  }
}
