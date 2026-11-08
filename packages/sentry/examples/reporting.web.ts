/** App-owned reporting policy over the Xplat Sentry wrapper; not an
 *  additional framework export. The shared filter lives in
 *  reporting-filter.ts so the native init file applies the same policy. */
import { sentry } from '@octane-xplat/sentry'
import type { SentryInitOptions } from '@octane-xplat/sentry'
import { filterError } from './reporting-filter'

export { filterError } from './reporting-filter'

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
